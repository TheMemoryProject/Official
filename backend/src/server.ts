import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ping, pool } from './db.js';
import { runGradientCheckAndRecord } from './services/optimization.js';
import { registerGraphRoutes } from './routes/graph.js';
import { registerOptimizationRoutes } from './routes/optimization.js';
import { registerEvidenceRoutes } from './routes/evidence.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';
const GRADIENT_CHECK_ON_BOOT = (process.env.GRADIENT_CHECK_ON_BOOT ?? 'true') !== 'false';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

await app.register(cors, { origin: true });

app.get('/health', async (_req, reply) => {
  await ping();
  return reply.send({ status: 'ok', db: 'ok', uptime: process.uptime() });
});

app.get('/openapi.json', async () => ({
  openapi: '3.0.0',
  info: {
    title: 'KTN DEBKG — Differentiable Evidence-Bound Knowledge Graph API',
    version: '1.0.0',
    description:
      'Evidence-bound engineering reasoning platform. Optimisation runs are ' +
      'content-addressed; evidence spans are immutable and retracted append-only.',
  },
  paths: {
    '/health': { get: { summary: 'Liveness + DB ping' } },
    '/api/graph': { get: { summary: 'Knowledge graph nodes + edges' } },
    '/api/evidence/spans': { get: { summary: 'Evidence spans (with retraction status)' } },
    '/api/parameters': { get: { summary: 'Design variables, parameters, equations' } },
    '/api/gradient-checks': { get: { summary: 'Recent AD gradient checks' } },
    '/api/runs': { get: { summary: 'List optimisation runs' }, post: { summary: 'Start an optimisation run' } },
    '/api/runs/{id}/steps': { get: { summary: 'Content-addressed step chain' } },
    '/api/runs/{id}/verify': { get: { summary: 'Verify hash chain integrity' } },
    '/api/retractions': { post: { summary: 'Retract evidence + rebind parameters' } },
    '/api/proposals': { get: { summary: 'Review queue' } },
    '/api/proposals/{id}/decide': { post: { summary: 'Accept/reject proposal (accept auto re-optimises)' } },
    '/api/audit': { get: { summary: 'Recent audit log' } },
  },
}));

await registerGraphRoutes(app);
await registerOptimizationRoutes(app);
await registerEvidenceRoutes(app);

// Boot-time gradient check: AD (dual numbers) vs finite differences, recorded.
if (GRADIENT_CHECK_ON_BOOT) {
  try {
    const check = await runGradientCheckAndRecord();
    app.log.info(
      `boot gradient check passed=${check.passed} analytic=${check.analyticGradient.toFixed(4)} ` +
        `finiteDiff=${check.finiteDifferenceGradient.toFixed(4)} relErr=${check.relativeError.toExponential(2)}`
    );
  } catch (err) {
    app.log.error(err, 'boot gradient check failed');
    await pool.end();
    process.exit(1);
  }
}

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`);
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`KTN DEBKG API listening on http://${HOST}:${PORT}`);
});
