# PHASE 0 REPORT — Forensic Audit and Capability Ledger

**Date:** 2026-08-01
**Commit audited:** `351b08d`
**Status:** Complete. Acceptance criteria met.

---

## 1. What was built

| Artifact | Path | Purpose |
|---|---|---|
| Architecture audit | `docs/audit/ARCHITECTURE_ACTUAL.md` | What the repository actually is, not what it intends to be |
| Capability ledger | `capability-ledger.json` | 102 capabilities classified `REAL`/`PARTIAL`/`SHELL`/`ABSENT` with file and test evidence |
| Ledger loader | `src/lib/capabilities/ledger.ts` | Root resolution, parsing, summarisation, `isAdvertisable()` gate |
| Enforcement test | `tests/ledger.spec.ts` | 20 tests. Fails the build if the ledger overclaims |
| API integration test | `tests/capabilities-api.spec.ts` | 7 tests against the real route handler and real ledger file |
| Capabilities endpoint | `src/app/api/system/capabilities/route.ts` | `GET`, filterable by status and mechanism, fails closed |
| Admin surface | `src/app/(dashboard)/admin/capabilities/page.tsx` | Renders the ledger, gated on `audit:view` |
| Test infrastructure | `vitest.config.ts`, `package.json` | Vitest 3. The repository previously had none |
| Middleware hardening | `src/middleware.ts` | 22 unguarded dashboard prefixes added, including `/admin` |

---

## 2. What was verified, and by which test

| Claim | Verified by |
|---|---|
| The glob matcher the enforcement depends on matches and rejects correctly | `tests/ledger.spec.ts` — glob matcher (2 tests) |
| The ledger parses, has unique ids, and has a valid status on every entry | `tests/ledger.spec.ts` — structural integrity (4 tests) |
| A capability cannot be `REAL` without a test file that exists, is collected by the runner, and contains a real assertion | `tests/ledger.spec.ts` — REAL enforcement (5 tests) |
| Every file and test path cited anywhere in the ledger exists on disk | `tests/ledger.spec.ts` — evidence truthfulness (2 tests) |
| `SHELL` and `ABSENT` entries cannot cite tests | `tests/ledger.spec.ts` — evidence truthfulness (2 tests) |
| No mechanism M1–M9 is claimed `REAL` at Phase 0 | `tests/ledger.spec.ts` + `tests/capabilities-api.spec.ts` |
| The endpoint serves exactly what is on disk, with a summary that adds up | `tests/capabilities-api.spec.ts` (7 tests, real handler, no mocks) |
| The build compiles under `strict: true` with both new routes registered | `npm run build`, exit 0, 125 routes |

**Test count: 27. Pass rate: 100%. Build: green (exit 0). Suite duration: 2.2s.**

### Negative verification

Asserting that an enforcement mechanism works is not the same as demonstrating it. I tampered
with the ledger — flipping `m7.transfer-analysis` from `SHELL` to `REAL` — and confirmed the
suite failed with four distinct assertions:

```
x every REAL capability references at least one test file
  -> marked REAL with no test evidence: expected [ 'm7.transfer-analysis' ] to deeply equal []
x never reports a mechanism capability as REAL at Phase 0
  -> m7.transfer-analysis claims a differentiating mechanism is REAL: expected 'M7' to be null
x records the Phase 0 baseline of REAL capabilities
x no mechanism M1-M9 is claimed REAL at Phase 0
```

The ledger was then restored and the suite returned to 27/27. **The ledger cannot lie.**

---

## 3. Ledger summary

**102 capabilities. REAL 2 · PARTIAL 46 · SHELL 15 · ABSENT 39.**

Both `REAL` entries were created during this phase (the ledger and its endpoint). **Zero
pre-existing capabilities qualify as `REAL`**, because the repository had no tests of any kind.

| | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 |
|---|---|---|---|---|---|---|---|---|---|
| PARTIAL | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 |
| SHELL | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| ABSENT | 4 | 3 | 2 | 4 | 1 | 3 | 3 | 2 | 3 |

---

## 4. Build and test status

| Check | Before Phase 0 | After Phase 0 |
|---|---|---|
| `npm run build` | Green (exit 0) | Green (exit 0), 125 routes |
| `npx tsc --noEmit` | Clean | Clean |
| Test runner | **None installed** | Vitest 3 |
| Test files | **0** | 2 |
| Tests | **0** | 27 passing |
| `npm test` script | **Did not exist** | `vitest run` |

**No stop-the-line condition.** The production build was green on arrival and remains green.

One performance note: the first test configuration used `vite-tsconfig-paths`, which resolves
`tsconfig.json`'s `include` of every `.ts` and `.tsx` file by globbing the entire working tree,
and took **893 seconds** per run on Windows. It was replaced with a direct `@` to `src` alias in
`vitest.config.ts`, bringing the suite to **3.3 seconds**. A ledger check nobody runs is not a
ledger check.

---

## 5. What was NOT built

Phase 0 is an audit phase. No feature code was written. Specifically **not** done:

- **No remediation of any finding below.** The fabricated extractor, the forgeable session, the
  fail-open scorers, and the similarity floors are all documented and registered, not fixed.
  Fixing them is the pre-Phase-1 task list in §7.
