import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { findRepoRoot } from '@/lib/capabilities/ledger';

/**
 * Real Postgres, in-process, for integration tests.
 *
 * Rule 2 forbids proving a subsystem works by mocking the dependency under test. These
 * tests therefore run against PGlite — an actual Postgres build compiled to WASM — with
 * the actual `prisma/schema.prisma` applied. Queries go through the real Prisma Client.
 * Nothing about the data layer is simulated.
 */

const REPO_ROOT = findRepoRoot();
const DDL_PATH = path.join(REPO_ROOT, 'prisma', 'ddl-snapshot.sql');

export interface TestDb {
  prisma: PrismaClient;
  close: () => Promise<void>;
}

/**
 * Regenerates the DDL snapshot from the live schema. Keeping this derived rather than
 * hand-written means the test database can never drift from prisma/schema.prisma.
 */
export function regenerateDdlSnapshot(): string {
  // Invoke the Prisma CLI through Node rather than `npx`: on Windows, execFileSync
  // cannot launch a .cmd shim (EINVAL), and going through a shell would be slower
  // and quoting-sensitive.
  const prismaCli = path.join(REPO_ROOT, 'node_modules', 'prisma', 'build', 'index.js');

  const sql = execFileSync(
    process.execPath,
    [
      prismaCli,
      'migrate',
      'diff',
      '--from-empty',
      '--to-schema-datamodel',
      'prisma/schema.prisma',
      '--script',
    ],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  );

  fs.writeFileSync(DDL_PATH, sql, 'utf8');
  return sql;
}

const SCHEMA_PATH = path.join(REPO_ROOT, 'prisma', 'schema.prisma');

/**
 * Returns the DDL, regenerating it first if prisma/schema.prisma has changed since the
 * snapshot was written.
 *
 * Self-healing on purpose: a stale snapshot fails every integration test with
 * "table does not exist", which looks like a bug in the code under test rather than a
 * stale artifact. Staleness must never be a thing a developer has to remember.
 */
function readDdl(): string {
  const schemaNewer =
    !fs.existsSync(DDL_PATH) ||
    fs.statSync(SCHEMA_PATH).mtimeMs > fs.statSync(DDL_PATH).mtimeMs;

  if (schemaNewer) {
    regenerateDdlSnapshot();
  }

  // Strip the UTF-8 BOM PowerShell may prepend; Postgres rejects it as a syntax error.
  return fs.readFileSync(DDL_PATH, 'utf8').replace(/^﻿/, '');
}

/**
 * Boots a fresh, isolated in-memory Postgres with the full KTN schema applied.
 * Each call returns a completely independent database, so tests cannot leak state
 * into one another.
 */
export async function createTestDb(): Promise<TestDb> {
  const pglite = new PGlite();
  await pglite.waitReady;

  await pglite.exec(readDdl());

  const adapter = new PrismaPGlite(pglite);
  const prisma = new PrismaClient({ adapter, log: [] });

  return {
    prisma,
    close: async () => {
      await prisma.$disconnect();
      await pglite.close();
    },
  };
}
