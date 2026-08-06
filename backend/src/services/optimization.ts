import { query, queryOne } from '../db.js';
import { sha256, canonicalize } from '../domain-core/hash.js';
import {
  TensionMemberInputs,
  penaltyObjective,
  analyticOptimum,
} from '../domain-core/physics.js';
import { runGradientDescent } from '../domain-core/optimizer.js';
import { gradientCheck, GradientCheckResult } from '../domain-core/gradientCheck.js';

export interface ParameterRow {
  id: string;
  name: string;
  value_json: Record<string, unknown>;
  unit: string | null;
  bound_span_id: string;
  status: string;
}

export interface DesignVariableRow {
  id: string;
  name: string;
  symbol: string | null;
  value_json: Record<string, unknown>;
  unit: string | null;
  lower_bound: number;
  upper_bound: number;
  active: boolean;
}

export interface ResolvedModel {
  inputs: TensionMemberInputs;
  fingerprint: string;
  evidenceHashes: string[];
}

/** Resolve live model inputs from model_parameters (evidence-bound). */
export async function resolveModel(): Promise<ResolvedModel> {
  const params = await query<ParameterRow>(
    `SELECT id, name, value_json, unit, bound_span_id, status
     FROM model_parameters WHERE status = 'ACTIVE'`
  );
  const num = (id: string, fallback: number): number => {
    const row = params.find((p) => p.id === id);
    const v = row ? Number((row.value_json as { value?: number }).value) : NaN;
    return Number.isFinite(v) ? v : fallback;
  };

  const inputs: TensionMemberInputs = {
    force: num('force', 1000),
    width: num('width', 10),
    length: num('length', 1),
    density: num('density', 1),
    yieldStrength: num('yield_strength', 250),
    safetyFactor: num('safety_factor', 10),
  };

  const evidenceHashes = params.map((p) => p.bound_span_id).sort();
  const fingerprint = sha256(canonicalize([
    ['force', inputs.force],
    ['width', inputs.width],
    ['length', inputs.length],
    ['density', inputs.density],
    ['yield', inputs.yieldStrength],
    ['sf', inputs.safetyFactor],
    ['evidence', evidenceHashes.join(',')],
  ]));

  return { inputs, fingerprint, evidenceHashes };
}

export async function resolveBounds(): Promise<{ lower: number; upper: number }> {
  const row = await queryOne<DesignVariableRow>(
    `SELECT id, name, symbol, value_json, unit, lower_bound, upper_bound, active
     FROM design_variables WHERE id = 'thickness'`
  );
  return { lower: row?.lower_bound ?? 0.5, upper: row?.upper_bound ?? 20 };
}

export interface RunOptions {
  start?: number;
  lr?: number;
  maxIter?: number;
  trigger?: string;
}

