import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, type TestDb } from './helpers/test-db';
import {
  createBaseFixtures,
  createKnowledge,
  declareDependency,
  recordChangeEvent,
  type BaseFixtures,
} from './helpers/fixtures';
import {
  runPropagation,
  resolveRevalidationTask,
  recomputeAllCurrency,
  upsertCurrency,
} from '@/lib/evolution/service';

/**
 * End-to-end integration tests for the Knowledge Evolution Engine.
 *
 * Per Rule 2 these start at the system boundary — a change event landing in the
 * database — and assert on persisted state. Real Postgres, real schema, real Prisma
 * Client. Nothing under test is mocked.
 *
 * The scenario throughout is the one that motivates the whole feature: a solution was
 * verified in 2018; the world has since moved; KTN must notice.
 */

let db: TestDb;
let base: BaseFixtures;

beforeEach(async () => {
  db = await createTestDb();
  base = await createBaseFixtures(db.prisma);
}, 120_000);

afterEach(async () => {
  await db?.close();
});

describe('change event propagation', () => {
  it('flags knowledge whose governing standard was revised, and records why', async () => {
    const knowledgeId = await createKnowledge(db.prisma, base, {
      title: 'SYNTHETIC weld inspection interval',
      verifiedAt: new Date('2018-06-01'),
    });

    await declareDependency(db.prisma, {
      knowledgeId,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
      pinnedRevision: '2014',
      criticality: 'MAJOR',
    });

    const eventId = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_REVISED',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'ISO 5817',
      fromRevision: '2014',
      toRevision: '2026',
    });

    const { report } = await runPropagation(db.prisma, eventId);

    expect(report.impacted).toBe(1);
    expect(report.reconciles).toBe(true);
    expect(report.statusTransitions).toBe(1);
    expect(report.tasksCreated).toBe(1);

    // Status actually moved in the database.
    const currency = await db.prisma.knowledgeCurrency.findUnique({ where: { knowledgeId } });
    expect(currency?.status).toBe('REVALIDATION_REQUIRED');

    // A human work item exists.
    const tasks = await db.prisma.revalidationTask.findMany({ where: { knowledgeId } });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe('OPEN');

    // The audit trail explains itself.
    const history = await db.prisma.knowledgeStatusHistory.findMany({ where: { knowledgeId } });
    expect(history).toHaveLength(1);
    expect(history[0].fromStatus).toBe('CURRENT');
    expect(history[0].toStatus).toBe('REVALIDATION_REQUIRED');
    expect(history[0].reason).toContain('ISO 5817');
    expect(history[0].engineVersion).toBeTruthy();

    // The impact assessment retains the full path for replay.
    const impacts = await db.prisma.impactAssessment.findMany({ where: { knowledgeId } });
    expect(impacts).toHaveLength(1);
    expect(JSON.parse(impacts[0].pathJson)).toHaveLength(1);

    const event = await db.prisma.changeEvent.findUnique({ where: { id: eventId } });
    expect(event?.status).toBe('PROPAGATED');
    expect(event?.propagatedAt).toBeTruthy();
  });

  it('leaves unrelated knowledge completely untouched', async () => {
    const affected = await createKnowledge(db.prisma, base, { title: 'SYNTHETIC affected' });
    const unrelated = await createKnowledge(db.prisma, base, { title: 'SYNTHETIC unrelated' });

    await declareDependency(db.prisma, {
      knowledgeId: affected,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
    });
    await declareDependency(db.prisma, {
      knowledgeId: unrelated,
      kind: 'STANDARD',
      targetIdentifier: 'ASME BPVC VIII',
    });

    const eventId = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_REVISED',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'ISO 5817',
    });

    await runPropagation(db.prisma, eventId);

    expect(
      await db.prisma.revalidationTask.count({ where: { knowledgeId: unrelated } })
    ).toBe(0);
    expect(
      await db.prisma.knowledgeStatusHistory.count({ where: { knowledgeId: unrelated } })
    ).toBe(0);
  });

  it('traces impact through a chain of derived knowledge', async () => {
    // k3 derives from k2 derives from k1, which depends on the standard.
    const k1 = await createKnowledge(db.prisma, base, { title: 'SYNTHETIC base claim' });
    const k2 = await createKnowledge(db.prisma, base, { title: 'SYNTHETIC derived once' });
    const k3 = await createKnowledge(db.prisma, base, { title: 'SYNTHETIC derived twice' });

    await declareDependency(db.prisma, {
      knowledgeId: k1,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
      criticality: 'BLOCKING',
    });
    await declareDependency(db.prisma, {
      knowledgeId: k2,
      kind: 'KNOWLEDGE',
      targetIdentifier: k1,
      targetId: k1,
      criticality: 'BLOCKING',
    });
    await declareDependency(db.prisma, {
      knowledgeId: k3,
      kind: 'KNOWLEDGE',
      targetIdentifier: k2,
      targetId: k2,
      criticality: 'BLOCKING',
    });

    const eventId = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_WITHDRAWN',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'ISO 5817',
    });

    const { report } = await runPropagation(db.prisma, eventId);

    expect(report.impacted).toBe(3);
    expect(report.reconciles).toBe(true);

    const k3Impact = await db.prisma.impactAssessment.findFirst({ where: { knowledgeId: k3 } });
    expect(k3Impact).toBeTruthy();

    const path = JSON.parse(k3Impact!.pathJson);
    expect(path).toHaveLength(3);
    expect(path[0].knowledgeId).toBe(k1);
    expect(path[2].knowledgeId).toBe(k3);
  });

  it('refuses to propagate the same event twice', async () => {
    const eventId = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_REVISED',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'ISO 5817',
    });

    await runPropagation(db.prisma, eventId);
    await expect(runPropagation(db.prisma, eventId)).rejects.toThrow(/already been propagated/);
  });

  it('does not double-count when two events hit the same knowledge', async () => {
    const knowledgeId = await createKnowledge(db.prisma, base);

    await declareDependency(db.prisma, {
      knowledgeId,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
    });
    await declareDependency(db.prisma, {
      knowledgeId,
      kind: 'MATERIAL',
      targetIdentifier: 'AMS 4928',
    });

    const e1 = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_REVISED',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'ISO 5817',
    });
    const e2 = await recordChangeEvent(db.prisma, {
      type: 'MATERIAL_SPEC_CHANGED',
      dependencyKind: 'MATERIAL',
      subjectIdentifier: 'AMS 4928',
    });

    await runPropagation(db.prisma, e1);
    await runPropagation(db.prisma, e2);

    const tasks = await db.prisma.revalidationTask.findMany({ where: { knowledgeId } });
    expect(tasks).toHaveLength(2); // two distinct causes, two work items

    // But the currency penalty is applied per tier, not per task.
    const currency = await db.prisma.knowledgeCurrency.findUnique({ where: { knowledgeId } });
    const breakdown = JSON.parse(currency!.breakdownJson) as Array<{ label: string }>;
    const majorTerms = breakdown.filter((t) => t.label.includes('MAJOR'));
    expect(majorTerms).toHaveLength(1);
  });
});

