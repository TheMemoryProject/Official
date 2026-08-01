import { describe, it, expect } from 'vitest';
import { computeDecay, daysUntilDecayBelow, ageInDays } from '@/lib/evolution/decay';
import { computeCurrency } from '@/lib/evolution/currency';
import { propagateChangeEvent, type PropagationGraph } from '@/lib/evolution/propagation';
import { EVOLUTION_WEIGHTS, ENGINE_VERSION } from '@/lib/evolution/config';

/**
 * Deterministic core of the Knowledge Evolution Engine.
 *
 * These are pure functions, so they are tested exhaustively here and exercised
 * against a real database in tests/evolution-integration.spec.ts.
 */

describe('decay', () => {
  it('returns the ceiling at zero age', () => {
    const d = computeDecay('PHYSICAL_TEST', 0);
    expect(d.value).toBe(EVOLUTION_WEIGHTS.decay.ceiling);
  });

  it('falls exactly halfway to the floor after one half-life', () => {
    const halfLife = EVOLUTION_WEIGHTS.decay.halfLifeDays.FIELD_DATA;
    const { floor, ceiling } = EVOLUTION_WEIGHTS.decay;

    const d = computeDecay('FIELD_DATA', halfLife);
    expect(d.value).toBe(Math.round(floor + (ceiling - floor) * 0.5));
  });

  it('falls three quarters of the way after two half-lives', () => {
    const halfLife = EVOLUTION_WEIGHTS.decay.halfLifeDays.FIELD_DATA;
    const { floor, ceiling } = EVOLUTION_WEIGHTS.decay;

    const d = computeDecay('FIELD_DATA', halfLife * 2);
    expect(d.value).toBe(Math.round(floor + (ceiling - floor) * 0.25));
  });

  it('is monotonically non-increasing in age', () => {
    let previous = Infinity;
    for (let days = 0; days <= 4000; days += 50) {
      const d = computeDecay('INTERNAL_REPORT', days);
      expect(d.value).toBeLessThanOrEqual(previous);
      previous = d.value;
    }
  });

  it('never falls below the floor', () => {
    const d = computeDecay('ANECDOTE', 100_000);
    expect(d.value).toBeGreaterThanOrEqual(EVOLUTION_WEIGHTS.decay.floor);
  });

  it('is deterministic across repeated calls', () => {
    const a = computeDecay('QUALIFIED_SIMULATION', 917);
    const b = computeDecay('QUALIFIED_SIMULATION', 917);
    expect(a).toEqual(b);
  });

  it('decays a vendor claim faster than an analytical derivation', () => {
    const vendor = computeDecay('VENDOR_CLAIM', 365);
    const analytical = computeDecay('ANALYTICAL_DERIVATION', 365);
    expect(vendor.value).toBeLessThan(analytical.value);
  });

  it('treats an unknown evidence class as UNKNOWN rather than throwing', () => {
    const d = computeDecay('NOT_A_REAL_CLASS', 100);
    expect(d.halfLifeDays).toBe(EVOLUTION_WEIGHTS.decay.halfLifeDays.UNKNOWN);
  });

  it('clamps negative ages to zero rather than inflating above the ceiling', () => {
    const d = computeDecay('FIELD_DATA', -500);
    expect(d.value).toBe(EVOLUTION_WEIGHTS.decay.ceiling);
  });

  it('forecasts the day a class crosses a threshold', () => {
    const target = 60;
    const days = daysUntilDecayBelow('FIELD_DATA', target);
    expect(days).not.toBeNull();

    // At the forecast day the score is at or below target; the day before, above it.
    expect(computeDecay('FIELD_DATA', days!).value).toBeLessThanOrEqual(target);
    expect(computeDecay('FIELD_DATA', days! - 2).value).toBeGreaterThanOrEqual(target);
  });

  it('reports null for a threshold at or below the asymptotic floor', () => {
    expect(daysUntilDecayBelow('FIELD_DATA', EVOLUTION_WEIGHTS.decay.floor)).toBeNull();
  });

  it('computes whole-day ages and never goes negative', () => {
    const now = new Date('2026-08-01T12:00:00Z');
    expect(ageInDays(new Date('2026-07-31T12:00:00Z'), now)).toBe(1);
    expect(ageInDays(new Date('2027-01-01T00:00:00Z'), now)).toBe(0);
  });
});

