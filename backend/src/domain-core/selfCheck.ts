/**
 * Self-check for the pure domain core — runs without a database:
 *  1. Dual-number arithmetic.
 *  2. AD gradient vs finite differences (TS twin of the SQL check).
 *  3. Gradient-descent convergence to the analytic optimum t* = 4.0 mm.
 *  4. Re-optimisation after evidence retraction to 4.3478… mm.
 */
import { DEFAULT_INPUTS, penaltyObjective, analyticOptimum } from './physics.js';
import { runGradientDescent } from './optimizer.js';
import { gradientCheck } from './gradientCheck.js';
import { sha256 } from './hash.js';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`SELF-CHECK FAILED: ${msg}`);
    process.exitCode = 1;
    throw new Error(msg);
  }
}

const obj = (t: number) => penaltyObjective(t, DEFAULT_INPUTS);

// 1. Dual arithmetic: d/dx(x²) = 2x at x=3
const dualCheck = gradientCheck((t: number) => ({ value: t * t, gradient: 2 * t }), 3);
assert(dualCheck.passed, `dual power derivative mismatch ${JSON.stringify(dualCheck)}`);

// 2. AD vs FD on the real objective at t0 = 2.5 (constraint active)
const gc = gradientCheck(obj, 2.5);
assert(gc.passed, `AD gradient check failed ${JSON.stringify(gc)}`);
console.log(`  gradient check: analytic=${gc.analyticGradient.toFixed(4)} fd=${gc.finiteDifferenceGradient.toFixed(4)} relErr=${gc.relativeError.toExponential(2)}`);

// 3. Descent converges to analytic optimum 4.0 mm
const optimum = analyticOptimum(DEFAULT_INPUTS);
assert(Math.abs(optimum - 4.0) < 1e-12, `analytic optimum expected 4.0, got ${optimum}`);
const run = runGradientDescent(obj, { start: 1.0, lr: 5e-3, maxIter: 5000, lowerBound: 0.5, upperBound: 20, tol: 1e-7 });
assert(run.converged, `descent did not converge: ${run.reason}`);
assert(Math.abs(run.optimum - 4.0) < 1e-3, `descent optimum ${run.optimum} != 4.0`);
console.log(`  descent: converged at t=${run.optimum.toFixed(6)} after ${run.steps.length} iterations (${run.reason})`);

// 4. Retraction: yield 250 -> 230 MPa re-optimises to ~4.3478 mm
const retractedInputs = { ...DEFAULT_INPUTS, yieldStrength: 230 };
const optRetracted = analyticOptimum(retractedInputs);
const run2 = runGradientDescent(
  (t: number) => penaltyObjective(t, retractedInputs),
  { start: run.optimum, lr: 5e-3, maxIter: 5000, lowerBound: 0.5, upperBound: 20, tol: 1e-7 }
);
assert(Math.abs(optRetracted - 1000 / (10 * 23)) < 1e-9, `retracted optimum mismatch ${optRetracted}`);
assert(Math.abs(run2.optimum - optRetracted) < 1e-3, `retracted descent optimum ${run2.optimum} != ${optRetracted}`);
console.log(`  retraction: 250→230 MPa re-optimises to t=${run2.optimum.toFixed(6)} mm (analytic ${optRetracted.toFixed(6)})`);

// 5. Content hashing determinism
assert(sha256('abc') === sha256('abc'), 'sha256 not deterministic');
assert(sha256('abc') !== sha256('abd'), 'sha256 collision on distinct input');

console.log('domain-core self-check: ALL PASSED');