export interface RunRecord {
  id: string;
  run_type: string;
  model_fingerprint: string;
  input_json: Record<string, unknown>;
  status: string;
  progress: number;
  current_x: Record<string, unknown> | null;
  current_loss: number | null;
  step_count: number;
  evidence_hashes: string[];
  iterations: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface FullRun {
  run: RunRecord;
  steps: Array<{
    step_no: number;
    x: Record<string, unknown>;
    gradient: Record<string, unknown>;
    loss: number;
    step_hash: string;
    prev_hash: string | null;
    model_fingerprint: string;
  }>;
  analytic_optimum: number;
}

async function createRun(model: ResolvedModel, opts: RunOptions): Promise<string> {
  const bounds = await resolveBounds();
  const start = opts.start ?? 1.0;
  const inputJson = {
    start,
    lr: opts.lr ?? 5e-3,
    maxIter: opts.maxIter ?? 5000,
    lowerBound: bounds.lower,
    upperBound: bounds.upper,
    trigger: opts.trigger ?? 'manual',
    parameters: model.inputs,
  };
  const rows = await query<{ id: string }>(
    `INSERT INTO optimisation_runs
       (run_type, model_fingerprint, input_json, status, progress, step_count, evidence_hashes)
     VALUES ($1, $2, $3::jsonb, 'RUNNING', 0, 0, $4::jsonb)
     RETURNING id`,
    ['GRADIENT_DESCENT', model.fingerprint, JSON.stringify(inputJson), JSON.stringify(model.evidenceHashes)]
  );
  return rows[0].id;
}

async function insertStep(
  runId: string,
  stepNo: number,
  x: number,
  gradient: number,
  loss: number,
  prevHash: string | null,
  fingerprint: string,
  evidenceHashes: string[]
): Promise<string> {
  const hashInput =
    `${runId}|${stepNo}|${x}|${gradient}|${loss}|${prevHash ?? 'genesis'}`;
  const stepHash = sha256(hashInput);
  await query(
    `INSERT INTO optimisation_steps
       (run_id, step_no, x, gradient, loss, step_hash, prev_hash, model_fingerprint, evidence_hashes)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9::jsonb)`,
    [
      runId,
      stepNo,
      JSON.stringify({ thickness: x }),
      JSON.stringify({ dPhi_dt: gradient }),
      loss,
      stepHash,
      prevHash,
      fingerprint,
      JSON.stringify(evidenceHashes),
    ]
  );
  return stepHash;
}

export async function runOptimisation(opts: RunOptions = {}): Promise<FullRun> {
  const model = await resolveModel();
  const bounds = await resolveBounds();
  const runId = await createRun(model, opts);

  const start = opts.start ?? 1.0;
  const cfg = {
    start,
    lr: opts.lr ?? 5e-3,
    maxIter: opts.maxIter ?? 5000,
    lowerBound: bounds.lower,
    upperBound: bounds.upper,
    tol: 1e-7,
  };

  const obj = (t: number) => penaltyObjective(t, model.inputs);
  const result = runGradientDescent(obj, cfg);

  // Persist the content-addressed step chain.
  let prevHash: string | null = model.fingerprint;
  for (const s of result.steps) {
    prevHash = await insertStep(runId, s.iteration, s.t, s.gradient, s.phi, prevHash, model.fingerprint, model.evidenceHashes);
  }

  const finalStep = result.steps[result.steps.length - 1];
  const completedX = { thickness: result.optimum };
  const finalLoss = finalStep ? finalStep.phi : obj(result.optimum).value;

  await query(
    `UPDATE optimisation_runs
     SET status = 'COMPLETED', progress = 100, current_x = $1::jsonb,
         current_loss = $2, step_count = $3, iterations = $4, completed_at = now()
     WHERE id = $5`,
    [JSON.stringify(completedX), finalLoss, result.steps.length, result.steps.length, runId]
  );

  await query(
    `INSERT INTO audit_log (action, entity, entity_id, detail)
     VALUES ('OPTIMISATION_COMPLETED', 'optimisation_runs', $1, $2::jsonb)`,
    [
      runId,
      JSON.stringify({
        optimum_mm: result.optimum,
        iterations: result.steps.length,
        reason: result.reason,
        analytic_optimum_mm: analyticOptimum(model.inputs),
        fingerprint: model.fingerprint,
      }),
    ]
  );

  const run = await getRun(runId);
  const steps = await getSteps(runId);
  return { run: run as RunRecord, steps, analytic_optimum: analyticOptimum(model.inputs) };
}

export async function getRuns(): Promise<RunRecord[]> {
  return query<RunRecord>(
    `SELECT id, run_type, model_fingerprint, input_json, status, progress, current_x, current_loss,
            step_count, evidence_hashes, iterations, started_at, completed_at
     FROM optimisation_runs ORDER BY started_at DESC LIMIT 50`
  );
}

export async function getRun(id: string): Promise<RunRecord | undefined> {
  return queryOne<RunRecord>(
    `SELECT id, run_type, model_fingerprint, input_json, status, progress, current_x, current_loss,
            step_count, evidence_hashes, iterations, started_at, completed_at
     FROM optimisation_runs WHERE id = $1`,
    [id]
  );
}

export async function getSteps(runId: string) {
  return query<{
    step_no: number;
    x: Record<string, unknown>;
    gradient: Record<string, unknown>;
    loss: number;
    step_hash: string;
    prev_hash: string | null;
    model_fingerprint: string;
    created_at: string;
  }>(
    `SELECT step_no, x, gradient, loss, step_hash, prev_hash, model_fingerprint, created_at
     FROM optimisation_steps WHERE run_id = $1 ORDER BY step_no ASC`,
    [runId]
  );
}

/**
 * Verify the content-addressed chain: every step hash re-computes and each
 * prev_hash links to the preceding step (step 0 links to the run fingerprint).
 */
export async function verifyRunChain(runId: string): Promise<{
  valid: boolean;
  checked: number;
  firstBad?: { step_no: number; reason: string };
  root_fingerprint: string | null;
}> {
  const run = await getRun(runId);
  const steps = await getSteps(runId);
  if (!run) return { valid: false, checked: 0, root_fingerprint: null };
  if (steps.length === 0) return { valid: true, checked: 0, root_fingerprint: run.model_fingerprint };

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const expectedPrev = i === 0 ? run.model_fingerprint : steps[i - 1].step_hash;
    if (s.prev_hash !== expectedPrev) {
      return {
        valid: false,
        checked: i + 1,
        root_fingerprint: run.model_fingerprint,
        firstBad: { step_no: s.step_no, reason: 'prev_hash does not chain to previous step' },
      };
    }
    const recomputed = sha256(
      `${runId}|${s.step_no}|${(s.x as { thickness: number }).thickness}|${(s.gradient as { dPhi_dt: number }).dPhi_dt}|${s.loss}|${s.prev_hash ?? 'genesis'}`
    );
    if (recomputed !== s.step_hash) {
      return {
        valid: false,
        checked: i + 1,
        root_fingerprint: run.model_fingerprint,
        firstBad: { step_no: s.step_no, reason: 'step_hash does not match recomputed hash' },
      };
    }
  }
  return { valid: true, checked: steps.length, root_fingerprint: run.model_fingerprint };
}