describe('currency', () => {
  const now = new Date('2026-08-01T00:00:00Z');

  const baseInput = {
    knowledgeId: 'k1',
    evidenceClass: 'PHYSICAL_TEST',
    lastVerifiedAt: new Date('2026-07-01T00:00:00Z'),
    createdAt: new Date('2020-01-01T00:00:00Z'),
    status: 'CURRENT' as const,
    openImpacts: [],
    openTaskCount: 0,
    blockingTaskCount: 0,
    now,
  };

  it('scores recently verified knowledge with no impacts near the ceiling', () => {
    const r = computeCurrency(baseInput);
    expect(r.currencyScore).toBeGreaterThan(95);
    expect(r.grade).toBe('CURRENT');
  });

  it('produces a breakdown that accounts for the final score', () => {
    const r = computeCurrency({
      ...baseInput,
      status: 'REVALIDATION_REQUIRED',
      openImpacts: [{ criticality: 'BLOCKING', reason: 'standard withdrawn' }],
      openTaskCount: 1,
      blockingTaskCount: 1,
    });

    // The breakdown must be sufficient to re-derive the number the user sees.
    const summed = r.breakdown.reduce((acc, t) => acc + t.effect, 0);
    expect(summed).toBe(r.currencyScore);
    expect(r.breakdown.length).toBeGreaterThan(1);
    for (const term of r.breakdown) {
      expect(term.explanation.length).toBeGreaterThan(10);
    }
  });

  it('penalises a blocking impact more heavily than a major one', () => {
    const blocking = computeCurrency({
      ...baseInput,
      openImpacts: [{ criticality: 'BLOCKING', reason: 'x' }],
    });
    const major = computeCurrency({
      ...baseInput,
      openImpacts: [{ criticality: 'MAJOR', reason: 'x' }],
    });
    expect(blocking.currencyScore).toBeLessThan(major.currencyScore);
  });

  it('counts a criticality tier once regardless of how many impacts it holds', () => {
    const one = computeCurrency({
      ...baseInput,
      openImpacts: [{ criticality: 'MAJOR', reason: 'a' }],
    });
    const ten = computeCurrency({
      ...baseInput,
      openImpacts: Array.from({ length: 10 }, (_, i) => ({
        criticality: 'MAJOR' as const,
        reason: `a${i}`,
      })),
    });

    // Ten consequences of one standard revision is one problem, not ten.
    expect(ten.currencyScore).toBe(one.currencyScore);
  });

  it('clamps a freshly verified item that is under challenge', () => {
    const r = computeCurrency({ ...baseInput, status: 'REVALIDATION_REQUIRED' });
    expect(r.currencyScore).toBeLessThanOrEqual(
      EVOLUTION_WEIGHTS.statusFloor.REVALIDATION_REQUIRED
    );
  });

  it('scores retired knowledge at zero', () => {
    const r = computeCurrency({ ...baseInput, status: 'RETIRED' });
    expect(r.currencyScore).toBe(0);
    expect(r.grade).toBe('EXPIRED');
  });

  it('decays from creation when never revalidated, and says so', () => {
    const r = computeCurrency({ ...baseInput, lastVerifiedAt: null });
    expect(r.ageDays).toBeGreaterThan(2000);
    expect(r.breakdown.some((t) => t.label === 'Never revalidated')).toBe(true);
  });

  it('separates high trust from low currency', () => {
    // A physical test verified well within its half-life — so age alone has barely
    // touched it — whose governing standard has since been withdrawn. The point of
    // this test is that the impact, not the age, is what destroys currency.
    const r = computeCurrency({
      ...baseInput,
      evidenceClass: 'PHYSICAL_TEST',
      lastVerifiedAt: new Date('2025-01-01T00:00:00Z'),
      status: 'REVALIDATION_REQUIRED',
      openImpacts: [{ criticality: 'BLOCKING', reason: 'ISO 9001 withdrawn' }],
      openTaskCount: 1,
      blockingTaskCount: 1,
    });

    expect(r.decayComponent).toBeGreaterThan(80); // the evidence was and remains strong
    expect(r.currencyScore).toBeLessThan(50); // but it cannot be relied upon today
  });

  it('lets age alone erode currency past one half-life without any impact', () => {
    // The complementary case: nothing has gone wrong in the world, but a physical
    // test verified 8+ years ago has passed its 2555-day half-life on its own.
    const r = computeCurrency({
      ...baseInput,
      evidenceClass: 'PHYSICAL_TEST',
      lastVerifiedAt: new Date('2018-01-01T00:00:00Z'),
      status: 'CURRENT',
      openImpacts: [],
    });

    expect(r.ageDays).toBeGreaterThan(EVOLUTION_WEIGHTS.decay.halfLifeDays.PHYSICAL_TEST);
    expect(r.currencyScore).toBeLessThan(55);
    expect(r.grade).toBe('STALE');
  });

  it('is deterministic and stamps the engine version', () => {
    const a = computeCurrency(baseInput);
    const b = computeCurrency(baseInput);
    expect(a).toEqual(b);
    expect(a.engineVersion).toBe(ENGINE_VERSION);
  });

  it('never leaves the 0-100 range', () => {
    const r = computeCurrency({
      ...baseInput,
      openImpacts: [
        { criticality: 'BLOCKING', reason: 'a' },
        { criticality: 'MAJOR', reason: 'b' },
        { criticality: 'MINOR', reason: 'c' },
      ],
      lastVerifiedAt: new Date('1990-01-01T00:00:00Z'),
    });
    expect(r.currencyScore).toBeGreaterThanOrEqual(0);
    expect(r.currencyScore).toBeLessThanOrEqual(100);
  });
});

