import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GET } from '@/app/api/system/capabilities/route';
import { findRepoRoot } from '@/lib/capabilities/ledger';

/**
 * Integration test for GET /api/system/capabilities.
 *
 * Per Rule 2, this starts at the system boundary — the real route handler — and asserts
 * against the real on-disk ledger. Nothing is mocked: the handler reads the actual
 * capability-ledger.json from the actual filesystem.
 */

const REPO_ROOT = findRepoRoot();
const ON_DISK = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'capability-ledger.json'), 'utf8')
);

function call(url: string) {
  return GET(new Request(url));
}

describe('GET /api/system/capabilities', () => {
  it('returns 200 and the full ledger', async () => {
    const res = await call('http://localhost/api/system/capabilities');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.capabilities).toHaveLength(ON_DISK.capabilities.length);
    expect(body.ledgerVersion).toBe(ON_DISK.ledgerVersion);
    expect(body.commitAudited).toBe(ON_DISK.commitAudited);
  });

  it('serves the same capability records that are on disk', async () => {
    const res = await call('http://localhost/api/system/capabilities');
    const body = await res.json();

    const served = body.capabilities.map((c: { id: string; status: string }) => `${c.id}:${c.status}`).sort();
    const disk = ON_DISK.capabilities
      .map((c: { id: string; status: string }) => `${c.id}:${c.status}`)
      .sort();

    expect(served).toEqual(disk);
  });

  it('returns a summary whose counts add up to the capability total', async () => {
    const res = await call('http://localhost/api/system/capabilities');
    const { summary } = await res.json();

    expect(summary.REAL + summary.PARTIAL + summary.SHELL + summary.ABSENT).toBe(summary.total);
    expect(summary.total).toBe(ON_DISK.capabilities.length);
  });

  it('filters by status', async () => {
    const res = await call('http://localhost/api/system/capabilities?status=SHELL');
    const body = await res.json();

    expect(body.capabilities.length).toBeGreaterThan(0);
    for (const c of body.capabilities) {
      expect(c.status).toBe('SHELL');
    }

    const expected = ON_DISK.capabilities.filter((c: { status: string }) => c.status === 'SHELL');
    expect(body.capabilities).toHaveLength(expected.length);
  });

  it('filters by mechanism', async () => {
    const res = await call('http://localhost/api/system/capabilities?mechanism=M7');
    const body = await res.json();

    expect(body.capabilities.length).toBeGreaterThan(0);
    for (const c of body.capabilities) {
      expect(c.mechanism).toBe('M7');
    }
  });

  it('never reports a mechanism capability as REAL at Phase 0', async () => {
    const res = await call('http://localhost/api/system/capabilities?status=REAL');
    const body = await res.json();

    for (const c of body.capabilities) {
      expect(c.mechanism, `${c.id} claims a differentiating mechanism is REAL`).toBeNull();
    }
  });

  it('exposes the status definitions so a consumer cannot misread a status', async () => {
    const res = await call('http://localhost/api/system/capabilities');
    const body = await res.json();

    for (const status of ['REAL', 'PARTIAL', 'SHELL', 'ABSENT']) {
      expect(body.statusDefinitions[status]).toBeTruthy();
    }
  });
});
