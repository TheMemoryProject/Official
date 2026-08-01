import {
  ENGINE_VERSION,
  changeTypeFloor,
  createsTask,
  maxCriticality,
  transitionFor,
  type Criticality,
  type CurrencyStatusValue,
} from './config';

/**
 * Deterministic impact propagation.
 *
 * Given a change event and the declared dependency graph, decide exactly which
 * knowledge objects are affected, at what criticality, and what status they move to.
 *
 * This is a pure function. It performs no I/O, consults no model, and returns the same
 * result for the same inputs forever. The service layer is responsible for loading the
 * graph and persisting the outcome; all of the judgement lives here so it can be
 * tested and replayed.
 */

export interface DependencyNode {
  id: string;
  knowledgeId: string;
  kind: string;
  targetIdentifier: string;
  pinnedRevision: string | null;
  criticality: Criticality;
}

/** A knowledge object deriving from another knowledge object. */
export interface KnowledgeLink {
  fromKnowledgeId: string; // dependent
  toKnowledgeId: string; // depended upon
  criticality: Criticality;
}

export interface ChangeEventInput {
  id: string;
  type: string;
  dependencyKind: string;
  subjectIdentifier: string;
  fromRevision: string | null;
  toRevision: string | null;
}

export interface PropagationGraph {
  dependencies: DependencyNode[];
  knowledgeLinks: KnowledgeLink[];
  currentStatus: Record<string, CurrencyStatusValue>;
}

export interface ImpactPathStep {
  knowledgeId: string;
  via: string;
  criticality: Criticality;
}

export interface ImpactResult {
  knowledgeId: string;
  dependencyId: string | null;
  criticality: Criticality;
  depth: number;
  path: ImpactPathStep[];
  previousStatus: CurrencyStatusValue;
  newStatus: CurrencyStatusValue;
  opensTask: boolean;
  reason: string;
}

export interface SkippedResult {
  knowledgeId: string;
  reason: string;
}

export interface PropagationResult {
  changeEventId: string;
  engineVersion: string;
  /** Every dependency row considered. */
  dependenciesScanned: number;
  /** Dependencies whose identifier and kind matched the event subject. */
  directMatches: number;
  /** Knowledge objects reached transitively through knowledge-to-knowledge links. */
  transitiveMatches: number;
  impacts: ImpactResult[];
  skipped: SkippedResult[];
  /** Reconciliation: directMatches + transitiveMatches === impacts + skipped. */
  reconciles: boolean;
}

/**
 * Statuses that are terminal for propagation purposes. A retired or superseded object
 * is not dragged back into review by a new change event; its history is preserved but
 * it is no longer live knowledge.
 */
const TERMINAL_STATUSES: ReadonlySet<CurrencyStatusValue> = new Set<CurrencyStatusValue>([
  'SUPERSEDED',
  'RETIRED',
]);