- **No M1–M9 work.** Nothing in this phase moved a mechanism.
- **No corpus.** The database remains empty (one domain, two deployment records).
- **No CI wiring.** `npm test` exists but `.github/workflows/deploy.yml` was not modified to run
  it. This should be done before Phase 1 or the ledger enforcement is advisory only.
- **No integration test against a real database.** `test.infrastructure` is therefore `PARTIAL`,
  not `REAL`, per Rule 2.

---

## 6. What I now believe is fragile

1. **The ledger's `PARTIAL` tier is doing a lot of work and is the least trustworthy row.** 46
   capabilities sit there. I classified them by reading code and confirming they issue real
   Prisma queries; I could not execute them, because there is no database and no corpus. Some
   `PARTIAL` entries will turn out to be `SHELL` once exercised. Treat 46 as an upper bound on
   what works, not a measurement.

2. **The ledger is hand-maintained and will drift.** The test enforces that cited paths exist and
   that `REAL` is earned — it cannot detect a capability that was silently added, nor a `PARTIAL`
   that quietly rotted. Every phase must update it, and I would add a check that new
   `src/app/api/**/route.ts` files appear in the ledger.

3. **`getSession()` is called during static analysis and logs errors on every build.** Benign
   today, but it means real session failures are indistinguishable from build noise.

4. **The empty database is masking behaviour everywhere.** Fail-open defaults return perfect
   scores, retrieval returns nothing, and the graph is unpopulated. Almost nothing in this
   system has ever run against data. Expect Phase 1 to surface failures that look new but are
   simply first observations.

5. **My substring-retrieval finding has a compounding consequence I want flagged loudly.**
   Because retrieval matches the entire query string as a single substring, it matches almost
   nothing, so the assistant abstains on nearly all input. That will read as excellent M8
   behaviour on any bench run. **It is not.** It is broken retrieval wearing abstention's
   clothing. Phase 15 metrics taken before retrieval is fixed will be actively misleading, and
   abstention correctness is the number most likely to be quoted.

---

## 7. Pre-Phase-1 remediation (recommended, not yet done)

Ordered by severity. Items 1, 3, 4, and 5 are deletions and require no new architecture.

1. **Delete `src/lib/ingestion/extractor-engine.ts` and disable its call path.** It fabricates
   engineering data into the database. See §8.
2. **Sign the session token.** Currently the raw user ID. See §8.
3. **Remove fail-open perfect scores** in `observability-engine.ts:9-16` and
   `compliance-engine.ts:22-31`. Empty input must return `UNDETERMINED`, not 100.
4. **Remove the score floors in `similarity-engine.ts`.** A non-match must score 0, not 57.
5. **Remove hardcoded `88` (translation confidence), `94` (extraction confidence), `99.98`/`99.99`
   (uptime), and the `: 80` assistant fallback.**
6. **Wire `npm test` into `.github/workflows/deploy.yml`.**

---

## 8. The two findings that should not wait

### 8.1 The extractor fabricates engineering data (CRITICAL)

`src/lib/ingestion/extractor-engine.ts` — `extractEntitiesFromDocument(documentText)` never
reads its parameter. It returns six hardcoded engineering claims (Helmholtz resonator arrays,
Inconel 718, an 1,800 K wall temperature limit) with invented page numbers, invented section
names, and invented confidences of 89 to 96.

`src/app/api/ingestion/documents/route.ts:48` persists all six to `ExtractedEntity`. `rawText`
is optional and defaults to an empty string.

**Uploading any document — blank, unrelated, or an image — writes six plausible aerospace
engineering claims into the database, attributed to that document, with page-level citations
that do not exist.** For a system whose entire proposition is verified provenance, this is a
data-integrity emergency, not a backlog item. The same route also writes a checksum built from
`Math.random()` and labelled `sha256-`, which pre-poisons Phase 11 deduplication and Phase 3
independence grouping.

### 8.2 Session tokens are unsigned user IDs (CRITICAL)

`login/route.ts:53` sets the session cookie to `user.id`. `session.ts:33` reads it back as the
user id and looks the user up. No signature, no MAC, no JWT, no expiry claim, no server-side
session. `JWT_SECRET` is declared in `.env.example` and used nowhere.

User IDs are not secrets — they are returned in the login response body and exposed through
`contributorId`, `authorId`, and `reviewerId` across the API. **Anyone holding a user ID can
authenticate as that user by setting one cookie.** This also undermines M9: a receipt
attributing an answer to a user proves nothing if identity is forgeable.

I added 22 missing prefixes to `PROTECTED_ROUTES` (including `/admin`, which was unguarded),
but that is a presence check, not authentication. It reduces exposure; it does not fix the
defect.

---

## 9. Acceptance criteria

| Criterion | Status |
|---|---|
| `capability-ledger.json` exists | Yes — 102 capabilities |
| `npm test` passes including `ledger.spec.ts` | Yes — 27/27 |
| Build is green | Yes — exit 0, 125 routes |
| Audit doc committed | Yes — `docs/audit/ARCHITECTURE_ACTUAL.md` |
| `/api/system/capabilities` endpoint | Yes, with integration test |
| Admin page rendering the ledger | Yes — `/admin/capabilities` |
| Grep sweep documented | Yes — audit doc §8 |
| Test count, pass rate, build status reported | Yes — §4 |