describe('propagation', () => {
  const emptyGraph: PropagationGraph = {
    dependencies: [],
    knowledgeLinks: [],
    currentStatus: {},
  };

  const event = {
    id: 'e1',
    type: 'STANDARD_REVISED',
    dependencyKind: 'STANDARD',
    subjectIdentifier: 'ISO 9001',
    fromRevision: '2015',
    toRevision: '2026',
  };

  it('impacts nothing when nothing depends on the subject', () => {
    const r = propagateChangeEvent(event, emptyGraph);
    expect(r.impacts).toEqual([]);
    expect(r.reconciles).toBe(true);
  });

  it('impacts a knowledge object that declares the dependency', () => {
    const r = propagateChangeEvent(event, {
      ...emptyGraph,
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: null,
          criticality: 'MAJOR',
        },
      ],
    });

    expect(r.impacts).toHaveLength(1);
    expect(r.impacts[0].knowledgeId).toBe('k1');
    expect(r.impacts[0].newStatus).toBe('REVALIDATION_REQUIRED');
    expect(r.impacts[0].opensTask).toBe(true);
    expect(r.reconciles).toBe(true);
  });

  it('ignores dependencies of a different kind with the same identifier', () => {
    const r = propagateChangeEvent(event, {
      ...emptyGraph,
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'MATERIAL',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: null,
          criticality: 'MAJOR',
        },
      ],
    });
    expect(r.impacts).toEqual([]);
  });

  it('matches identifiers case- and whitespace-insensitively', () => {
    const r = propagateChangeEvent(event, {
      ...emptyGraph,
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: '  iso 9001 ',
          pinnedRevision: null,
          criticality: 'MAJOR',
        },
      ],
    });
    expect(r.impacts).toHaveLength(1);
  });

  it('skips a dependency pinned to a revision the change does not supersede', () => {
    const r = propagateChangeEvent(event, {
      ...emptyGraph,
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: '2008',
          criticality: 'MAJOR',
        },
      ],
    });

    expect(r.impacts).toEqual([]);
    expect(r.skipped).toHaveLength(1);
    expect(r.skipped[0].reason).toContain('pinned');
    expect(r.reconciles).toBe(true);
  });

  it('impacts a dependency pinned to exactly the superseded revision', () => {
    const r = propagateChangeEvent(event, {
      ...emptyGraph,
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: '2015',
          criticality: 'MAJOR',
        },
      ],
    });
    expect(r.impacts).toHaveLength(1);
  });

  it('raises declared criticality to the change type floor', () => {
    // A MINOR dependency on withdrawn evidence is still blocking.
    const r = propagateChangeEvent(
      { ...event, type: 'EVIDENCE_RETRACTED', dependencyKind: 'EVIDENCE', subjectIdentifier: 'TR-1' },
      {
        ...emptyGraph,
        dependencies: [
          {
            id: 'd1',
            knowledgeId: 'k1',
            kind: 'EVIDENCE',
            targetIdentifier: 'TR-1',
            pinnedRevision: null,
            criticality: 'MINOR',
          },
        ],
      }
    );

    expect(r.impacts[0].criticality).toBe('BLOCKING');
    expect(r.impacts[0].opensTask).toBe(true);
  });

  it('records a MINOR impact without gating the knowledge', () => {
    const r = propagateChangeEvent(
      { ...event, type: 'EXPERT_DEPARTED', dependencyKind: 'EXPERT', subjectIdentifier: 'emp-42' },
      {
        ...emptyGraph,
        dependencies: [
          {
            id: 'd1',
            knowledgeId: 'k1',
            kind: 'EXPERT',
            targetIdentifier: 'emp-42',
            pinnedRevision: null,
            criticality: 'MINOR',
          },
        ],
      }
    );

    expect(r.impacts).toHaveLength(1);
    expect(r.impacts[0].criticality).toBe('MINOR');
    expect(r.impacts[0].newStatus).toBe('CURRENT');
    expect(r.impacts[0].opensTask).toBe(false);
  });

  it('propagates transitively to derived knowledge and records the path', () => {
    const r = propagateChangeEvent(event, {
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: null,
          criticality: 'BLOCKING',
        },
      ],
      knowledgeLinks: [
        { fromKnowledgeId: 'k2', toKnowledgeId: 'k1', criticality: 'BLOCKING' },
        { fromKnowledgeId: 'k3', toKnowledgeId: 'k2', criticality: 'BLOCKING' },
      ],
      currentStatus: {},
    });

    const ids = r.impacts.map((i) => i.knowledgeId).sort();
    expect(ids).toEqual(['k1', 'k2', 'k3']);

    const k3 = r.impacts.find((i) => i.knowledgeId === 'k3')!;
    expect(k3.depth).toBe(2);
    expect(k3.path).toHaveLength(3);
    expect(k3.reason).toContain('depth 2');
  });

  it('does not reopen retired or superseded knowledge', () => {
    const r = propagateChangeEvent(event, {
      ...emptyGraph,
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: null,
          criticality: 'BLOCKING',
        },
      ],
      currentStatus: { k1: 'RETIRED' },
    });

    expect(r.impacts).toEqual([]);
    expect(r.skipped[0].reason).toContain('RETIRED');
    expect(r.reconciles).toBe(true);
  });

  it('merges duplicate dependencies on the same subject into the most severe', () => {
    const r = propagateChangeEvent(event, {
      ...emptyGraph,
      dependencies: [
        {
          id: 'd1',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: null,
          criticality: 'MINOR',
        },
        {
          id: 'd2',
          knowledgeId: 'k1',
          kind: 'STANDARD',
          targetIdentifier: 'ISO 9001',
          pinnedRevision: null,
          criticality: 'BLOCKING',
        },
      ],
    });

    expect(r.impacts).toHaveLength(1);
    expect(r.impacts[0].criticality).toBe('BLOCKING');
    expect(r.reconciles).toBe(true);
  });

  it('is deterministic and order-stable', () => {
    const graph: PropagationGraph = {
      ...emptyGraph,
      dependencies: [
        { id: 'd3', knowledgeId: 'kc', kind: 'STANDARD', targetIdentifier: 'ISO 9001', pinnedRevision: null, criticality: 'MAJOR' },
        { id: 'd1', knowledgeId: 'ka', kind: 'STANDARD', targetIdentifier: 'ISO 9001', pinnedRevision: null, criticality: 'MAJOR' },
        { id: 'd2', knowledgeId: 'kb', kind: 'STANDARD', targetIdentifier: 'ISO 9001', pinnedRevision: null, criticality: 'MAJOR' },
      ],
    };

    const a = propagateChangeEvent(event, graph);
    const b = propagateChangeEvent(event, graph);

    expect(a).toEqual(b);
    expect(a.impacts.map((i) => i.knowledgeId)).toEqual(['ka', 'kb', 'kc']);
  });

  it('always reconciles candidates against impacts plus skips', () => {
    const r = propagateChangeEvent(event, {
      dependencies: [
        { id: 'd1', knowledgeId: 'k1', kind: 'STANDARD', targetIdentifier: 'ISO 9001', pinnedRevision: null, criticality: 'BLOCKING' },
        { id: 'd2', knowledgeId: 'k2', kind: 'STANDARD', targetIdentifier: 'ISO 9001', pinnedRevision: '1999', criticality: 'MAJOR' },
        { id: 'd3', knowledgeId: 'k3', kind: 'STANDARD', targetIdentifier: 'OTHER', pinnedRevision: null, criticality: 'MAJOR' },
      ],
      knowledgeLinks: [{ fromKnowledgeId: 'k4', toKnowledgeId: 'k1', criticality: 'MAJOR' }],
      currentStatus: { k4: 'SUPERSEDED' },
    });

    expect(r.reconciles).toBe(true);
    expect(r.directMatches + r.transitiveMatches).toBe(r.impacts.length + r.skipped.length);
  });
});
