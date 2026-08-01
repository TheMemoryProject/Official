import weights from '../../../config/evolution-weights.json';

/**
 * The engine version stamped onto every computed value.
 *
 * It combines the code version with the weights-file version, because a currency score
 * is only reproducible if you know both. Bump ENGINE_CODE_VERSION whenever the
 * *algorithm* changes; the weights half moves on its own when config/evolution-weights.json
 * is edited.
 */
export const ENGINE_CODE_VERSION = 'evolution-engine@1.0.0';

export const EVOLUTION_WEIGHTS = weights;

export const ENGINE_VERSION = `${ENGINE_CODE_VERSION}+${weights.version}`;

export type Criticality = 'BLOCKING' | 'MAJOR' | 'MINOR';

export type CurrencyStatusValue =
  | 'CURRENT'
  | 'REVALIDATION_REQUIRED'
  | 'UNDER_REVALIDATION'
  | 'SUPERSEDED'
  | 'RETIRED';

/** Severity ordering. Higher wins when two criticalities are combined. */
const CRITICALITY_RANK: Record<Criticality, number> = {
  MINOR: 0,
  MAJOR: 1,
  BLOCKING: 2,
};

export function maxCriticality(a: Criticality, b: Criticality): Criticality {
  return CRITICALITY_RANK[a] >= CRITICALITY_RANK[b] ? a : b;
}

export function criticalityRank(c: Criticality): number {
  return CRITICALITY_RANK[c];
}

/**
 * The minimum criticality a change type imposes, regardless of how the dependency
 * was declared. Retracted evidence invalidates a conclusion even if someone marked
 * the dependency MINOR.
 */
export function changeTypeFloor(changeType: string): Criticality | null {
  const floors = EVOLUTION_WEIGHTS.changeTypeCriticalityFloor as Record<string, string>;
  const value = floors[changeType];
  return value === 'BLOCKING' || value === 'MAJOR' || value === 'MINOR' ? value : null;
}

export function halfLifeDaysFor(evidenceClass: string): number {
  const table = EVOLUTION_WEIGHTS.decay.halfLifeDays as Record<string, number>;
  return table[evidenceClass] ?? table.UNKNOWN;
}

export function impactPenaltyFor(criticality: Criticality): number {
  const table = EVOLUTION_WEIGHTS.criticalityImpact as unknown as Record<string, number>;
  return table[criticality] ?? 0;
}

export function transitionFor(criticality: Criticality): CurrencyStatusValue {
  const table = EVOLUTION_WEIGHTS.criticalityTransition as unknown as Record<string, string>;
  return (table[criticality] ?? 'CURRENT') as CurrencyStatusValue;
}

export function createsTask(criticality: Criticality): boolean {
  const table = EVOLUTION_WEIGHTS.criticalityCreatesTask as unknown as Record<string, boolean>;
  return table[criticality] === true;
}

export function statusFloorFor(status: CurrencyStatusValue): number | null {
  const table = EVOLUTION_WEIGHTS.statusFloor as unknown as Record<string, number>;
  return typeof table[status] === 'number' ? table[status] : null;
}
