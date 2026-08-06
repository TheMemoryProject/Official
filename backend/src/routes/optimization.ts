import type { FastifyInstance } from 'fastify';
import {
  runOptimisation,
  getRuns,
  getRun,
  getSteps,
  verifyRunChain,
  runGradientCheckAndRecord,
} from '../services/optimization.js';

export async function registerOptimizationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/runs', async (_req, reply) => {
    const runs = await getRuns();
    return reply.send({ runs });
  });

  app.get('/api/runs/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const run = await getRun(id);
    if (!run) return reply.code(404).send({ error: 'run not found' });
    return reply.send({ run });
  });

  app.get('/api/runs/:id/steps', async (req, reply) => {
    const { id } = req.params as { id: string };
    const steps = await getSteps(id);
    return reply.send({ steps });
  });

  app.get('/api/runs/:id/verify', async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await verifyRunChain(id);
    return reply.send(result);
  });

  app.post('/api/runs', async (req, reply) => {
    const body = (req.body ?? {}) as {
      start?: number;
      lr?: number;
      maxIter?: number;
      trigger?: string;
    };
    const full = await runOptimisation(body);
    return reply.code(201).send(full);
  });

  app.post('/api/gradient-checks/run', async (_req, reply) => {
    const result = await runGradientCheckAndRecord();
    return reply.send(result);
  });
}
