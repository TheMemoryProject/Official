import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, type TestDb } from './helpers/test-db';

/**
 * Proves the integration harness itself is real before anything relies on it.
 * If this suite passes, every other integration test in this repository is running
 * against genuine Postgres with the genuine schema.
 */

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
}, 120_000);

afterAll(async () => {
  await db?.close();
});

describe('integration harness', () => {
  it('runs a real Postgres engine', async () => {
    const rows = await db.prisma.$queryRawUnsafe<{ version: string }[]>('SELECT version()');
    expect(rows[0].version).toMatch(/PostgreSQL/);
  });

  it('has the real KTN schema applied', async () => {
    const rows = await db.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    // The schema defines 74 models; the exact count is asserted loosely so adding a
    // model does not fail this test, but a schema that failed to apply will.
    expect(Number(rows[0].count)).toBeGreaterThan(70);
  });

  it('round-trips through the real Prisma Client', async () => {
    const org = await db.prisma.organization.create({
      data: { name: 'SYNTHETIC Test Org', slug: `synthetic-${Date.now()}` },
    });

    const found = await db.prisma.organization.findUnique({ where: { id: org.id } });
    expect(found?.name).toBe('SYNTHETIC Test Org');
  });

  it('enforces real database constraints', async () => {
    const slug = `synthetic-dup-${Date.now()}`;
    await db.prisma.organization.create({ data: { name: 'SYNTHETIC A', slug } });

    await expect(
      db.prisma.organization.create({ data: { name: 'SYNTHETIC B', slug } })
    ).rejects.toThrow();
  });
});
