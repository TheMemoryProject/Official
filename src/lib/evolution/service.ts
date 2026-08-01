import type { PrismaClient } from '@prisma/client';
import { ENGINE_VERSION, type Criticality, type CurrencyStatusValue } from './config';
import {
  propagateChangeEvent,
  type ChangeEventInput,
  type PropagationGraph,
  type PropagationResult,
} from './propagation';
import { computeCurrency, type CurrencyResult, type OpenImpact } from './currency';

/**
 * Persistence layer for the Knowledge Evolution Engine.
 *
 * All judgement lives in the pure functions in propagation.ts and currency.ts. This
 * module only loads inputs, calls them, and writes results — so that behaviour can be
 * tested without a database and replayed years later from the stored engine version.
 */

export interface ReconciliationReport {
  changeEventId: string;
  engineVersion: string;
  dependenciesScanned: number;
  candidatesMatched: number;
  impacted: number;
  skipped: number;
  statusTransitions: number;
  tasksCreated: number;
  historyRecords: number;
  currencyRecomputed: number;
  reconciles: boolean;
  skippedReasons: Array<{ knowledgeId: string; reason: string }>;
}

export class ReconciliationError extends Error {
  constructor(
    message: string,
    public readonly report: ReconciliationReport
  ) {
    super(message);
    this.name = 'ReconciliationError';
  }
}

/** Loads the dependency graph needed to propagate a single change event. */
export async function loadPropagationGraph(
  prisma: PrismaClient,
  event: { dependencyKind: string; subjectIdentifier: string }
): Promise<PropagationGraph> {
  const dependencies = await prisma.knowledgeDependency.findMany({
    orderBy: { id: 'asc' },
  });

  const knowledgeLinks = await prisma.knowledgeDependency.findMany({
    where: { kind: 'KNOWLEDGE' },
    orderBy: { id: 'asc' },
  });

  const currencies = await prisma.knowledgeCurrency.findMany({
    select: { knowledgeId: true, status: true },
  });

  const currentStatus: Record<string, CurrencyStatusValue> = {};
  for (const c of currencies) {
    currentStatus[c.knowledgeId] = c.status as CurrencyStatusValue;
  }

  return {
    dependencies: dependencies.map((d) => ({
      id: d.id,
      knowledgeId: d.knowledgeId,
      kind: d.kind as string,
      targetIdentifier: d.targetIdentifier,
      pinnedRevision: d.pinnedRevision,
      criticality: d.criticality as Criticality,
    })),
    knowledgeLinks: knowledgeLinks
      .filter((d) => d.targetId !== null)
      .map((d) => ({
        fromKnowledgeId: d.knowledgeId,
        toKnowledgeId: d.targetId as string,
        criticality: d.criticality as Criticality,
      })),
    currentStatus,
  };
}

/**
 * Runs propagation for a detected change event and persists the outcome.
 *
 * Rule 1.3: the returned report reconciles candidates matched against impacts plus
 * skips, and against rows actually written. A mismatch throws rather than silently
 * dropping records — the failure mode this rule exists to prevent.
 *
 * The whole run is one transaction, so a reconciliation failure leaves no partial state.
 */
export async function runPropagation(
  prisma: PrismaClient,
  changeEventId: string,
  options: { now?: Date } = {}
): Promise<{ report: ReconciliationReport; result: PropagationResult }> {
  const now = options.now ?? new Date();

  const event = await prisma.changeEvent.findUnique({ where: { id: changeEventId } });
  if (!event) throw new Error(`Change event ${changeEventId} not found`);

  if (event.status === 'PROPAGATED') {
    throw new Error(
      `Change event ${changeEventId} has already been propagated. Propagation is idempotent by refusal, not by silent re-run.`
    );
  }

  const graph = await loadPropagationGraph(prisma, {
    dependencyKind: event.dependencyKind as string,
    subjectIdentifier: event.subjectIdentifier,
  });

  const input: ChangeEventInput = {
    id: event.id,
    type: event.type as string,
    dependencyKind: event.dependencyKind as string,
    subjectIdentifier: event.subjectIdentifier,
    fromRevision: event.fromRevision,
    toRevision: event.toRevision,
  };

  const result = propagateChangeEvent(input, graph);

  let statusTransitions = 0;
  let tasksCreated = 0;
  let historyRecords = 0;
  let currencyRecomputed = 0;

  await prisma.$transaction(async (tx) => {
    for (const impact of result.impacts) {
      await tx.impactAssessment.create({
        data: {
          changeEventId: event.id,
          knowledgeId: impact.knowledgeId,
          dependencyId: impact.dependencyId,
          criticality: impact.criticality as never,
          previousStatus: impact.previousStatus as never,
          newStatus: impact.newStatus as never,
          pathJson: JSON.stringify(impact.path),
          engineVersion: result.engineVersion,
        },
      });

      if (impact.newStatus !== impact.previousStatus) {
        statusTransitions += 1;

        await tx.knowledgeStatusHistory.create({
          data: {
            knowledgeId: impact.knowledgeId,
            fromStatus: impact.previousStatus as never,
            toStatus: impact.newStatus as never,
            reason: impact.reason,
            changeEventId: event.id,
            engineVersion: result.engineVersion,
          },
        });
        historyRecords += 1;
      }

      if (impact.opensTask) {
        await tx.revalidationTask.create({
          data: {
            knowledgeId: impact.knowledgeId,
            changeEventId: event.id,
            criticality: impact.criticality as never,
            reason: impact.reason,
            status: 'OPEN',
          },
        });
        tasksCreated += 1;
      }

      await upsertCurrency(tx as unknown as PrismaClient, impact.knowledgeId, now);
      currencyRecomputed += 1;
    }

    await tx.changeEvent.update({
      where: { id: event.id },
      data: {
        status: 'PROPAGATED',
        propagatedAt: now,
        engineVersion: result.engineVersion,
      },
    });
  });

  const report: ReconciliationReport = {
    changeEventId: event.id,
    engineVersion: result.engineVersion,
    dependenciesScanned: result.dependenciesScanned,
    candidatesMatched: result.directMatches + result.transitiveMatches,
    impacted: result.impacts.length,
    skipped: result.skipped.length,
    statusTransitions,
    tasksCreated,
    historyRecords,
    currencyRecomputed,
    reconciles: result.reconciles && currencyRecomputed === result.impacts.length,
    skippedReasons: result.skipped,
  };

  if (!report.reconciles) {
    throw new ReconciliationError(
      `Propagation of ${event.id} did not reconcile: ${report.candidatesMatched} candidates matched but ` +
        `${report.impacted} impacted + ${report.skipped} skipped were accounted for.`,
      report
    );
  }

  return { report, result };
}