describe('revalidation workflow', () => {
  async function flaggedKnowledge() {
    const knowledgeId = await createKnowledge(db.prisma, base, {
      verifiedAt: new Date('2025-01-01'),
    });
    await declareDependency(db.prisma, {
      knowledgeId,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
    });
    const eventId = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_REVISED',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'ISO 5817',
    });
    await runPropagation(db.prisma, eventId);

    const task = await db.prisma.revalidationTask.findFirstOrThrow({ where: { knowledgeId } });
    return { knowledgeId, taskId: task.id };
  }

  it('restores knowledge to CURRENT when a reviewer confirms it still holds', async () => {
    const { knowledgeId, taskId } = await flaggedKnowledge();

    const result = await resolveRevalidationTask(db.prisma, taskId, {
      status: 'RESOLVED_CONFIRMED',
      resolvedById: base.reviewerId,
      rationale: 'Reviewed the 2026 revision; clause 6.2 is unchanged for our joint class.',
    });

    expect(result.newStatus).toBe('CURRENT');

    const currency = await db.prisma.knowledgeCurrency.findUnique({ where: { knowledgeId } });
    expect(currency?.status).toBe('CURRENT');
    expect(currency?.lastRevalidatedAt).toBeTruthy();

    // Revalidation resets the decay clock, so currency recovers.
    expect(currency!.currencyScore).toBeGreaterThan(90);
  });

  it('retires knowledge when a reviewer determines it no longer holds', async () => {
    const { knowledgeId, taskId } = await flaggedKnowledge();

    await resolveRevalidationTask(db.prisma, taskId, {
      status: 'RESOLVED_RETIRED',
      resolvedById: base.reviewerId,
      rationale: 'The 2026 revision prohibits this inspection interval outright.',
    });

    const currency = await db.prisma.knowledgeCurrency.findUnique({ where: { knowledgeId } });
    expect(currency?.status).toBe('RETIRED');
    expect(currency?.currencyScore).toBe(0);
  });

  it('keeps knowledge flagged while any other task remains open', async () => {
    const knowledgeId = await createKnowledge(db.prisma, base);

    await declareDependency(db.prisma, { knowledgeId, kind: 'STANDARD', targetIdentifier: 'S1' });
    await declareDependency(db.prisma, { knowledgeId, kind: 'MATERIAL', targetIdentifier: 'M1' });

    const e1 = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_REVISED',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'S1',
    });
    const e2 = await recordChangeEvent(db.prisma, {
      type: 'MATERIAL_SPEC_CHANGED',
      dependencyKind: 'MATERIAL',
      subjectIdentifier: 'M1',
    });
    await runPropagation(db.prisma, e1);
    await runPropagation(db.prisma, e2);

    const tasks = await db.prisma.revalidationTask.findMany({
      where: { knowledgeId },
      orderBy: { openedAt: 'asc' },
    });

    const result = await resolveRevalidationTask(db.prisma, tasks[0].id, {
      status: 'RESOLVED_CONFIRMED',
      resolvedById: base.reviewerId,
      rationale: 'Standard revision does not affect this conclusion.',
    });

    expect(result.newStatus).toBe('REVALIDATION_REQUIRED');
  });

  it('refuses an unexplained resolution', async () => {
    const { taskId } = await flaggedKnowledge();

    await expect(
      resolveRevalidationTask(db.prisma, taskId, {
        status: 'RESOLVED_CONFIRMED',
        resolvedById: base.reviewerId,
        rationale: 'ok',
      })
    ).rejects.toThrow(/rationale/i);
  });

  it('refuses to resolve an already-resolved task', async () => {
    const { taskId } = await flaggedKnowledge();

    await resolveRevalidationTask(db.prisma, taskId, {
      status: 'RESOLVED_CONFIRMED',
      resolvedById: base.reviewerId,
      rationale: 'Confirmed against the new revision without changes.',
    });

    await expect(
      resolveRevalidationTask(db.prisma, taskId, {
        status: 'RESOLVED_AMENDED',
        resolvedById: base.reviewerId,
        rationale: 'Trying to resolve a second time should fail.',
      })
    ).rejects.toThrow(/already resolved/i);
  });

  it('preserves a complete, ordered history of why status changed', async () => {
    const { knowledgeId, taskId } = await flaggedKnowledge();

    await resolveRevalidationTask(db.prisma, taskId, {
      status: 'RESOLVED_AMENDED',
      resolvedById: base.reviewerId,
      rationale: 'Updated the interval from 12 to 9 months per the 2026 revision.',
    });

    const history = await db.prisma.knowledgeStatusHistory.findMany({
      where: { knowledgeId },
      orderBy: { createdAt: 'asc' },
    });

    expect(history).toHaveLength(2);
    expect(history[0].toStatus).toBe('REVALIDATION_REQUIRED');
    expect(history[1].toStatus).toBe('CURRENT');
    expect(history[1].reason).toContain('Updated the interval');
    expect(history[1].actorId).toBe(base.reviewerId);
  });
});

