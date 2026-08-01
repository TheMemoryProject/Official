import { EVOLUTION_WEIGHTS, halfLifeDaysFor } from './config';

/**
 * Time-based confidence decay.
 *
 * Pure and deterministic: the same (evidenceClass, ageDays) always yields the same
 * number, for the same weights version. No language model is involved, and the result
 * is fully explained by the returned term.
 */

export interface DecayTerm {
  label: string;
  evidenceClass: string;
  ageDays: number;
  halfLifeDays: number;
  retained: number;
  value: number;
  explanation: string;
}

export const MS_PER_DAY = 86_400_000;

/** Whole days between two instants, floored, never negative. */
export function ageInDays(from: Date, now: Date): number {
  const diff = now.getTime() - from.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / MS_PER_DAY);
}

/**
 * Exponential half-life decay from `ceiling` toward `floor`.
 *
 * At age 0 the score is the ceiling. After one half-life it has fallen halfway to the
 * floor, after two half-lives three-quarters of the way, and so on. The floor exists
 * because old evidence is weaker, not worthless.
 */
export function computeDecay(evidenceClass: string, ageDays: number): DecayTerm {
  const { floor, ceiling } = EVOLUTION_WEIGHTS.decay;
  const halfLifeDays = halfLifeDaysFor(evidenceClass);

  const safeAge = Math.max(0, ageDays);
  const retained = Math.pow(0.5, safeAge / halfLifeDays);
  const raw = floor + (ceiling - floor) * retained;
  const value = Math.round(raw);

  return {
    label: 'Evidence age decay',
    evidenceClass,
    ageDays: safeAge,
    halfLifeDays,
    retained: Number(retained.toFixed(6)),
    value,
    explanation:
      `${evidenceClass} has a ${halfLifeDays}-day half-life. At ${safeAge} days, ` +
      `${(retained * 100).toFixed(1)}% of the decayable range is retained, ` +
      `giving ${value} on a ${floor}-${ceiling} scale.`,
  };
}

/**
 * Days until a given evidence class decays below `target`, or null if it is already
 * below it or can never reach it. Used to forecast when knowledge will need review
 * before anyone has complained about it.
 */
export function daysUntilDecayBelow(evidenceClass: string, target: number): number | null {
  const { floor, ceiling } = EVOLUTION_WEIGHTS.decay;

  if (target <= floor) return null; // asymptotic; never crosses
  if (target >= ceiling) return 0;

  const halfLifeDays = halfLifeDaysFor(evidenceClass);
  const retainedAtTarget = (target - floor) / (ceiling - floor);
  const days = halfLifeDays * (Math.log(retainedAtTarget) / Math.log(0.5));

  return Math.ceil(days);
}