/**
 * Recomputes and persists currency for one knowledge object from its current
 * dependencies, open impacts, and tasks.
 */
export async function upsertCurrency(
  prisma: PrismaClient,
  knowledgeId: string,
  now: Date = new Date()
): Promise<CurrencyResult> {
  const knowledge = await prisma.knowledgeEntry.findUnique({
    where: { id: knowledgeId },
    select: { id: true, createdAt: true, verifiedAt: true },
  });
  if (!knowledge) throw new Error(`Knowledge ${knowledgeId} not found`);

  const existing = await prisma.knowledgeCurrency.findUnique({ where: { knowledgeId } });

  const openTasks = await prisma.revalidationTask.findMany({
    where: { knowledgeId, status: { in: ['OPEN', 'ASSIGNED', 'IN_REVIEW'] } },
    select: { criticality: true, reason: true },
    orderBy: { openedAt: 'asc' },
  });

  const openImpacts: OpenImpact[] = openTasks.map((t) => ({
    criticality: t.criticality as Criticality,
    reason: t.reason,
  }));

  const status: CurrencyStatusValue =
    (existing?.status as CurrencyStatusValue | undefined) ??
    (openTasks.length > 0 ? 'REVALIDATION_REQUIRED' : 'CURRENT');

  const effectiveStatus: CurrencyStatusValue =
    openTasks.length > 0 && status === 'CURRENT' ? 'REVALIDATION_REQUIRED' : status;

  const evidenceClass = await strongestEvidenceClass(prisma, knowledgeId);

  const result = computeCurrency({
    knowledgeId,
    evidenceClass,
    lastVerifiedAt: existing?.lastRevalidatedAt ?? knowledge.verifiedAt,
    createdAt: knowledge.createdAt,
    status: effectiveStatus,
    openImpacts,
    openTaskCount: openTasks.length,
    blockingTaskCount: openTasks.filter((t) => t.criticality === 'BLOCKING').length,
    now,
  });

  await prisma.knowledgeCurrency.upsert({
    where: { knowledgeId },
    create: {
      knowledgeId,
      status: result.status as never,
      currencyScore: result.currencyScore,
      decayComponent: result.decayComponent,
      impactComponent: result.impactComponent,
      openTaskCount: result.openTaskCount,
      blockingTaskCount: result.blockingTaskCount,
      ageDays: result.ageDays,
      lastRevalidatedAt: existing?.lastRevalidatedAt ?? null,
      breakdownJson: JSON.stringify(result.breakdown),
      engineVersion: result.engineVersion,
      computedAt: now,
    },
    update: {
      status: result.status as never,
      currencyScore: result.currencyScore,
      decayComponent: result.decayComponent,
      impactComponent: result.impactComponent,
      openTaskCount: result.openTaskCount,
      blockingTaskCount: result.blockingTaskCount,
      ageDays: result.ageDays,
      breakdownJson: JSON.stringify(result.breakdown),
      engineVersion: result.engineVersion,
      computedAt: now,
    },
  });

  return result;
}

/**
 * The strongest evidence class supporting a knowledge object determines its decay
 * half-life. Absent any declared evidence dependency we assume UNKNOWN, which decays
 * fastest — failing closed rather than flattering undocumented knowledge.
 */
