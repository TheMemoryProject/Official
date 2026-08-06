import { query } from '../db.js';

export interface GraphNode {
  id: string;
  name: string;
  node_type: string;
  value_json: Record<string, unknown> | null;
  unit: string | null;
  description: string | null;
  evidence_hashes: string[];
}

export interface GraphEdge {
  source_key: string;
  target_key: string;
  relation: string;
  weight: number;
  evidence_hashes: string[];
}

export interface EvidenceSpan {
  id: string;
  document_ref: string;
  quote: string;
  claim: string;
  value_json: Record<string, unknown> | null;
  unit: string | null;
  verified: boolean;
  created_at: string;
  retracted: boolean;
  retraction?: { reason: string; actor: string; revised_span_id: string | null; created_at: string };
}

export async function getGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const nodes = await query<GraphNode>('SELECT id, name, node_type, value_json, unit, description, evidence_hashes FROM kv_nodes ORDER BY id');
  const edges = await query<GraphEdge>('SELECT source_key, target_key, relation, weight, evidence_hashes FROM kv_edges ORDER BY source_key, target_key');
  return { nodes, edges };
}

export async function getSpans(): Promise<EvidenceSpan[]> {
  const rows = await query<{
    id: string;
    document_ref: string;
    quote: string;
    claim: string;
    value_json: Record<string, unknown> | null;
    unit: string | null;
    verified: boolean;
    created_at: string;
    retraction_reason: string | null;
    retraction_actor: string | null;
    revised_span_id: string | null;
    retraction_created_at: string | null;
  }>(`
    SELECT s.id, s.document_ref, s.quote, s.claim, s.value_json, s.unit, s.verified, s.created_at,
           r.reason  AS retraction_reason,
           r.actor   AS retraction_actor,
           r.revised_span_id,
           r.created_at AS retraction_created_at
    FROM evidence_spans s
    LEFT JOIN LATERAL (
      SELECT reason, actor, revised_span_id, created_at
      FROM evidence_retractions
      WHERE retracted_span_id = s.id
      ORDER BY created_at DESC
      LIMIT 1
    ) r ON true
    ORDER BY s.document_ref, s.id
  `);
  return rows.map((r) => ({
    id: r.id,
    document_ref: r.document_ref,
    quote: r.quote,
    claim: r.claim,
    value_json: r.value_json,
    unit: r.unit,
    verified: r.verified,
    created_at: r.created_at,
    retracted: r.retraction_reason !== null,
    retraction: r.retraction_reason
      ? {
          reason: r.retraction_reason,
          actor: r.retraction_actor as string,
          revised_span_id: r.revised_span_id,
          created_at: r.retraction_created_at as string,
        }
      : undefined,
  }));
}

export async function getSpanById(id: string) {
  const rows = await query<{ id: string; document_ref: string; quote: string; claim: string; value_json: Record<string, unknown> | null; unit: string | null; verified: boolean }>(
    'SELECT id, document_ref, quote, claim, value_json, unit, verified FROM evidence_spans WHERE id = $1',
    [id]
  );
  return rows[0];
}

export async function spanIsRetracted(id: string): Promise<boolean> {
  const rows = await query('SELECT 1 FROM evidence_retractions WHERE retracted_span_id = $1 LIMIT 1', [id]);
  return rows.length > 0;
}
