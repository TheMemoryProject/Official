import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  findRepoRoot,
  loadLedger,
  summarise,
  type Capability,
  type CapabilityStatus,
} from '@/lib/capabilities/ledger';
import { TEST_INCLUDE_GLOBS } from '../vitest.config';

/**
 * PHASE 0 — LEDGER ENFORCEMENT
 *
 * Directive task 4: "Write a test that fails the build if any capability is marked REAL
 * without at least one referenced test file that actually exists and passes. The ledger
 * must not be able to lie."
 *
 * The "and passes" half is enforced structurally rather than by re-running anything:
 * a referenced test file must be matched by the runner's own include glob, which means
 * it executes in this same suite. If it fails, the suite fails, and the build fails with
 * it. A capability therefore cannot cite a test that is never run.
 */

const REPO_ROOT = findRepoRoot();
const LEDGER = loadLedger(REPO_ROOT);

const VALID_STATUSES: CapabilityStatus[] = ['REAL', 'PARTIAL', 'SHELL', 'ABSENT'];

/** Minimal glob to RegExp for the `**` / `*` patterns used in vitest.config.ts. */
function globToRegExp(glob: string): RegExp {
  let out = '';
  let i = 0;

  while (i < glob.length) {
    if (glob.startsWith('**/', i)) {
      out += '(?:.*/)?'; // `**/` may match zero directories
      i += 3;
    } else if (glob.startsWith('**', i)) {
      out += '.*';
      i += 2;
    } else if (glob[i] === '*') {
      out += '[^/]*'; // a single `*` never crosses a path separator
      i += 1;
    } else {
      out += glob[i].replace(/[.+^${}()|[\]\\?]/g, '\\$&');
      i += 1;
    }
  }

  return new RegExp(`^${out}$`);
}

const INCLUDE_MATCHERS = TEST_INCLUDE_GLOBS.map(globToRegExp);

function isCollectedByRunner(testPath: string): boolean {
  const normalised = testPath.split(path.sep).join('/');
  return INCLUDE_MATCHERS.some((re) => re.test(normalised));
}

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

const realCapabilities = LEDGER.capabilities.filter((c) => c.status === 'REAL');

describe('glob matcher used by this suite', () => {
  it('matches paths under the tests directory', () => {
    expect(isCollectedByRunner('tests/ledger.spec.ts')).toBe(true);
    expect(isCollectedByRunner('tests/nested/deep/thing.spec.ts')).toBe(true);
  });

  it('rejects paths the runner would not collect', () => {
    expect(isCollectedByRunner('src/lib/thing.spec.ts')).toBe(false);
    expect(isCollectedByRunner('tests/helper.ts')).toBe(false);
    expect(isCollectedByRunner('tests/ledgerXspec.ts')).toBe(false);
  });
});

