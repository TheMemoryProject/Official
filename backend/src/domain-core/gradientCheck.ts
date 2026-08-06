/**
 * Finite-difference gradient check against the AD dual-number gradient.
 * This is the TypeScript twin of the in-SQL check in db/init/02-seed.sql.
 */
export interface GradientCheckResult {
  x: number;
  analyticGradient: number;
  finiteDifferenceGradient: number;
  relativeError: number;
  passed: boolean;
}

export function gradientCheck(
  objective: (t: number) => { value: number; gradient: number },
  x: number,
  h = 1e-7
): GradientCheckResult {
  const fp = objective(x + h);
  const fm = objective(x - h);
  const fd = (fp.value - fm.value) / (2 * h);
  const analytic = objective(x).gradient;
  const relErr = Math.abs(analytic - fd) / Math.max(1e-9, Math.abs(fd));
  return {
    x,
    analyticGradient: analytic,
    finiteDifferenceGradient: fd,
    relativeError: relErr,
    passed: relErr < 1e-5,
  };
}
