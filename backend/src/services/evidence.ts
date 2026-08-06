import { query, queryOne } from '../db.js';
import { spanContentHash } from '../domain-core/hash.js';
import { getSpanById, spanIsRetracted } from './knowledgeGraph.js';
import { runOptimisation, RunRecord } from './optimization.js';

export interface RetractionRequest {
  span_id: string;
  reason: string;
  actor: string;
  revised?: {
    document_ref: string;
    quote: string;
    claim: string;
    value: number;
    unit?: string | null;
  };
}

export interface ProposalRow {
  id: string;
  kind: string;
  summary: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  diff: string;
  evidence_hashes: string[];
  audit_refs: string[];
  status: string;
  run_id: string | null;
  created_at: string;
}

export interface DecisionRow {
  id: string;
  proposal_id: string;
  decision: string;
  rationale: string | null;
  actor: string;
  created_at: string;
}

/**
 * Retract an evidence span: append a retraction record (immutable), add the
 * revised span if supplied, rebind affected ACTIVE model parameters to the
 * revised span, and open a review-queue proposal for the change.
 */
export async function retractSpan(req: RetractionRequest): Promise<{
  retraction: { id: string; span_id: string; revised_span_id: string | null; reason: string; actor: string };
  proposal: ProposalRow;
  affected_parameters: string[];
}> {
  const span = await getSpanById(req.span_id);
  if (!span) {
    const err = new Error(`Evidence span ${req.span_id} not found`);
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }
  if (await spanIsRetracted(req.span_id)) {
    const err = new Error(`Evidence span ${req.span_id} is already retracted`);
    (err as Error & { statusCode?: number }).statusCode = 409;
    throw err;
  }

  let revisedSpanId: string | null = null;
  if (req.revised) {
    const revisedValueJson = JSON.stringify({ value: req.revised.value });
    revisedSpanId = spanContentHash({
      documentRef: req.revised.document_ref,
      quote: req.revised.quote,
      claim: req.revised.claim,
      valueJson: revisedValueJson,
      unit: req.revised.unit ?? null,
    });
    // Append-only: insert the revised span (content-addressed, id = hash).
    await query(
      `INSERT INTO evidence_spans (id, document_ref, quote, claim, value_json, unit, verified)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, true)
       ON CONFLICT (id) DO NOTHING`,
      [revisedSpanId, req.revised.document_ref, req.revised.quote, req.revised.claim, revisedValueJson, req.revised.unit ?? null]
    );
  }

  const retraction = await queryOne<{ id: string }>(
    `INSERT INTO evidence_retractions (retracted_span_id, revised_span_id, reason, actor)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [req.span_id, revisedSpanId, req.reason, req.actor]
  );

  // Rebind affected ACTIVE parameters to the revised span (evidence-bound update).
  const affected = await query<{ id: string; name: string }>(
    `SELECT id, name FROM model_parameters WHERE bound_span_id = $1 AND status = 'ACTIVE'`,
    [req.span_id]
  );
  for (const p of affected) {
    const revised = req.revised;
    const valueJson = revised ? JSON.stringify({ value: revised.value }) : undefined;
    await query(
      `UPDATE model_parameters
       SET bound_span_id = COALESCE($2, bound_span_id),
           value_json    = COALESCE($3::jsonb, value_json),
           updated_at    = now()
       WHERE id = $1`,
      [p.id, revisedSpanId, valueJson ?? null]
    );
  }

  await query(
    `INSERT INTO audit_log (action, entity, entity_id, detail)
     VALUES ('EVIDENCE_RETRACTION', 'evidence_spans', $1, $2::jsonb)`,
    [
      req.span_id,
      JSON.stringify({
        reason: req.reason,
        actor: req.actor,
        revised_span_id: revisedSpanId,
        affected_parameters: affected.map((a) => a.name),
      }),
    ]
  );

  // Open a review-queue proposal (PENDING) for the evidence-driven change.
  const proposal = await queryOne<ProposalRow>(
    `INSERT INTO proposals
       (kind, summary, old_values, new_values, diff, evidence_hashes, audit_refs, status)
     VALUES (
       'RETRACTION_RE_OPTIMISATION',
       $1,
       $2::jsonb,
       $3::jsonb,
       $4,
       $5::jsonb,
       $6::jsonb,
       'PENDING'
     )
     RETURNING id, kind, summary, old_values, new_values, diff, evidence_hashes, audit_refs, status, run_id, created_at`,
    [
      `Retraction of evidence span ${req.span_id.slice(0, 12)}… — rebind ${affected.map((a) => a.name).join(', ') || 'parameters'}`,
      JSON.stringify({ [req.span_id]: span.claim }),
      JSON.stringify(
        req.revised
          ? { revised_span_id: revisedSpanId, value: req.revised.value }
          : { revised_span_id: null }
      ),
      req.reason,
      JSON.stringify([req.span_id, ...(revisedSpanId ? [revisedSpanId] : [])]),
      JSON.stringify([retraction?.id]),
    ]
  );

  return {
    retraction: {
      id: retraction?.id as string,
      span_id: req.span_id,
      revised_span_id: revisedSpanId,
      reason: req.reason,
      actor: req.actor,
    },
    proposal: proposal as ProposalRow,
    affected_parameters: affected.map((a) => a.name),
  };
}

export async function getProposals(): Promise<Array<ProposalRow & { decision?: DecisionRow }>> {
  const rows = await query<ProposalRow & { decision_id: string | null; decision: string | null; rationale: string | null; actor: string | null; decision_created_at: string | null }>(`
    SELECT p.id, p.kind, p.summary, p.old_values, p.new_values, p.diff,
           p.evidence_hashes, p.audit_refs, p.status, p.run_id, p.created_at,
           d.id AS decision_id, d.decision, d.rationale, d.actor, d.created_at AS decision_created_at
    FROM proposals p
    LEFT JOIN LATERAL (
      SELECT id, decision, rationale, actor, created_at
      FROM proposal_decisions
      WHERE proposal_id = p.id
      ORDER BY created_at DESC
      LIMIT 1
    ) d ON true
    ORDER BY
      CASE p.status WHEN 'PENDING' THEN 0 ELSE 1 END,
      p.created_at DESC
  `);
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    summary: r.summary,
    old_values: r.old_values,
    new_values: r.new_values,
    diff: r.diff,
    evidence_hashes: r.evidence_hashes,
    audit_refs: r.audit_refs,
    status: r.status,
    run_id: r.run_id,
    created_at: r.created_at,
    decision:
      r.decision && r.decision_id
        ? {
            id: r.decision_id,
            proposal_id: r.id,
            decision: r.decision,
            rationale: r.rationale,
            actor: r.actor as string,
            created_at: r.decision_created_at as string,
          }
        : undefined,
  }));
}

/**
 * Decide on a proposal. Accepting a RETRACTION_RE_OPTIMISATION proposal
 * automatically runs the re-optimisation under the rebinding parameters.
 */
export async function decideProposal(
  proposalId: string,
  decision: 'ACCEPTED' | 'REJECTED',
  actor: string,
  rationale?: string
): Promise<{ proposal: ProposalRow; run?: RunRecord }> {
  if (decision !== 'ACCEPTED' && decision !== 'REJECTED') {
    const err = new Error('decision must be ACCEPTED or REJECTED');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  const proposal = await queryOne<ProposalRow>(
    `SELECT id, kind, summary, old_values, new_values, diff, evidence_hashes, audit_refs, status, run_id, created_at
     FROM proposals WHERE id = $1`,
    [proposalId]
  );
  if (!proposal) {
    const err = new Error(`Proposal ${proposalId} not found`);
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }
  if (proposal.status !== 'PENDING') {
    const err = new Error(`Proposal ${proposalId} has already been decided`);
    (err as Error & { statusCode?: number }).statusCode = 409;
    throw err;
  }

  await query(
    `INSERT INTO proposal_decisions (proposal_id, decision, rationale, actor)
     VALUES ($1, $2, $3, $4)`,
    [proposalId, decision, rationale ?? null, actor]
  );

  let run: RunRecord | undefined;
  let status = decision;
  if (decision === 'ACCEPTED' && proposal.kind === 'RETRACTION_RE_OPTIMISATION') {
    const full = await runOptimisation({ trigger: 'proposal-accepted' });
    run = full.run;
    status = 'ACCEPTED';
  }

  await query(
    `UPDATE proposals SET status = $2, run_id = COALESCE($3, run_id) WHERE id = $1`,
    [proposalId, status, run?.id ?? null]
  );

  await query(
    `INSERT INTO audit_log (action, entity, entity_id, detail)
     VALUES ($1, 'proposals', $2, $3::jsonb)`,
    [
      decision === 'ACCEPTED' ? 'PROPOSAL_ACCEPTED' : 'PROPOSAL_REJECTED',
      proposalId,
      JSON.stringify({ actor, rationale: rationale ?? null, run_id: run?.id ?? null }),
    ]
  );

  const updated = await queryOne<ProposalRow>(
    `SELECT id, kind, summary, old_values, new_values, diff, evidence_hashes, audit_refs, status, run_id, created_at
     FROM proposals WHERE id = $1`,
    [proposalId]
  );
  return { proposal: updated as ProposalRow, run };
}
