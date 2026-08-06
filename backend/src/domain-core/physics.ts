import { Dual } from './dual.js';

export interface TensionMemberInputs {
  /** Applied axial force, N */
  force: number;
  /** Cross-section width, mm */
  width: number;
  /** Reference member length, mm */
  length: number;
  /** Material density, g/mm³ */
  density: number;
  /** Yield strength, MPa */
  yieldStrength: number;
  /** Safety factor (dimensionless) */
  safetyFactor: number;
}

export const DEFAULT_INPUTS: TensionMemberInputs = {
  force: 1000,
  width: 10,
  length: 1,
  density: 1,
  yieldStrength: 250,
  safetyFactor: 10,
};

/** All quantities are evaluated over Duals so d/d(thickness) is exact AD. */
export interface TensionModelDual {
  stress: Dual;
  mass: Dual;
  allowableStress: Dual;
  /** constraint violation g(t) = stress·SF − yield ; g ≤ 0 is feasible */
  g: Dual;
}

export function evaluateTensionModel(thickness: Dual, p: TensionMemberInputs): TensionModelDual {
  const stress = Dual.const(p.force).div(
    Dual.const(p.width).mul(thickness)
  );
  const mass = Dual.const(p.density)
    .mul(thickness)
    .mul(Dual.const(p.width))
    .mul(Dual.const(p.length));
  const allowable = Dual.const(p.yieldStrength).div(Dual.const(p.safetyFactor));
  const g = stress.sub(allowable);
  return { stress, mass, allowableStress: allowable, g };
}

/**
 * Penalised objective:
 *   Φ(t) = mass(t) + λ · max(0, g(t))²
 * Convex quadratic outside the feasible set; linear mass term inside.
 */
export function penaltyObjective(t: number, p: TensionMemberInputs, lambda = 1e6): {
  value: number;
  gradient: number;
  stress: number;
  mass: number;
  g: number;
} {
  const x = Dual.var(t);
  const m = evaluateTensionModel(x, p);
  const viol = m.g.real > 0 ? m.g.real : 0;
  // d/dx [ max(0,g)² ] = 2·g·g' when g>0, else 0
  const gradViol = m.g.real > 0 ? 2 * m.g.real * m.g.dual : 0;
  return {
    value: m.mass.real + lambda * viol * viol,
    gradient: m.mass.dual + lambda * gradViol,
    stress: m.stress.real,
    mass: m.mass.real,
    g: m.g.real,
  };
}

/**
 * True constraint boundary: t* = F / (w · (yield/SF)).
 * This is the analytic optimum this demo converges to.
 */
export function analyticOptimum(p: TensionMemberInputs): number {
  return p.force / (p.width * (p.yieldStrength / p.safetyFactor));
}

export function massAt(t: number, p: TensionMemberInputs): number {
  return p.density * p.width * t * p.length;
}