/** Case- and whitespace-insensitive identity match on external identifiers. */
function identifierMatches(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * A dependency pinned to a specific revision is only impacted when the change moves
 * away from that revision. A dependency with no pin is impacted by any revision change,
 * because we cannot prove it was not relying on the old text.
 */
function revisionIsRelevant(dep: DependencyNode, event: ChangeEventInput): boolean {
  if (!dep.pinnedRevision) return true;
  if (!event.fromRevision) return true;
  return identifierMatches(dep.pinnedRevision, event.fromRevision);
}

export function propagateChangeEvent(
  event: ChangeEventInput,
  graph: PropagationGraph
): PropagationResult {
  const impacts: ImpactResult[] = [];
  const skipped: SkippedResult[] = [];

  const floor = changeTypeFloor(event.type);

  // ---- Stage 1: direct dependency matches -------------------------------------
  const directlyImpacted = new Map<string, { criticality: Criticality; dependencyId: string }>();
  let directMatches = 0;

  for (const dep of graph.dependencies) {
    if (dep.kind !== event.dependencyKind) continue;
    if (!identifierMatches(dep.targetIdentifier, event.subjectIdentifier)) continue;

    directMatches += 1;

    if (!revisionIsRelevant(dep, event)) {
      skipped.push({
        knowledgeId: dep.knowledgeId,
        reason: `Dependency pinned to revision "${dep.pinnedRevision}" which is not the revision being superseded ("${event.fromRevision}")`,
      });
      continue;
    }

    const effective = floor ? maxCriticality(dep.criticality, floor) : dep.criticality;
    const existing = directlyImpacted.get(dep.knowledgeId);

    if (!existing) {
      directlyImpacted.set(dep.knowledgeId, {
        criticality: effective,
        dependencyId: dep.id,
      });
    } else {
      // A knowledge object may declare the same subject more than once; keep the
      // most severe, and do not double-count it as two impacts.
      const combined = maxCriticality(existing.criticality, effective);
      directlyImpacted.set(dep.knowledgeId, {
        criticality: combined,
        dependencyId: combined === effective ? dep.id : existing.dependencyId,
      });
      skipped.push({
        knowledgeId: dep.knowledgeId,
        reason: 'Duplicate dependency on the same subject; merged into the more severe impact',
      });
    }
  }

  // ---- Stage 2: transitive propagation through knowledge-to-knowledge links ----
  // Breadth-first so `depth` is the true shortest distance from the change.
  const resolved = new Map<
    string,
    { criticality: Criticality; depth: number; dependencyId: string | null; path: ImpactPathStep[] }
  >();

  const queue: Array<{
    knowledgeId: string;
    criticality: Criticality;
    depth: number;
    dependencyId: string | null;
    path: ImpactPathStep[];
  }> = [];

  for (const [knowledgeId, hit] of directlyImpacted) {
    const step: ImpactPathStep = {
      knowledgeId,
      via: `${event.dependencyKind}:${event.subjectIdentifier}`,
      criticality: hit.criticality,
    };
    queue.push({
      knowledgeId,
      criticality: hit.criticality,
      depth: 0,
      dependencyId: hit.dependencyId,
      path: [step],
    });
  }

  let transitiveMatches = 0;

  while (queue.length > 0) {
    const node = queue.shift()!;
    const seen = resolved.get(node.knowledgeId);

    if (seen) {
      // Already reached. Keep the more severe assessment; on a tie keep the shallower
      // path, because the shortest explanation is the most useful one to a reviewer.
      const combined = maxCriticality(seen.criticality, node.criticality);
      const takeNew =
        combined === node.criticality && (combined !== seen.criticality || node.depth < seen.depth);
      if (takeNew) {
        resolved.set(node.knowledgeId, {
          criticality: combined,
          depth: node.depth,
          dependencyId: node.dependencyId,
          path: node.path,
        });
      }
      continue;
    }

    resolved.set(node.knowledgeId, {
      criticality: node.criticality,
      depth: node.depth,
      dependencyId: node.dependencyId,
      path: node.path,
    });

    for (const link of graph.knowledgeLinks) {
      if (link.toKnowledgeId !== node.knowledgeId) continue;
      if (resolved.has(link.fromKnowledgeId)) continue;

      transitiveMatches += 1;

      // Derived knowledge is impacted at no more than the severity of what it derives
      // from, capped by how the derivation itself was declared.
      const inherited =
        node.criticality === 'BLOCKING' && link.criticality === 'BLOCKING'
          ? 'BLOCKING'
          : node.criticality === 'MINOR' || link.criticality === 'MINOR'
            ? 'MINOR'
            : 'MAJOR';

      queue.push({
        knowledgeId: link.fromKnowledgeId,
        criticality: inherited as Criticality,
        depth: node.depth + 1,
        dependencyId: null,
        path: [
          ...node.path,
          {
            knowledgeId: link.fromKnowledgeId,
            via: `derives_from:${node.knowledgeId}`,
            criticality: inherited as Criticality,
          },
        ],
      });
    }
  }

  // ---- Stage 3: status transitions --------------------------------------------
  for (const [knowledgeId, hit] of resolved) {
    const previousStatus = graph.currentStatus[knowledgeId] ?? 'CURRENT';

    if (TERMINAL_STATUSES.has(previousStatus)) {
      skipped.push({
        knowledgeId,
        reason: `Knowledge is ${previousStatus}; terminal statuses are not reopened by new change events`,
      });
      continue;
    }

    const target = transitionFor(hit.criticality);

    // Never downgrade an object that is already under review back to CURRENT.
    const newStatus: CurrencyStatusValue =
      previousStatus === 'UNDER_REVALIDATION' && target === 'CURRENT'
        ? 'UNDER_REVALIDATION'
        : target === 'CURRENT'
          ? previousStatus
          : target;

    impacts.push({
      knowledgeId,
      dependencyId: hit.dependencyId,
      criticality: hit.criticality,
      depth: hit.depth,
      path: hit.path,
      previousStatus,
      newStatus,
      opensTask: createsTask(hit.criticality),
      reason:
        hit.depth === 0
          ? `Directly depends on ${event.dependencyKind} "${event.subjectIdentifier}" (${hit.criticality})`
          : `Derives, at depth ${hit.depth}, from knowledge that depends on ${event.dependencyKind} "${event.subjectIdentifier}" (${hit.criticality})`,
    });
  }

  // Deterministic ordering so persisted output and replays are byte-comparable.
  impacts.sort((a, b) => a.knowledgeId.localeCompare(b.knowledgeId));
  skipped.sort((a, b) => a.knowledgeId.localeCompare(b.knowledgeId) || a.reason.localeCompare(b.reason));

  const considered = directMatches + transitiveMatches;
  const accounted = impacts.length + skipped.length;

  return {
    changeEventId: event.id,
    engineVersion: ENGINE_VERSION,
    dependenciesScanned: graph.dependencies.length,
    directMatches,
    transitiveMatches,
    impacts,
    skipped,
    reconciles: considered === accounted,
  };
}