export interface CheckRow {
  id: string;
  model: string;
  x: Record<string, unknown>;
  analytic: Record<string, unknown>;
  finite_diff: Record<string, unknown>;
  max_error: number;
  tolerance: number;
  passed: boolean;
  created_at: string;
}

export async function runGradientCheckAndRecord(x = 2.5): Promise<GradientCheckResult & { created_at: string }> {
  const model = await resolveModel();
  const result = gradientCheck((t: number) => penaltyObjective(t, model.inputs), x);
  await query(
    `INSERT INTO gradient_checks (model, x, analytic, finite_diff, max_error, tolerance, passed)
     VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, $7)`,
    [
      'tension_member_penalty',
      JSON.stringify({ thickness: x }),
      JSON.stringify({ dPhi_dt: result.analyticGradient }),
      JSON.stringify({ dPhi_dt: result.finiteDifferenceGradient }),
      result.relativeError,
      1e-5,
      result.passed,
    ]
  );
  await query(
    `INSERT INTO audit_log (action, entity, entity_id, detail)
     VALUES ('GRADIENT_CHECK', 'domain-core', 'dual-number-vs-finite-difference', $1::jsonb)`,
    [JSON.stringify({ x, passed: result.passed, relative_error: result.relativeError })]
  );
  return { ...result, created_at: new Date().toISOString() };
}

export async function getGradientChecks(limit = 10): Promise<CheckRow[]> {
  return query<CheckRow>(
    `SELECT id, model, x, analytic, finite_diff, max_error, tolerance, passed, created_at
     FROM gradient_checks ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function auditLog(limit = 50) {
  return query(
    `SELECT id, action, entity, entity_id, detail, created_at
     FROM audit_log ORDER BY id DESC LIMIT $1`,
    [limit]
  );
}
