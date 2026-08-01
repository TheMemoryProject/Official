import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestDb, type TestDb } from './helpers/test-db';
import {
  createBaseFixtures,
  createKnowledge,
  declareDependency,
  type BaseFixtures,
} from './helpers/fixtures';

/**
 * API-level integration tests for the evolution endpoints.
 *
 * The route handlers are imported and invoked directly, but everything below them is
 * real: real Prisma Client, real Postgres, real schema, real engine. Only two things
 * are substituted, and both are ambient request context rather than the dependency
 * under test — the Prisma singleton is pointed at the test database, and the auth
 * cookie is stubbed so a session exists.
 */

let db: TestDb;
let base: BaseFixtures;

vi.mock('@/lib/db', () => ({
  get prisma() {
    return (globalThis as { __testPrisma?: unknown }).__testPrisma;
  },
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => ({ value: (globalThis as { __testUserId?: string }).__testUserId }),
  }),
}));

beforeEach(async () => {
  db = await createTestDb();
  base = await createBaseFixtures(db.prisma);
  (globalThis as { __testPrisma?: unknown }).__testPrisma = db.prisma;
  // Sessions currently resolve the cookie value as a raw user id (see the Phase 0
  // audit finding on session integrity); this mirrors production behaviour exactly.
  (globalThis as { __testUserId?: string }).__testUserId = base.reviewerId;
}, 120_000);

afterEach(async () => {
  await db?.close();
  vi.resetModules();
});

