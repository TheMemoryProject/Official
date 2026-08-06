import type { FastifyInstance } from 'fastify';
import { getGraph, getSpans } from '../services/knowledgeGraph.js';
import { getGradientChecks, auditLog } from '../services/optimization.js';
import { query } from '../db.js';

export async function registerGraphRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/graph', async (_req, reply) => {
    const { nodes, edges } = await getGraph();
    return reply.send({ nodes, edges });
  });

  app.get('/api/evidence/spans', async (_req, reply) => {
    const spans = await getSpans();
    return reply.send({ spans });
  });

  app.get('/api/parameters', async (_req, reply) => {
    const designVariables = await query(
      `SELECT id, name, symbol, value_json, unit, lower_bound, upper_bound, active
       FROM design_variables ORDER BY id`
    );
    const parameters = await query(
      `SELECT id, name, value_json, unit, bound_span_id, status
       FROM model_parameters ORDER BY id`
    );
    const equations = await query(
      `SELECT id, name, expression, source_node, target_node, bound_span_id
       FROM model_equations ORDER BY id`
    );
    return reply.send({ design_variables: designVariables, parameters, equations });
  });

  app.get('/api/gradient-checks', async (_req, reply) => {
    const checks = await getGradientChecks();
    return reply.send({ checks });
  });

  app.get('/api/audit', async (_req, reply) => {
    const log = await auditLog();
    return reply.send({ log });
  });
}
