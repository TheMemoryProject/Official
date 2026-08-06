'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  API_BASE,
  EvidenceSpan,
  GraphNode,
  GradientCheck,
  Proposal,
  RunRecord,
  RunStep,
  ChainVerify,
  AuditEntry,
} from '@/lib/api';

interface Params {
  force: number;
  width: number;
  length: number;
  density: number;
  yieldStrength: number;
  safetyFactor: number;
}

const DEFAULT_PARAMS: Params = {
  force: 1000,
  width: 10,
  length: 1,
  density: 1,
  yieldStrength: 250,
  safetyFactor: 10,
};

const VIEW_W = 760;
const VIEW_H = 240;
const X0 = 44;
const X1 = 740;
const Y0 = 210;
const Y1 = 26;
const T_MIN = 0.5;
const T_MAX = 6.0;
const LOSS_CAP = 400;

function modelLoss(t: number, p: Params): number {
  const stress = p.force / (p.width * t);
  const allowable = p.yieldStrength / p.safetyFactor;
  const g = stress - allowable;
  const viol = g > 0 ? g : 0;
  const mass = p.density * p.width * t * p.length;
  return Math.min(mass + 1e6 * viol * viol, LOSS_CAP);
}

function xOf(t: number): number {
  return X0 + ((t - T_MIN) / (T_MAX - T_MIN)) * (X1 - X0);
}
function yOf(loss: number): number {
  return Y1 + (1 - Math.min(loss, LOSS_CAP) / LOSS_CAP) * (Y0 - Y1);
}

function paramsFromRun(run: RunRecord | null): Params {
  const p = run?.input_json?.parameters as Partial<Params> | undefined;
  if (!p) return DEFAULT_PARAMS;
  return {
    force: p.force ?? DEFAULT_PARAMS.force,
    width: p.width ?? DEFAULT_PARAMS.width,
    length: p.length ?? DEFAULT_PARAMS.length,
    density: p.density ?? DEFAULT_PARAMS.density,
    yieldStrength: p.yieldStrength ?? DEFAULT_PARAMS.yieldStrength,
    safetyFactor: p.safetyFactor ?? DEFAULT_PARAMS.safetyFactor,
  };
}

function shortHash(h: string): string {
  return h ? `${h.slice(0, 10)}…` : '—';
}