const EVIDENCE_STRENGTH_ORDER = [
  'ANALYTICAL_DERIVATION',
  'PEER_REVIEWED',
  'PHYSICAL_TEST',
  'PUBLISHED_STANDARD',
  'QUALIFIED_SIMULATION',
  'FIELD_DATA',
  'INTERNAL_REPORT',
  'EXPERT_ASSERTION',
  'VENDOR_CLAIM',
  'ANECDOTE',
];

async function strongestEvidenceClass(
  prisma: PrismaClient,
  knowledgeId: string
): Promise<string> {
  const deps = await prisma.knowledgeDependency.findMany({
    where: { knowledgeId, kind: 'EVIDENCE' },
    select: { targetIdentifier: true },
  });

  const classes = deps
    .map((d) => d.targetIdentifier.toUpperCase())
    .filter((c) => EVIDENCE_STRENGTH_ORDER.includes(c));

  if (classes.length === 0) return 'UNKNOWN';

  classes.sort(
    (a, b) => EVIDENCE_STRENGTH_ORDER.indexOf(a) - EVIDENCE_STRENGTH_ORDER.indexOf(b)
  );
  return classes[0];
}

/**
 * Recomputes currency for every knowledge object. Used by the scheduled decay sweep
 * and by the reproducibility test, which asserts recomputation reproduces stored
 * values exactly. Any drift is a build failure.
 */
export async function recomputeAllCurrency(
  prisma: PrismaClient,
  now: Date = new Date()
): Promise<{ recomputed: number; drifted: string[] }> {
  const entries = await prisma.knowledgeEntry.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  const drifted: string[] = [];

  for (const entry of entries) {
    const before = await prisma.knowledgeCurrency.findUnique({
      where: { knowledgeId: entry.id },
    });

    const after = await upsertCurrency(prisma, entry.id, now);

    if (before && before.currencyScore !== after.currencyScore) {
      drifted.push(entry.id);
    }
  }

  return { recomputed: entries.length, drifted };
}

/**
 * Resolves a revalidation task and records why. Resolution is the only way an object
 * returns to CURRENT — decay alone never restores currency, because time does not
 * re-verify anything.
 */
export async function resolveRevalidationTask(
  prisma: PrismaClient,
  taskId: string,
  resolution: {
    status: 'RESOLVED_CONFIRMED' | 'RESOLVED_AMENDED' | 'RESOLVED_RETIRED' | 'DISMISSED';
    resolvedById: string;
    rationale: string;
  },
  now: Date = new Date()
): Promise<{ knowledgeId: string; newStatus: CurrencyStatusValue }> {
  if (!resolution.rationale || resolution.rationale.trim().length < 10) {
    throw new Error(
      'A revalidation resolution requires a rationale of at least 10 characters. ' +
        'An unexplained resolution is not an audit trail.'
    );
  }

  const task = await prisma.revalidationTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error(`Revalidation task ${taskId} not found`);
  if (task.status.startsWith('RESOLVED') || task.status === 'DISMISSED') {
    throw new Error(`Task ${taskId} is already resolved (${task.status})`);
  }

  const currency = await prisma.knowledgeCurrency.findUnique({
    where: { knowledgeId: task.knowledgeId },
  });
  const previousStatus = (currency?.status as CurrencyStatusValue) ?? 'CURRENT';

  const remainingOpen = await prisma.revalidationTask.count({
    where: {
      knowledgeId: task.knowledgeId,
      status: { in: ['OPEN', 'ASSIGNED', 'IN_REVIEW'] },
      id: { not: taskId },
    },
  });

  const newStatus: CurrencyStatusValue =
    resolution.status === 'RESOLVED_RETIRED'
      ? 'RETIRED'
      : remainingOpen > 0
        ? 'REVALIDATION_REQUIRED'
        : 'CURRENT';

  await prisma.$transaction(async (tx) => {
    await tx.revalidationTask.update({
      where: { id: taskId },
      data: {
        status: resolution.status as never,
        resolvedAt: now,
        resolvedById: resolution.resolvedById,
        resolutionRationale: resolution.rationale,
      },
    });

    await tx.knowledgeStatusHistory.create({
      data: {
        knowledgeId: task.knowledgeId,
        fromStatus: previousStatus as never,
        toStatus: newStatus as never,
        reason: `Revalidation ${resolution.status}: ${resolution.rationale}`,
        taskId,
        changeEventId: task.changeEventId,
        actorId: resolution.resolvedById,
        engineVersion: ENGINE_VERSION,
      },
    });

    await tx.knowledgeCurrency.upsert({
      where: { knowledgeId: task.knowledgeId },
      create: {
        knowledgeId: task.knowledgeId,
        status: newStatus as never,
        currencyScore: 0,
        decayComponent: 0,
        impactComponent: 0,
        breakdownJson: '[]',
        engineVersion: ENGINE_VERSION,
        lastRevalidatedAt: newStatus === 'CURRENT' ? now : null,
      },
      update: {
        status: newStatus as never,
        lastRevalidatedAt: newStatus === 'CURRENT' ? now : currency?.lastRevalidatedAt ?? null,
      },
    });
  });

  await upsertCurrency(prisma, task.knowledgeId, now);

  return { knowledgeId: task.knowledgeId, newStatus };
}