describe('capability ledger — structural integrity', () => {
  it('parses and carries the required top-level fields', () => {
    expect(LEDGER.ledgerVersion).toBeTruthy();
    expect(LEDGER.commitAudited).toBeTruthy();
    expect(Array.isArray(LEDGER.capabilities)).toBe(true);
    expect(LEDGER.capabilities.length).toBeGreaterThan(0);
  });

  it('defines every status it uses', () => {
    for (const status of VALID_STATUSES) {
      expect(LEDGER.statusDefinitions[status], `missing definition for ${status}`).toBeTruthy();
    }
  });

  it('has unique capability ids', () => {
    const ids = LEDGER.capabilities.map((c) => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate capability ids: ${duplicates.join(', ')}`).toEqual([]);
  });

  it('gives every capability a valid status, a name, and a note', () => {
    const malformed = LEDGER.capabilities.filter(
      (c) =>
        !c.id ||
        !c.name ||
        !VALID_STATUSES.includes(c.status) ||
        !c.notes ||
        typeof c.evidence !== 'object' ||
        !Array.isArray(c.evidence.files) ||
        !Array.isArray(c.evidence.tests)
    );
    expect(
      malformed.map((c) => c.id),
      'capabilities failing schema validation'
    ).toEqual([]);
  });
});

describe('capability ledger — REAL cannot be claimed without a running test', () => {
  it('every REAL capability references at least one test file', () => {
    const offenders = realCapabilities.filter((c) => c.evidence.tests.length === 0);
    expect(
      offenders.map((c) => c.id),
      'marked REAL with no test evidence'
    ).toEqual([]);
  });

  it('every test file referenced by a REAL capability exists on disk', () => {
    const offenders: string[] = [];
    for (const c of realCapabilities) {
      for (const t of c.evidence.tests) {
        if (!exists(t)) offenders.push(`${c.id} -> ${t}`);
      }
    }
    expect(offenders, 'REAL capabilities citing non-existent test files').toEqual([]);
  });

  it('every test file referenced by a REAL capability is collected by the runner', () => {
    const offenders: string[] = [];
    for (const c of realCapabilities) {
      for (const t of c.evidence.tests) {
        if (!isCollectedByRunner(t)) offenders.push(`${c.id} -> ${t}`);
      }
    }
    expect(
      offenders,
      `REAL capabilities citing tests outside the runner include globs (${TEST_INCLUDE_GLOBS.join(', ')}). ` +
        'A test that never runs is not evidence.'
    ).toEqual([]);
  });

  it('every test file referenced by a REAL capability contains at least one assertion', () => {
    const offenders: string[] = [];
    for (const c of realCapabilities) {
      for (const t of c.evidence.tests) {
        if (!exists(t)) continue;
        const body = fs.readFileSync(path.join(REPO_ROOT, t), 'utf8');
        const hasTestCase = /\b(it|test)\s*\(/.test(body);
        const hasAssertion = /\bexpect\s*\(/.test(body);
        if (!hasTestCase || !hasAssertion) offenders.push(`${c.id} -> ${t}`);
      }
    }
    expect(offenders, 'REAL capabilities citing test files with no test case or no assertion').toEqual([]);
  });

  it('every REAL capability references at least one implementation file', () => {
    const offenders = realCapabilities.filter((c) => c.evidence.files.length === 0);
    expect(
      offenders.map((c) => c.id),
      'marked REAL with no implementation evidence'
    ).toEqual([]);
  });
});

describe('capability ledger — evidence must be truthful', () => {
  it('every referenced implementation path exists on disk', () => {
    const offenders: string[] = [];
    for (const c of LEDGER.capabilities) {
      for (const f of c.evidence.files) {
        if (!exists(f)) offenders.push(`${c.id} -> ${f}`);
      }
    }
    expect(offenders, 'capabilities citing non-existent implementation paths').toEqual([]);
  });

  it('every referenced test path exists on disk, at any status', () => {
    const offenders: string[] = [];
    for (const c of LEDGER.capabilities) {
      for (const t of c.evidence.tests) {
        if (!exists(t)) offenders.push(`${c.id} -> ${t}`);
      }
    }
    expect(offenders, 'capabilities citing non-existent test paths').toEqual([]);
  });

  it('ABSENT capabilities claim no test coverage', () => {
    const offenders = LEDGER.capabilities.filter(
      (c) => c.status === 'ABSENT' && c.evidence.tests.length > 0
    );
    expect(
      offenders.map((c) => c.id),
      'ABSENT capabilities cannot have tests — if a test exercises it, it is not absent'
    ).toEqual([]);
  });

  it('SHELL capabilities claim no test coverage', () => {
    const offenders = LEDGER.capabilities.filter(
      (c) => c.status === 'SHELL' && c.evidence.tests.length > 0
    );
    expect(
      offenders.map((c) => c.id),
      'SHELL capabilities cannot cite passing tests — a test over a hardcoded return proves nothing. ' +
        'Promote the capability or drop the test reference.'
    ).toEqual([]);
  });
});

describe('capability ledger — the ledger describes itself', () => {
  it('registers its own enforcement test as evidence', () => {
    const self = LEDGER.capabilities.find((c) => c.id === 'platform.capability-ledger');
    expect(self, 'the ledger must register itself as a capability').toBeDefined();
    expect(self!.status).toBe('REAL');
    expect(self!.evidence.tests).toContain('tests/ledger.spec.ts');
  });

  it('reports a summary consistent with its own entries', () => {
    const counts = summarise(LEDGER);
    expect(counts.total).toBe(LEDGER.capabilities.length);
    expect(counts.REAL + counts.PARTIAL + counts.SHELL + counts.ABSENT).toBe(counts.total);
    expect(counts.REAL).toBe(realCapabilities.length);
  });

  // Documents the Phase 0 baseline. When a later phase genuinely promotes a capability
  // to REAL, this number moves deliberately and the change is visible in review.
  it('records the Phase 0 baseline of REAL capabilities', () => {
    const ids = realCapabilities.map((c) => c.id).sort();
    expect(ids).toEqual(['platform.capabilities-api', 'platform.capability-ledger']);
  });
});

describe('capability ledger — no silent overclaim', () => {
  it('every capability that names a mechanism uses a known mechanism id', () => {
    const known = new Set(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9']);
    const offenders = LEDGER.capabilities.filter(
      (c: Capability) => c.mechanism !== null && !known.has(c.mechanism)
    );
    expect(
      offenders.map((c) => `${c.id} -> ${c.mechanism}`),
      'unknown mechanism ids'
    ).toEqual([]);
  });

  it('no mechanism M1–M9 is claimed REAL at Phase 0', () => {
    const offenders = LEDGER.capabilities.filter(
      (c) => c.mechanism !== null && c.status === 'REAL'
    );
    expect(
      offenders.map((c) => c.id),
      'a differentiating mechanism cannot be REAL before its phase has been built'
    ).toEqual([]);
  });
});
