import { Dual } from './dual.js';

export interface OptimizerConfig {
  /** Initial design-variable value. */
  start: number;
  /** Learning rate: cap on the line-search step (legacy/advisory). */
  lr: number;
  /** Max gradient-descent iterations. */
  maxIter: number;
  /** Lower feasibility/design bound. */
  lowerBound: number;
  /** Upper design bound. */
  upperBound: number;
  /** Stop when |Δx| < tol. */
  tol: number;
}

export interface OptimizerStep {
  iteration: number;
  t: number;
  phi: number;
  gradient: number;
  stress: number;
  mass: number;
  constraintViolation: number;
  feasible: boolean;
}

/**
 * Projected gradient descent with golden-section line search along −∇Φ.
 * Robust on the non-smooth penalty objective (large gradients near the
 * constraint boundary otherwise oscillate with a fixed learning rate).
 * Content addressing is applied by callers (this stays pure).
 */
export function runGradientDescent(
  objective: (t: number) => { value: number; gradient: number },
  cfg: OptimizerConfig
): { steps: OptimizerStep[]; converged: boolean; optimum: number; reason: string } {
  const steps: OptimizerStep[] = [];
  const { lowerBound: lo, upperBound: hi, maxIter, tol } = cfg;

  let t = clamp(cfg.start, lo, hi);
  let converged = false;
  let reason = 'max iterations reached';

  const project = (x: number) => clamp(x, lo, hi);

  for (let i = 0; i < maxIter; i++) {
    const o = objective(t);
    const grad = o.gradient;

    steps.push({
      iteration: i,
      t,
      phi: o.value,
      gradient: grad,
      stress: 0,
      mass: 0,
      constraintViolation: 0,
      feasible: grad >= 0,
    });

    // t* = t − α·grad. Feasible α is bounded by the design box.
    let aMax = Infinity;
    if (grad > 0) aMax = (t - lo) / grad;
    else if (grad < 0) aMax = (hi - t) / -grad;
    if (!Number.isFinite(aMax) || aMax <= 0) aMax = 1;

    const tNext = lineSearch(objective, t, grad, aMax, project);
    if (Math.abs(tNext - t) < tol) {
      t = tNext;
      converged = true;
      reason = `converged (|Δx| < ${tol}) at iteration ${i}, x=${t.toFixed(6)}`;
      break;
    }
    t = tNext;
  }

  return { steps, converged, optimum: t, reason };
}

/** Minimise φ(t − α·grad) for α ∈ [0, aMax] via golden-section search. */
function lineSearch(
  objective: (x: number) => { value: number },
  t: number,
  grad: number,
  aMax: number,
  project: (x: number) => number
): number {
  if (grad === 0) return t;
  const evalAt = (a: number) => objective(project(t - a * grad)).value;

  const GR = 0.6180339887498949;
  let loA = 0;
  let hiA = Math.max(aMax, 1e-9);
  let a1 = hiA - GR * (hiA - loA);
  let a2 = loA + GR * (hiA - loA);
  let f1 = evalAt(a1);
  let f2 = evalAt(a2);

  for (let k = 0; k < 60; k++) {
    if (hiA - loA < 1e-12) break;
    if (f1 < f2) {
      hiA = a2;
      a2 = a1;
      f2 = f1;
      a1 = hiA - GR * (hiA - loA);
      f1 = evalAt(a1);
    } else {
      loA = a1;
      a1 = a2;
      f1 = f2;
      a2 = loA + GR * (hiA - loA);
      f2 = evalAt(a2);
    }
  }
  return project(t - ((loA + hiA) / 2) * grad);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Simple demonstration helper: derivative of a scalar via Dual for tests. */
export function derivativeAt(f: (t: Dual) => Dual, x: number): number {
  return f(Dual.var(x)).dual;
}
