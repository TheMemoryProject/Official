import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * The `include` glob is load-bearing: tests/ledger.spec.ts asserts that every test file
 * referenced as evidence for a REAL capability is matched by it. If you narrow this glob,
 * the ledger test will fail rather than silently allowing a capability to cite a test
 * that never runs.
 */
export const TEST_INCLUDE_GLOBS = ['tests/**/*.spec.ts'];

/**
 * The `@/*` alias is declared here directly rather than via vite-tsconfig-paths.
 * That plugin resolves tsconfig's `include: ["**\/*.ts", "**\/*.tsx"]` by globbing the
 * entire working tree, which on Windows took ~15 minutes per run. The alias below is the
 * only path mapping tsconfig.json defines, so restating it costs nothing and keeps the
 * suite fast enough to actually be run on every commit.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: TEST_INCLUDE_GLOBS,
    environment: 'node',
    globals: false,
    reporters: ['default'],
  },
});