describe('currency reproducibility', () => {
  it('reproduces stored scores exactly on recomputation', async () => {
    const now = new Date('2026-08-01T00:00:00Z');

    const a = await createKnowledge(db.prisma, base, { verifiedAt: new Date('2018-01-01') });
    const b = await createKnowledge(db.prisma, base, { verifiedAt: new Date('2024-01-01') });
    const c = await createKnowledge(db.prisma, base, { verifiedAt: null });

    await declareDependency(db.prisma, {
      knowledgeId: a,
      kind: 'EVIDENCE',
      targetIdentifier: 'PHYSICAL_TEST',
    });

    for (const id of [a, b, c]) {
      await upsertCurrency(db.prisma, id, now);
    }

    const before = await db.prisma.knowledgeCurrency.findMany({ orderBy: { knowledgeId: 'asc' } });

    const { recomputed, drifted } = await recomputeAllCurrency(db.prisma, now);

    expect(recomputed).toBe(3);
    expect(drifted).toEqual([]); // any drift is a build failure

    const after = await db.prisma.knowledgeCurrency.findMany({ orderBy: { knowledgeId: 'asc' } });

    for (let i = 0; i < before.length; i++) {
      expect(after[i].currencyScore).toBe(before[i].currencyScore);
      expect(after[i].decayComponent).toBe(before[i].decayComponent);
      expect(after[i].breakdownJson).toBe(before[i].breakdownJson);
      expect(after[i].engineVersion).toBe(before[i].engineVersion);
    }
  });

  it('uses the strongest declared evidence class to set the decay rate', async () => {
    const now = new Date('2026-08-01T00:00:00Z');

    const weak = await createKnowledge(db.prisma, base, { verifiedAt: new Date('2024-01-01') });
    const strong = await createKnowledge(db.prisma, base, { verifiedAt: new Date('2024-01-01') });

    await declareDependency(db.prisma, {
      knowledgeId: weak,
      kind: 'EVIDENCE',
      targetIdentifier: 'VENDOR_CLAIM',
    });
    await declareDependency(db.prisma, {
      knowledgeId: strong,
      kind: 'EVIDENCE',
      targetIdentifier: 'ANALYTICAL_DERIVATION',
    });

    const weakResult = await upsertCurrency(db.prisma, weak, now);
    const strongResult = await upsertCurrency(db.prisma, strong, now);

    expect(weakResult.currencyScore).toBeLessThan(strongResult.currencyScore);
  });

  it('treats knowledge with no declared evidence as UNKNOWN, failing closed', async () => {
    const now = new Date('2026-08-01T00:00:00Z');
    const id = await createKnowledge(db.prisma, base, { verifiedAt: new Date('2024-01-01') });

    const result = await upsertCurrency(db.prisma, id, now);

    // UNKNOWN has the shortest half-life of the defaults, so undocumented knowledge
    // decays fastest rather than being flattered by the absence of information.
    expect(result.decay.evidenceClass).toBe('UNKNOWN');
    expect(result.currencyScore).toBeLessThan(50);
  });
});