export default function OptimisePage() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<{ source_key: string; target_key: string; relation: string }[]>([]);
  const [spans, setSpans] = useState<EvidenceSpan[]>([]);
  const [checks, setChecks] = useState<GradientCheck[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [chain, setChain] = useState<ChainVerify | null>(null);

  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cfg, setCfg] = useState({ start: 1.0, lr: 0.005, maxIter: 5000 });
  const [retractFor, setRetractFor] = useState<string | null>(null);
  const [revisedValue, setRevisedValue] = useState('230');
  const [revisedReason, setRevisedReason] = useState('');
  const [decideFor, setDecideFor] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');

  const [animIdx, setAnimIdx] = useState(0);
  const [animFrac, setAnimFrac] = useState(0);
  const rafRef = useRef<number | null>(null);

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );
  const params = useMemo(() => paramsFromRun(selectedRun), [selectedRun]);

  const refresh = useCallback(async () => {
    try {
      const [g, s, c, r, p, a] = await Promise.all([
        api.getGraph(),
        api.getSpans(),
        api.getGradientChecks(),
        api.getRuns(),
        api.getProposals(),
        api.getAudit(),
      ]);
      setNodes(g.nodes);
      setEdges(g.edges);
      setSpans(s.spans);
      setChecks(c.checks);
      setRuns(r.runs);
      setProposals(p.proposals);
      setAudit(a.log);
      setApiOk(true);
      setError(null);
    } catch (e) {
      setApiOk(false);
      setError(e instanceof Error ? e.message : 'API unreachable');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  // Load steps + chain for the selected run.
  useEffect(() => {
    if (!selectedRun) {
      setSteps([]);
      setChain(null);
      return;
    }
    let alive = true;
    void api
      .getSteps(selectedRun.id)
      .then((r) => alive && setSteps(r.steps))
      .catch(() => undefined);
    void api
      .verifyRun(selectedRun.id)
      .then((r) => alive && setChain(r))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [selectedRun]);

  // Animate marker along the step trace.
  useEffect(() => {
    if (!steps.length) return;
    const start = performance.now();
    const DURATION = Math.max(1200, steps.length * 450);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const pos = t * (steps.length - 1);
      const idx = Math.min(steps.length - 1, Math.floor(pos));
      setAnimIdx(idx);
      setAnimFrac(pos - idx);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [steps]);

  const lastCheck = checks[0];

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.runOptimisation({
        start: cfg.start,
        lr: cfg.lr,
        maxIter: cfg.maxIter,
        trigger: 'studio',
      });
      setSelectedRunId(res.run.id);
      setSteps(res.steps);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimisation failed');
    } finally {
      setRunning(false);
    }
  };

  const handleRetract = async (span: EvidenceSpan) => {
    if (!retractFor) return;
    setBusy(true);
    setError(null);
    try {
      const value = Number(revisedValue);
      if (!Number.isFinite(value)) throw new Error('revised value must be a number');
      const res = await api.retractSpan({
        span_id: span.id,
        reason: revisedReason || `Revised from ${span.value_json?.value ?? '?'} to ${value}`,
        revised: { value, unit: span.unit ?? 'MPa' },
      });
      setProposals((prev) => [res.proposal, ...prev]);
      setRetractFor(null);
      setRevisedValue('230');
      setRevisedReason('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retraction failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDecide = async (p: Proposal, decision: 'ACCEPTED' | 'REJECTED') => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.decideProposal(p.id, decision, rationale || undefined);
      if (res.run) {
        setSelectedRunId(res.run.id);
      }
      setDecideFor(null);
      setRationale('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decision failed');
    } finally {
      setBusy(false);
    }
  };

  // ---- SVG chart geometry ----
  const chart = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const t = T_MIN + ((T_MAX - T_MIN) * i) / 200;
      points.push(`${xOf(t).toFixed(1)},${yOf(modelLoss(t, params)).toFixed(1)}`);
    }
    const lossPath = `M${points.join(' L')}`;

    const optimumT = params.force / (params.width * (params.yieldStrength / params.safetyFactor));
    const optimumX = xOf(optimumT);

    const stepDots = steps.map((s) => ({ t: s.x.thickness, y: yOf(modelLoss(s.x.thickness, params)) }));
    const trailPath =
      stepDots.length > 0
        ? `M${stepDots.map((d, i) => `${i === 0 ? '' : 'L'}${xOf(d.t).toFixed(1)},${d.y.toFixed(1)}`).join(' ')}`
        : '';

    const cur = stepDots[Math.min(stepDots.length - 1, animIdx)];
    const next = stepDots[Math.min(stepDots.length - 1, animIdx + 1)];
    const tCur = cur && next ? cur.t + (next.t - cur.t) * animFrac : cur?.t ?? cfg.start;
    const markerX = xOf(Math.max(T_MIN, Math.min(T_MAX, tCur)));
    const markerY = yOf(modelLoss(Math.max(T_MIN, Math.min(T_MAX, tCur)), params));

    return { lossPath, optimumX, trailPath, markerX, markerY, optimumT };
  }, [steps, params, animIdx, animFrac, cfg.start]);

  const relationCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of edges) m.set(e.relation, (m.get(e.relation) ?? 0) + 1);
    return [...m.entries()];
  }, [edges]);

  const activeParams = useMemo(
    () =>
      nodes
        .filter((n) => n.node_type === 'PARAMETER' || n.node_type === 'DESIGN_VARIABLE')
        .map((n) => ({
          id: n.id,
          name: n.name,
          type: n.node_type,
          value: n.value_json?.value,
          unit: n.unit,
        })),
    [nodes]
  );

  return (
    <div className="shell">
      <header className="header">
        <h1>
          KTN <span className="dim">·</span> DEBKG <span className="dim">Optimisation Studio</span>
        </h1>
        <div className="status">
          <span className={`dot ${apiOk === null ? '' : apiOk ? 'ok' : 'bad'}`} />
          {apiOk === null ? 'connecting…' : apiOk ? `API ${API_BASE}` : 'API unreachable'}
          {busy || running ? <span className="spin" /> : null}
        </div>
      </header>

      {error ? (
        <div className="card col-12" style={{ marginBottom: 16, borderColor: 'rgba(248,113,113,0.5)' }}>
          <span className="error">{error}</span>
        </div>
      ) : null}

      <div className="grid">
        {/* ---- Live model parameters ---- */}
        <section className="card col-4">
          <h2>
            Live model (evidence-bound)
            <span className="tag">{selectedRun ? `fingerprint ${shortHash(selectedRun.model_fingerprint)}` : 'seed'}</span>
          </h2>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Value</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {activeParams.map((p) => (
                <tr key={p.id}>
                  <td className="row-label">
                    <span>{p.name}</span>
                    <span className="badge active">{p.type === 'DESIGN_VARIABLE' ? 'var' : 'param'}</span>
                  </td>
                  <td>
                    <span className="kv">
                      <b>{p.value}</b>
                    </span>
                  </td>
                  <td className="muted">{p.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted" style={{ marginTop: 10, fontSize: 11 }}>
            Constraint boundary t* = F / (w · σ<sub>allow</sub>) ={' '}
            <b style={{ color: 'var(--amber)' }}>{chart.optimumT.toFixed(4)} mm</b>
          </div>
        </section>

        {/* ---- Gradient check ---- */}
        <section className="card col-4">
          <h2>
            AD gradient check
            <span className="tag">dual numbers vs finite differences</span>
          </h2>
          {lastCheck ? (
            <>
              <div className={`${lastCheck.passed ? 'ok' : 'error'}`} style={{ marginBottom: 10 }}>
                {lastCheck.passed ? 'PASSED' : 'FAILED'} — relative error{' '}
                {Number(lastCheck.max_error).toExponential(2)}{' '}
                <span className="muted">(tolerance {lastCheck.tolerance})</span>
              </div>
              <table>
                <tbody>
                  <tr>
                    <td className="muted">model</td>
                    <td>{lastCheck.model}</td>
                  </tr>
                  <tr>
                    <td className="muted">x</td>
                    <td>{JSON.stringify(lastCheck.x)}</td>
                  </tr>
                  <tr>
                    <td className="muted">analytic ∇Φ</td>
                    <td>{(lastCheck.analytic as { dPhi_dt: number }).dPhi_dt?.toExponential(3)}</td>
                  </tr>
                  <tr>
                    <td className="muted">finite-diff ∇Φ</td>
                    <td>{(lastCheck.finite_diff as { dPhi_dt: number }).dPhi_dt?.toExponential(3)}</td>
                  </tr>
                  <tr>
                    <td className="muted">recorded</td>
                    <td className="muted">{new Date(lastCheck.created_at).toLocaleTimeString()}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <div className="muted">No gradient check recorded yet.</div>
          )}
          <div className="actions" style={{ marginTop: 12 }}>
            <button onClick={() => void api.runGradientCheck().then(() => refresh())}>Re-run check</button>
          </div>
        </section>

        {/* ---- Optimisation trace (SVG) ---- */}
        <section className="card col-4">
          <h2>
            Optimisation trace
            <span className="tag">content-addressed steps</span>
          </h2>
          <div className="actions" style={{ marginBottom: 12 }}>
            <button className="primary" onClick={() => void handleRun()} disabled={running || apiOk === false}>
              {running ? 'Running…' : 'Run optimisation'}
            </button>
            <span className="muted" style={{ fontSize: 11 }}>
              {selectedRun
                ? `run ${selectedRun.id.slice(0, 8)} · ${selectedRun.step_count} steps · ${selectedRun.status}`
                : 'no runs yet'}
            </span>
          </div>
          <div className="actions" style={{ marginBottom: 12, fontSize: 11 }}>
            <span className="muted">start</span>
            <input
              type="number"
              step="0.1"
              value={cfg.start}
              onChange={(e) => setCfg((c) => ({ ...c, start: Number(e.target.value) }))}
              style={{ width: 70 }}
            />
            <span className="muted">lr</span>
            <input
              type="number"
              step="0.001"
              value={cfg.lr}
              onChange={(e) => setCfg((c) => ({ ...c, lr: Number(e.target.value) }))}
              style={{ width: 80 }}
            />
            <span className="muted">maxIter</span>
            <input
              type="number"
              step="100"
              value={cfg.maxIter}
              onChange={(e) => setCfg((c) => ({ ...c, maxIter: Number(e.target.value) }))}
              style={{ width: 80 }}
            />
          </div>

          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ background: '#0a0f1d', borderRadius: 8 }}>
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* axes */}
            <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="#1f2c47" />
            <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="#1f2c47" />
            {[1, 2, 3, 4, 5, 6].map((t) => (
              <g key={t}>
                <line x1={xOf(t)} y1={Y0} x2={xOf(t)} y2={Y0 + 4} stroke="#33415c" />
                <text x={xOf(t)} y={Y0 + 14} fontSize={9} fill="#7c8db0" textAnchor="middle">
                  {t}
                </text>
              </g>
            ))}
            <text x={X0 + 20} y={Y0 + 14} fontSize={9} fill="#7c8db0">
              thickness t (mm) →
            </text>

            {/* feasible region */}
            <rect x={chart.optimumX} y={Y1 - 8} width={X1 - chart.optimumX} height={Y0 - Y1 + 8} fill="rgba(52,211,153,0.05)" />
            <line x1={chart.optimumX} y1={Y1} x2={chart.optimumX} y2={Y0} stroke="#fbbf24" strokeDasharray="4 4" />
            <text x={chart.optimumX + 4} y={Y1 + 10} fontSize={9} fill="#fbbf24">
              t* = {chart.optimumT.toFixed(4)} (feasible →)
            </text>

            {/* loss curve */}
            <path d={chart.lossPath} fill="none" stroke="#1e3a5f" strokeWidth="1.5" />
            {/* gradient flow line over the descent region */}
            {steps.length > 1 ? (
              <path
                d={chart.trailPath}
                fill="none"
                stroke="url(#flowGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#arrow)"
                className="flow"
              />
            ) : null}

            {/* step dots + trail */}
            {steps.map((s, i) => (
              <g key={s.step_hash}>
                {i === 0 ? null : (
                  <line
                    x1={xOf(steps[i - 1].x.thickness)}
                    y1={yOf(modelLoss(steps[i - 1].x.thickness, params))}
                    x2={xOf(s.x.thickness)}
                    y2={yOf(modelLoss(s.x.thickness, params))}
                    stroke="rgba(34,211,238,0.35)"
                    strokeWidth="1.5"
                  />
                )}
                <circle cx={xOf(s.x.thickness)} cy={yOf(modelLoss(s.x.thickness, params))} r="3" fill="#22d3ee" opacity="0.55">
                  <title>{`step ${s.step_no}: t=${s.x.thickness.toFixed(4)}, ∇Φ=${(s.gradient.dPhi_dt).toExponential(2)}`}</title>
                </circle>
              </g>
            ))}

            {/* animated marker */}
            {steps.length > 0 ? (
              <>
                <circle cx={chart.markerX} cy={chart.markerY} r="10" fill="rgba(251,191,36,0.18)">
                  <animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle cx={chart.markerX} cy={chart.markerY} r="4" fill="#fbbf24" />
              </>
            ) : null}
          </svg>
        </section>

        {/* ---- Latest run steps ---- */}
        <section className="card col-6">
          <h2>
            Latest run — step chain
            <span className="tag">
              {chain ? (
                chain.valid ? (
                  <span className="ok">✓ chain verified ({chain.checked} hashes)</span>
                ) : (
                  <span className="error">✗ chain broken</span>
                )
              ) : (
                'verifying…'
              )}
            </span>
          </h2>
          <div className="actions" style={{ marginBottom: 10 }}>
            <select
              value={selectedRunId ?? ''}
              onChange={(e) => setSelectedRunId(e.target.value || null)}
              style={{ maxWidth: 260 }}
            >
              {runs.length === 0 ? <option value="">no runs</option> : null}
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id.slice(0, 8)} · {r.status} · {r.step_count} steps
                </option>
              ))}
            </select>
            {selectedRun ? (
              <span className="badge completed">{selectedRun.status}</span>
            ) : null}
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>t (mm)</th>
                  <th>∇Φ (dΦ/dt)</th>
                  <th>Φ(t)</th>
                  <th>step hash</th>
                  <th>prev</th>
                </tr>
              </thead>
              <tbody>
                {steps.slice(0, 30).map((s) => (
                  <tr key={s.step_hash}>
                    <td>{s.step_no}</td>
                    <td>{s.x.thickness.toFixed(6)}</td>
                    <td>{(s.gradient.dPhi_dt).toExponential(2)}</td>
                    <td>{s.loss.toFixed(2)}</td>
                    <td className="hash" title={s.step_hash}>
                      {shortHash(s.step_hash)}
                    </td>
                    <td className="hash" title={s.prev_hash ?? ''}>
                      {s.prev_hash ? shortHash(s.prev_hash) : 'genesis'}
                    </td>
                  </tr>
                ))}
                {steps.length > 30 ? (
                  <tr>
                    <td colSpan={6} className="muted">… {steps.length - 30} more steps</td>
                  </tr>
                ) : null}
                {steps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">No steps yet — run an optimisation.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {selectedRun ? (
            <div className="muted" style={{ marginTop: 10, fontSize: 11 }}>
              run fingerprint: <span className="hash">{selectedRun.model_fingerprint}</span>
            </div>
          ) : null}
        </section>

        {/* ---- Knowledge graph ---- */}
        <section className="card col-3">
          <h2>
            Knowledge graph
            <span className="tag">
              {nodes.length} nodes · {edges.length} edges
            </span>
          </h2>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <tbody>
                {relationCounts.map(([rel, n]) => (
                  <tr key={rel}>
                    <td className="row-label">
                      <span className="badge pending">{rel}</span>
                    </td>
                    <td className="right">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="muted" style={{ marginTop: 10, fontSize: 11 }}>
            Nodes are content-addressed and immutable; edges carry evidence hashes.
          </div>
        </section>

        {/* ---- Review queue ---- */}
        <section className="card col-3">
          <h2>
            Review queue
            <span className="tag">{proposals.filter((p) => p.status === 'PENDING').length} pending</span>
          </h2>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {proposals.length === 0 ? (
              <div className="muted">No proposals.</div>
            ) : (
              proposals.map((p) => (
                <div key={p.id} style={{ borderBottom: '1px solid rgba(31,44,71,0.5)', padding: '8px 0' }}>
                  <div className="actions" style={{ justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11 }}>{p.summary}</span>
                    <span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 10, margin: '4px 0' }}>
                    {new Date(p.created_at).toLocaleString()} · {shortHash(p.id)}
                  </div>
                  {p.decision ? (
                    <div className="muted" style={{ fontSize: 10 }}>
                      {p.decision.decision} by {p.decision.actor}
                      {p.decision.rationale ? ` — "${p.decision.rationale}"` : ''}
                    </div>
                  ) : null}
                  {p.status === 'PENDING' ? (
                    <div className="actions" style={{ marginTop: 6 }}>
                      {decideFor === p.id ? (
                        <>
                          <input
                            placeholder="rationale (optional)"
                            value={rationale}
                            onChange={(e) => setRationale(e.target.value)}
                            style={{ minWidth: 140 }}
                          />
                          <button onClick={() => void handleDecide(p, 'ACCEPTED')}>Accept</button>
                          <button onClick={() => void handleDecide(p, 'REJECTED')}>Reject</button>
                          <button onClick={() => { setDecideFor(null); setRationale(''); }}>✕</button>
                        </>
                      ) : (
                        <button onClick={() => { setDecideFor(p.id); setRationale(''); }}>Decide</button>
                      )}
                    </div>
                  ) : null}
                  {p.run_id ? (
                    <div className="muted" style={{ fontSize: 10 }}>
                      linked run: {shortHash(p.run_id)}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ---- Evidence-bound spans ---- */}
        <section className="card col-12">
          <h2>
            Evidence-bound spans
            <span className="tag">content-addressed · immutable · retract = append new revision</span>
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Claim</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {spans.map((s) => (
                  <tr key={s.id}>
                    <td className="muted" style={{ maxWidth: 220 }}>
                      {s.document_ref}
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div>{s.claim}</div>
                      <div className="muted" style={{ fontSize: 10 }}>{s.quote}</div>
                    </td>
                    <td>
                      <span className="kv">
                        <b>{s.value_json?.value}</b>
                        {s.unit ? ` ${s.unit}` : ''}
                      </span>
                    </td>
                    <td>
                      {s.retracted ? (
                        <span className="badge retracted">
                          retracted{s.retraction ? ` — ${s.retraction.reason.slice(0, 40)}` : ''}
                        </span>
                      ) : (
                        <span className="badge active">verified</span>
                      )}
                      <div className="hash" style={{ fontSize: 10, marginTop: 4 }}>{shortHash(s.id)}</div>
                    </td>
                    <td>
                      {s.retracted ? (
                        <span className="muted" style={{ fontSize: 11 }}>locked</span>
                      ) : retractFor === s.id ? (
                        <div style={{ minWidth: 240 }}>
                          <div className="field">
                            <label>revised value</label>
                            <input value={revisedValue} onChange={(e) => setRevisedValue(e.target.value)} type="number" step="any" />
                          </div>
                          <div className="field">
                            <label>reason</label>
                            <input value={revisedReason} onChange={(e) => setRevisedReason(e.target.value)} placeholder="e.g. re-test showed 230 MPa" />
                          </div>
                          <div className="actions">
                            <button className="primary" disabled={busy} onClick={() => void handleRetract(s)}>
                              Confirm retraction
                            </button>
                            <button onClick={() => setRetractFor(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setRetractFor(s.id); setRevisedValue(String(s.value_json?.value ?? '')); setRevisedReason(''); }}>
                          Retract
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---- Audit log ---- */}
        <section className="card col-12">
          <h2>Audit log</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Detail</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 15).map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td><span className="badge active">{a.action}</span></td>
                  <td className="muted">{a.entity}</td>
                  <td className="hash" style={{ fontSize: 11 }}>
                    {JSON.stringify(a.detail).slice(0, 120)}
                  </td>
                  <td className="muted">{new Date(a.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
              {audit.length === 0 ? (
                <tr><td colSpan={5} className="muted">No audit entries yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>

      <footer className="foot">
        KTN DEBKG demo · dual-number automatic differentiation · SHA-256 content addressing ·
        PostgreSQL RLS + append-only evidence · objective Φ(t) = mass(t) + λ·max(0, g(t))²,
        g(t) = F/(w·t) − σ<sub>allow</sub> · optimum t* = 4.0 mm; retracting yield 250 → 230 MPa
        re-optimises to 4.348 mm.
      </footer>
    </div>
  );
}