async function post(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/evolution/change-events', () => {
  it('records a change event and returns 201', async () => {
    const { POST } = await import('@/app/api/evolution/change-events/route');

    const res = await POST(
      await post('http://localhost/api/evolution/change-events', {
        type: 'STANDARD_REVISED',
        dependencyKind: 'STANDARD',
        subjectIdentifier: 'ISO 5817',
        fromRevision: '2014',
        toRevision: '2026',
        summary: 'ISO 5817 revised; weld quality levels restructured.',
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.event.status).toBe('DETECTED');

    const stored = await db.prisma.changeEvent.findUnique({ where: { id: body.event.id } });
    expect(stored?.subjectIdentifier).toBe('ISO 5817');
    expect(stored?.detectedById).toBe(base.reviewerId);
  });

  it('rejects a change event with no meaningful summary', async () => {
    const { POST } = await import('@/app/api/evolution/change-events/route');

    const res = await POST(
      await post('http://localhost/api/evolution/change-events', {
        type: 'STANDARD_REVISED',
        dependencyKind: 'STANDARD',
        subjectIdentifier: 'ISO 5817',
        summary: 'x',
      })
    );

    expect(res.status).toBe(400);
    expect(await db.prisma.changeEvent.count()).toBe(0);
  });

  it('rejects an unauthenticated caller', async () => {
    (globalThis as { __testUserId?: string }).__testUserId = undefined;
    const { POST } = await import('@/app/api/evolution/change-events/route');

    const res = await POST(
      await post('http://localhost/api/evolution/change-events', {
        type: 'STANDARD_REVISED',
        dependencyKind: 'STANDARD',
        subjectIdentifier: 'ISO 5817',
        summary: 'Should not be recorded without a session.',
      })
    );

    expect(res.status).toBe(401);
    expect(await db.prisma.changeEvent.count()).toBe(0);
  });
});

describe('POST /api/evolution/change-events/[id]/propagate', () => {
  it('propagates and returns a reconciling report', async () => {
    const knowledgeId = await createKnowledge(db.prisma, base);
    await declareDependency(db.prisma, {
      knowledgeId,
      kind: 'STANDARD',
      targetIdentifier: 'ISO 5817',
      criticality: 'BLOCKING',
    });

    const event = await db.prisma.changeEvent.create({
      data: {
        type: 'STANDARD_WITHDRAWN',
        dependencyKind: 'STANDARD',
        subjectIdentifier: 'ISO 5817',
        summary: 'SYNTHETIC withdrawal for API test.',
      },
    });

    const { POST } = await import('@/app/api/evolution/change-events/[id]/propagate/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: Promise.resolve({ id: event.id }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.report.reconciles).toBe(true);
    expect(body.report.impacted).toBe(1);
    expect(body.impacts[0].newStatus).toBe('REVALIDATION_REQUIRED');
    expect(body.impacts[0].criticality).toBe('BLOCKING');
  });

  it('returns 409 when the event was already propagated', async () => {
    const event = await db.prisma.changeEvent.create({
      data: {
        type: 'STANDARD_REVISED',
        dependencyKind: 'STANDARD',
        subjectIdentifier: 'ISO 5817',
        summary: 'SYNTHETIC duplicate propagation test.',
      },
    });

    const { POST } = await import('@/app/api/evolution/change-events/[id]/propagate/route');
    const req = () => new Request('http://localhost/x', { method: 'POST' });
    const params = { params: Promise.resolve({ id: event.id }) };

    expect((await POST(req(), params)).status).toBe(200);
    expect((await POST(req(), { params: Promise.resolve({ id: event.id }) })).status).toBe(409);
  });
});

describe('GET /api/evolution/tasks', () => {
  it('returns the open revalidation queue ordered by risk', async () => {
    const majorId = await createKnowledge(db.prisma, base, { title: 'SYNTHETIC major' });
    const blockingId = await createKnowledge(db.prisma, base, { title: 'SYNTHETIC blocking' });

    for (const [id, criticality] of [
      [majorId, 'MAJOR'],
      [blockingId, 'BLOCKING'],
    ] as const) {
      await db.prisma.revalidationTask.create({
        data: {
          knowledgeId: id,
          criticality: criticality as never,
          reason: `SYNTHETIC ${criticality} task`,
          status: 'OPEN',
        },
      });
    }

    const { GET } = await import('@/app/api/evolution/tasks/route');
    const res = await GET(new Request('http://localhost/api/evolution/tasks'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(2);
    // BLOCKING sorts ahead of MAJOR: the queue is ordered by risk, not recency.
    expect(body.tasks[0].criticality).toBe('BLOCKING');
  });
});

describe('POST /api/evolution/tasks/[id]/resolve', () => {
  async function openTask(creatorIsReviewer = false) {
    const knowledgeId = await createKnowledge(db.prisma, base);
    if (creatorIsReviewer) {
      await db.prisma.knowledgeEntry.update({
        where: { id: knowledgeId },
        data: { creatorId: base.reviewerId },
      });
    }
    const task = await db.prisma.revalidationTask.create({
      data: {
        knowledgeId,
        criticality: 'MAJOR',
        reason: 'SYNTHETIC open task',
        status: 'OPEN',
      },
    });
    return { knowledgeId, taskId: task.id };
  }

  it('resolves a task and restores currency', async () => {
    const { knowledgeId, taskId } = await openTask();
    const { POST } = await import('@/app/api/evolution/tasks/[id]/resolve/route');

    const res = await POST(
      await post('http://localhost/x', {
        status: 'RESOLVED_CONFIRMED',
        rationale: 'Checked the new revision; this conclusion is unaffected.',
      }),
      { params: Promise.resolve({ id: taskId }) }
    );

    expect(res.status).toBe(200);

    const currency = await db.prisma.knowledgeCurrency.findUnique({ where: { knowledgeId } });
    expect(currency?.status).toBe('CURRENT');

    const history = await db.prisma.knowledgeStatusHistory.findFirst({
      where: { knowledgeId },
      orderBy: { createdAt: 'desc' },
    });
    expect(history?.actorId).toBe(base.reviewerId);
  });

  it('enforces separation of duties: an author cannot clear their own knowledge', async () => {
    const { taskId } = await openTask(true);
    const { POST } = await import('@/app/api/evolution/tasks/[id]/resolve/route');

    const res = await POST(
      await post('http://localhost/x', {
        status: 'RESOLVED_CONFIRMED',
        rationale: 'I wrote this and I say it is still fine.',
      }),
      { params: Promise.resolve({ id: taskId }) }
    );

    expect(res.status).toBe(403);

    const task = await db.prisma.revalidationTask.findUnique({ where: { id: taskId } });
    expect(task?.status).toBe('OPEN');
  });

  it('refuses an unexplained resolution', async () => {
    const { taskId } = await openTask();
    const { POST } = await import('@/app/api/evolution/tasks/[id]/resolve/route');

    const res = await POST(
      await post('http://localhost/x', { status: 'RESOLVED_CONFIRMED', rationale: 'fine' }),
      { params: Promise.resolve({ id: taskId }) }
    );

    expect(res.status).toBe(400);
  });
});

describe('GET /api/knowledge/[id]/currency', () => {
  it('returns a breakdown that fully derives the displayed score', async () => {
    const knowledgeId = await createKnowledge(db.prisma, base, {
      verifiedAt: new Date('2019-01-01'),
    });
    await declareDependency(db.prisma, {
      knowledgeId,
      kind: 'EVIDENCE',
      targetIdentifier: 'FIELD_DATA',
    });

    const { GET } = await import('@/app/api/knowledge/[id]/currency/route');
    const res = await GET(new Request('http://localhost/x'), {
      params: Promise.resolve({ id: knowledgeId }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    const summed = body.breakdown.reduce(
      (acc: number, t: { effect: number }) => acc + t.effect,
      0
    );
    expect(summed).toBe(body.currency.currencyScore);
    expect(body.currency.engineVersion).toContain('evolution-engine@');
    expect(body.decay.evidenceClass).toBe('FIELD_DATA');
  });

  it('returns 404 for unknown knowledge', async () => {
    const { GET } = await import('@/app/api/knowledge/[id]/currency/route');
    const res = await GET(new Request('http://localhost/x'), {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
    });
    expect(res.status).toBe(404);
  });
});
