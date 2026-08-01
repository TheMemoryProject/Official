import {
  ENGINE_VERSION,
  EVOLUTION_WEIGHTS,
  impactPenaltyFor,
  statusFloorFor,
  type Criticality,
  type CurrencyStatusValue,
} from './config';
import { ageInDays, computeDecay, type DecayTerm } from './decay';

/**
 * Currency scoring.
 *
 * "Currency" is how much a knowledge object can still be relied upon *today*, as
 * distinct from how well evidenced it was when written. A rigorously verified 2018
 * conclusion whose governing standard was revised twice since is high-trust and
 * low-currency, and the user needs to see both numbers.
 *
 * Pure, deterministic, and fully explained by `breakdown`. Every term that moves the
 * number appears there with its numeric effect, so the UI can render a complete
 * derivation. If a user cannot see why the score is 72, this function is not done.
 */

export interface CurrencyTerm {
  label: string;
  effect: number;
  explanation: string;
}

export interface OpenImpact {
  criticality: Criticality;
  reason: string;
}

export interface CurrencyInput {
  knowledgeId: string;
  /** Class of the strongest supporting evidence; drives the decay half-life. */
  evidenceClass: string;
  /** When the knowledge was last verified or revalidated by a human. */
  lastVerifiedAt: Date | null;
  createdAt: Date;
  status: CurrencyStatusValue;
  openImpacts: OpenImpact[];
  openTaskCount: number;
  blockingTaskCount: number;
  now: Date;
}

export interface CurrencyResult {
  knowledgeId: string;
  status: CurrencyStatusValue;
  currencyScore: number;
  decayComponent: number;
  impactComponent: number;
  ageDays: number;
  openTaskCount: number;
  blockingTaskCount: number;
  grade: 'CURRENT' | 'AGING' | 'STALE' | 'EXPIRED';
  breakdown: CurrencyTerm[];
  decay: DecayTerm;
  engineVersion: string;
}

function gradeFor(score: number): CurrencyResult['grade'] {
  const { CURRENT, AGING, STALE } = EVOLUTION_WEIGHTS.grading;
  if (score >= CURRENT) return 'CURRENT';
  if (score >= AGING) return 'AGING';
  if (score >= STALE) return 'STALE';
  return 'EXPIRED';
}

export function computeCurrency(input: CurrencyInput): CurrencyResult {
  const breakdown: CurrencyTerm[] = [];

  // ---- Term 1: age decay from last human verification -------------------------
  const anchor = input.lastVerifiedAt ?? input.createdAt;
  const days = ageInDays(anchor, input.now);
  const decay = computeDecay(input.evidenceClass, days);

  breakdown.push({
    label: decay.label,
    effect: decay.value,
    explanation: decay.explanation,
  });

  if (!input.lastVerifiedAt) {
    breakdown.push({
      label: 'Never revalidated',
      effect: 0,
      explanation:
        'Decay is measured from creation because this knowledge has never been revalidated by a human.',
    });
  }

  let score = decay.value;

  // ---- Term 2: unresolved impacts ---------------------------------------------
  // Penalties are applied once per criticality tier, not once per impact. Ten MAJOR
  // impacts from one standard revision are one problem to investigate, not ten; the
  // count is surfaced separately rather than multiplied into the score.
  const tiers: Criticality[] = ['BLOCKING', 'MAJOR', 'MINOR'];
  let impactComponent = 0;

  for (const tier of tiers) {
    const hits = input.openImpacts.filter((i) => i.criticality === tier);
    if (hits.length === 0) continue;

    const penalty = impactPenaltyFor(tier);
    impactComponent += penalty;
    score -= penalty;

    breakdown.push({
      label: `Unresolved ${tier} impact`,
      effect: -penalty,
      explanation:
        `${hits.length} unresolved ${tier} impact${hits.length === 1 ? '' : 's'} ` +
        `(counted once, not per occurrence): ${hits[0].reason}` +
        (hits.length > 1 ? ` — and ${hits.length - 1} more` : ''),
    });
  }

  // ---- Term 3: status clamp ----------------------------------------------------
  const floor = statusFloorFor(input.status);
  if (floor !== null && score > floor) {
    breakdown.push({
      label: `Status clamp (${input.status})`,
      effect: floor - score,
      explanation:
        `Knowledge in ${input.status} cannot display above ${floor} regardless of how ` +
        'recently it was verified, because its conclusions are under challenge.',
    });
    score = floor;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    knowledgeId: input.knowledgeId,
    status: input.status,
    currencyScore: finalScore,
    decayComponent: decay.value,
    impactComponent,
    ageDays: days,
    openTaskCount: input.openTaskCount,
    blockingTaskCount: input.blockingTaskCount,
    grade: gradeFor(finalScore),
    breakdown,
    decay,
    engineVersion: ENGINE_VERSION,
  };
}
