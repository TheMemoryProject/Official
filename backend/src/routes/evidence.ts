import type { FastifyInstance } from 'fastify';
import { retractSpan, getProposals, decideProposal } from '../services/evidence.js';

export async function registerEvidenceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/retractions', async (req, reply) => {
    const body = req.body as {
      span_id: string;
      reason: string;
      actor?: string;
      revised?: {
        document_ref?: string;
        quote?: string;
        claim?: string;
        value: number;
        unit?: string | null;
      };
    };
    if (!body?.span_id || !body?.reason) {
      return reply.code(400).send({ error: 'span_id and reason are required' });
    }
    try {
      const result = await retractSpan({
        span_id: body.span_id,
        reason: body.reason,
        actor: body.actor ?? 'engineer@ktn',
        revised: body.revised
          ? {
              document_ref: body.revised.document_ref ?? 'Simulated RETR-2026: Revised Evidence',
              quote: body.revised.quote ?? 'Revised evidence: ' + body.reason,
              claim: body.revised.claim ?? `revised value = ${body.revised.value}`,
              value: body.revised.value,
              unit: body.revised.unit ?? 'MPa',
            }
          : undefined,
      });
      return reply.code(201).send(result);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  app.get('/api/proposals', async (_req, reply) => {
    const proposals = await getProposals();
    return reply.send({ proposals });
  });

  app.post('/api/proposals/:id/decide', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { decision: 'ACCEPTED' | 'REJECTED'; actor?: string; rationale?: string };
    if (!body?.decision) {
      return reply.code(400).send({ error: 'decision is required' });
    }
    try {
      const result = await decideProposal(id, body.decision, body.actor ?? 'reviewer@ktn', body.rationale);
      return reply.send(result);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
}
