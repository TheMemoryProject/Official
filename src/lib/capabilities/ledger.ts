import fs from 'node:fs';
import path from 'node:path';

export type CapabilityStatus = 'REAL' | 'PARTIAL' | 'SHELL' | 'ABSENT';

export interface CapabilityEvidence {
  files: string[];
  tests: string[];
}

export interface Capability {
  id: string;
  name: string;
  status: CapabilityStatus;
  mechanism: string | null;
  evidence: CapabilityEvidence;
  notes: string;
}

export interface CapabilityLedger {
  ledgerVersion: string;
  generatedAt: string;
  commitAudited: string;
  auditPhase: string;
  statusDefinitions: Record<CapabilityStatus, string>;
  rules: Record<string, string>;
  capabilities: Capability[];
}

export const LEDGER_FILENAME = 'capability-ledger.json';

/**
 * Resolves the repository root by walking up from this file until the ledger is found.
 * Works under both `next build` output and the Vitest runner, which resolve cwd differently.
 */
export function findRepoRoot(startDir: string = process.cwd()): string {
  let dir = path.resolve(startDir);

  for (;;) {
    if (fs.existsSync(path.join(dir, LEDGER_FILENAME))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not locate ${LEDGER_FILENAME} by walking up from ${startDir}. ` +
          'The capability ledger is required; the system must not report capabilities without it.'
      );
    }
    dir = parent;
  }
}

/**
 * Reads the ledger from disk. Deliberately not cached: the admin surface and the
 * enforcement test must both observe the current on-disk truth, not a build-time snapshot.
 */
export function loadLedger(repoRoot: string = findRepoRoot()): CapabilityLedger {
  const raw = fs.readFileSync(path.join(repoRoot, LEDGER_FILENAME), 'utf8');
  return JSON.parse(raw) as CapabilityLedger;
}

export function summarise(ledger: CapabilityLedger): Record<CapabilityStatus, number> & { total: number } {
  const counts = { REAL: 0, PARTIAL: 0, SHELL: 0, ABSENT: 0, total: 0 };
  for (const c of ledger.capabilities) {
    counts[c.status] += 1;
    counts.total += 1;
  }
  return counts;
}

/**
 * The single authority on whether a capability may be advertised.
 * Any UI or marketing surface that claims a capability MUST gate on this.
 */
export function isAdvertisable(capability: Capability): boolean {
  return capability.status === 'REAL';
}