describe('reconciliation (Rule 1.3)', () => {
  it('accounts for every candidate as either impacted or skipped, with reasons', async () => {
    const impacted = await createKnowledge(db.prisma, base);
    const pinnedElsewhere = await createKnowledge(db.prisma, base);
    const retired = await createKnowledge(db.prisma, base);

    await declareDependency(db.prisma, {
      knowledgeId: impacted,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
      pinnedRevision: '2014',
    });
    await declareDependency(db.prisma, {
      knowledgeId: pinnedElsewhere,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
      pinnedRevision: '2003',
    });
    await declareDependency(db.prisma, {
      knowledgeId: retired,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
      pinnedRevision: '2014',
    });

    await db.prisma.knowledgeCurrency.create({
      data: {
        knowledgeId: retired,
        status: 'RETIRED',
        currencyScore: 0,
        decayComponent: 0,
        impactComponent: 0,
        breakdownJson: '[]',
        engineVersion: 'test',
      },
    });

    const eventId = await recordChangeEvent(db.prisma, {
      type: 'STANDARD_REVISED',
      dependencyKind: 'STANDARD',
      subjectIdentifier: 'ISO 5817',
      fromRevision: '2014',
      toRevision: '2026',
    });

    const { report } = await runPropagation(db.prisma, eventId);

    expect(report.candidatesMatched).toBe(3);
    expect(report.impacted).toBe(1);
    expect(report.skipped).toBe(2);
    expect(report.impacted + report.skipped).toBe(report.candidatesMatched);
    expect(report.reconciles).toBe(true);

    // Every skip states its reason. Silent drops are the failure this rule prevents.
    expect(report.skippedReasons).toHaveLength(2);
    for (const s of report.skippedReasons) {
      expect(s.reason.length).toBeGreaterThan(10);
    }

    const reasons = report.skippedReasons.map((s) => s.reason).join(' | ');
    expect(reasons).toMatch(/pinned/i);
    expect(reasons).toMatch(/RETIRED/);
  });

  it('persists exactly as many rows as the report claims', async () => {
    const ids = await Promise.all([
      createKnowledge(db.prisma, base),
      createKnowledge(db.prisma, base),
      createKnowledge(db.prisma, base),
    ]);

    for (const id of ids) {
      await declareDependency(db.prisma, {
        knowledgeId: id,
        kind: 'PROCESS',
        targetIdentifier: 'EB-WELD-2',
        criticality: 'BLOCKING',
      });
    }

    const eventId = await recordChangeEvent(db.prisma, {
      type: 'PROCESS_CHANGED',
      dependencyKind: 'PROCESS',
      subjectIdentifier: 'EB-WELD-2',
    });

    const { report } = await runPropagation(db.prisma, eventId);

    const impacts = await db.prisma.impactAssessment.count({ where: { changeEventId: eventId } });
    const tasks = await db.prisma.revalidationTask.count({ where: { changeEventId: eventId } });
    const history = await db.prisma.knowledgeStatusHistory.count({
      where: { changeEventId: eventId },
    });
    const currencies = await db.prisma.knowledgeCurrency.count();

    expect(impacts).toBe(report.impacted);
    expect(tasks).toBe(report.tasksCreated);
    expect(history).toBe(report.historyRecords);
    expect(currencies).toBe(report.currencyRecomputed);
  });
});
