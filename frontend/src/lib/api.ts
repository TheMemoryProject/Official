export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface GraphNode {
  id: string;
  name: string;
  node_type: string;
  value_json: { value?: number } | null;
  unit: string | null;
  description: string | null;
  evidence_hashes: string[];
}

export interface GraphEdge {
  source_key: string;
  target_key: string;
  relation: string;
  weight: number;
}

export interface EvidenceSpan {
  id: string;
  document_ref: string;
  quote: string;
  claim: string;
  value_json: { value?: number } | null;
  unit: string | null;
  verified: boolean;
  created_at: string;
  retracted: boolean;
  retraction?: {
    reason: string;
    actor: string;
    revised_span_id: string | null;
    created_at: string;
  };
}

export interface GradientCheck {
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

export interface RunRecord {
  id: string;
  run_type: string;
  model_fingerprint: string;
  input_json: {
    start?: number;
    lr?: number;
    maxIter?: number;
    lowerBound?: number;
    upperBound?: number;
    trigger?: string;
    parameters?: Record<string, unknown>;
  };
  status: string;
  progress: number;
  current_x: { thickness?: number } | null;
  current_loss: number | null;
  step_count: number;
  evidence_hashes: string[];
  iterations: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface RunStep {
  step_no: number;
  x: { thickness: number };
  gradient: { dPhi_dt: number };
  loss: number;
  step_hash: string;
  prev_hash: string | null;
  model_fingerprint: string;
  created_at: string;
}

export interface ChainVerify {
  valid: boolean;
  checked: number;
  root_fingerprint: string | null;
  firstBad?: { step_no: number; reason: string };
}

export interface Proposal {
  id: string;
  kind: string;
  summary: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  diff: string;
  evidence_hashes: string[];
  audit_refs: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  run_id: string | null;
  created_at: string;
  decision?: {
    decision: string;
    rationale: string | null;
    actor: string;
    created_at: string;
  } | null;
}

export interface AuditEntry {
  id: number;
  action: string;
  entity: string;
  entity_id: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; db: string }>('/health'),

  getGraph: () => request<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/api/graph'),
  getSpans: () => request<{ spans: EvidenceSpan[] }>('/api/evidence/spans'),
  getGradientChecks: () => request<{ checks: GradientCheck[] }>('/api/gradient-checks'),

  getRuns: () => request<{ runs: RunRecord[] }>('/api/runs'),
  getRun: (id: string) => request<{ run: RunRecord }>(`/api/runs/${id}`),
  getSteps: (id: string) => request<{ steps: RunStep[] }>(`/api/runs/${id}/steps`),
  verifyRun: (id: string) => request<ChainVerify>(`/api/runs/${id}/verify`),
  runOptimisation: (cfg?: { start?: number; lr?: number; maxIter?: number; trigger?: string }) =>
    request<{ run: RunRecord; steps: RunStep[]; analytic_optimum: number }>('/api/runs', {
      method: 'POST',
      body: JSON.stringify(cfg ?? {}),
    }),

  runGradientCheck: () =>
    request<{ passed: boolean }>('/api/gradient-checks/run', { method: 'POST' }),

  getProposals: () => request<{ proposals: Proposal[] }>('/api/proposals'),
  retractSpan: (payload: {
    span_id: string;
    reason: string;
    revised?: { value: number; unit?: string };
  }) =>
    request<{ proposal: Proposal; affected_parameters: string[] }>('/api/retractions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  decideProposal: (id: string, decision: 'ACCEPTED' | 'REJECTED', rationale?: string) =>
    request<{ proposal: Proposal; run?: RunRecord }>(`/api/proposals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, rationale, actor: 'reviewer@ktn' }),
    }),

  getAudit: () => request<{ log: AuditEntry[] }>('/api/audit'),
};
