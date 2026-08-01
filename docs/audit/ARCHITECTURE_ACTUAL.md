# ARCHITECTURE_ACTUAL — KTN Platform

**Audit date:** 2026-08-01
**Commit audited:** `351b08d` (`v1.0.0-RC1 Knowledge Translation Network (KTN) Enterprise Release Candidate`)
**Auditor:** Phase 0 forensic audit, per KTN Master Enhancement Directive

This document describes **what exists**, not what was intended. Where the code and the
commit message disagree, the code wins.

---

## 1. Headline assessment

The repository is a **Next.js 15 CRUD application over a 74-model Prisma schema**, with a
Tailwind UI covering 92 pages and 62 API routes. It builds cleanly and the persistence layer
is real: 48 of 62 API routes issue genuine Prisma queries against genuine tables.

It is **not** a knowledge verification system. The nine differentiating mechanisms (M1–M9)
named in the directive are, without exception, either absent from the data model or
implemented as keyword-matching functions that return predetermined numbers.

The gap is not one of polish. It is that the layer that would make KTN structurally different
from a document search product has not been built, and the surfaces that would display that
layer are currently populated by hardcoded values.

**Three facts that characterise the repository:**

1. **There are zero tests and no test runner.** `package.json` had no `test` script and no
   test dependency of any kind before this audit. Nothing in the repository has ever been
   verified by execution.
2. **There is no knowledge corpus.** `prisma/seed.ts` is 53 lines and creates one engineering
   domain and two deployment records. Zero knowledge entries, zero evidence, zero standards,
   zero documents. Every engine described below operates on an empty database.
3. **The document extractor fabricates engineering data.** See §5.1. This is the most serious
   finding in the audit and is a data-integrity issue, not a quality issue.

---

## 2. Stack and topology

| Layer | Actual |
|---|---|
| Framework | Next.js 15.1.7, App Router, React 19 |
| Language | TypeScript 5.7, `strict: true`, no `ignoreBuildErrors` |
| ORM | Prisma 6.3 |
| Database | PostgreSQL (Supabase-targeted; `DATABASE_URL` + `DIRECT_URL` pooling split) |
| Auth | Hand-rolled cookie session (see §6) |
| Storage | `@supabase/supabase-js` client configured; see §5.4 for actual usage |
| Styling | Tailwind 3.4, `class-variance-authority`, local shadcn-style primitives |
| Validation | Zod, applied on ~some POST bodies, inconsistently |
| CI | `.github/workflows/deploy.yml` |
| LLM provider | **None.** No `@anthropic-ai/sdk`, no `openai`, no model client anywhere. |

The absence of any LLM dependency is worth stating plainly: the "AI assistant" is string
concatenation over Prisma results. This is not inherently bad — the directive prefers
determinism — but it means the answer-composition layer (M8) does not exist to be constrained.

### Directory map

```
src/
  app/
    (auth)/          3 pages   login, register, forgot-password
    (dashboard)/    ~76 pages  the entire product surface
    api/            62 routes
  components/
    ui/              9 primitives (button, card, badge, dialog, input, select, toast, avatar)
    layout/          4 (sidebar, top-nav, command-palette, global-search)
    graph/           1 (graph-network-visualizer)
    knowledge/       1 (threaded-comments)
    organization/    1 (org-switcher)
  lib/
    <20 "engines">   see §5
  middleware.ts      route protection + security headers
prisma/
  schema.prisma      1,552 lines, 74 models, 20 enums
  seed.ts            53 lines
```

---

## 3. Data model — what the schema does and does not contain

74 models exist. The CRUD backbone is genuinely modelled: `KnowledgeEntry`, `Evidence`,
`EvidenceRecord`, `FailureRecord`, `StandardRecord`, `StandardRevision`, `GraphNode`,
`GraphEdge`, `IngestedDocument`, `DocumentPage`, `ExtractedEntity`, `Organization`,
`OrganizationMember`, `KnowledgeVersion`, `SecurityAuditLog`, and so on.

**Models required by M1–M9 that do not exist:**

| Mechanism | Required model | Present? |
|---|---|---|
| M1 Typed quantities | `Quantity`, `Unit`, `Dimension` | **Absent** |
| M2 Problem signature | `ProblemSignature`, `FunctionVerb`, `Regime`, `DimensionlessGroup` | **Absent** |
| M3 Evidence calculus | `IndependenceGroup`, evidence directionality, sample size, replication | **Absent** |
| M4 Validity envelope | `ApplicabilityEnvelope`, `OperatingPoint` | **Absent** |
| M5 Negative knowledge | `FailedApproach` as peer object | Partial — `FailureRecord` exists but is not signature-linked |
| M6 Contradictions | `Conflict` | **Absent** |
| M7 Transfer | `TransferAnalysis` / Transfer Card | **Absent** — `KnowledgeTranslation` stores prose only |
| M8 Span binding | `Span` with document offsets | **Absent** — `DocumentPage` has no offsets |
| M9 Receipts | `AnswerReceipt` | **Absent** |

Grep confirmation: `model (Quantity|Dimension|ProblemSignature|ApplicabilityEnvelope|OperatingPoint|Conflict|Span|AnswerReceipt|TransferCard|FailedApproach|IndependenceGroup)` returns **no matches** in `prisma/schema.prisma`.

**Numeric representation.** Every physical quantity in the schema is a bare `Float`/`Int`/`String`
with no unit, no dimension, and no condition. `StructuredProblem` carries `operatingTempMax`
and `pressureMax` as bare numbers. There is no unit column anywhere in the schema. M1 has no
foundation to build on; it is a schema-first task.

---

## 4. Feature-by-feature classification

Full machine-readable detail is in [`capability-ledger.json`](../../capability-ledger.json).
Summary:

**102 capabilities classified.**

| Status | Count | Meaning |
|---|---|---|
| `REAL` | **2** | Both created during this audit: the ledger itself and its API endpoint |
| `PARTIAL` | 46 | Real persistence and reachable UI, but untested and/or missing a hard dependency |
| `SHELL` | 15 | Route/page/function exists, returns hardcoded, fabricated, or trivially-derived results |
| `ABSENT` | 39 | Not built |

**Zero pre-existing capabilities qualify as `REAL`.** The only two `REAL` entries are the
Capability Ledger and `GET /api/system/capabilities`, both written during Phase 0 and both
covered by tests that exercise the real path. This is a definitional consequence of the
directive rather than a claim that nothing works: several `PARTIAL` capabilities — knowledge
CRUD, standards CRUD, projects, tasks, audit logging — are functioning code that would likely
pass tests once tests exist. They are `PARTIAL` because Rule 2 says nothing is complete until
an integration test exercises the real path, and none does.

By mechanism, at Phase 0:

| | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 |
|---|---|---|---|---|---|---|---|---|---|
| REAL | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PARTIAL | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 |
| SHELL | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| ABSENT | 4 | 3 | 2 | 4 | 1 | 3 | 3 | 2 | 3 |

No differentiating mechanism is `REAL`. `tests/ledger.spec.ts` asserts this explicitly, so a
future change that marks one `REAL` without building it will fail the build.

---

## 5. The "engines" — where the differentiation was supposed to live

`src/lib` contains 20 modules named `*-engine.ts`. Their combined size is under 1,100 lines.
Individually:

| Module | Lines | Assessment |
|---|---|---|
| `translation/translation-engine.ts` | 76 | **SHELL** — the crown jewel (M7) |
| `matcher/similarity-engine.ts` | 119 | **SHELL** — substring matching with score floors |
| `evidence/strength-engine.ts` | 47 | **SHELL** — checkbox adder (M3) |
| `assistant/retrieval-pipeline.ts` | 146 | **PARTIAL** — real queries, no span binding (M8) |
| `ingestion/extractor-engine.ts` | 54 | **SHELL — fabricates data.** See §5.1 |
| `ingestion/pipeline-engine.ts` | 25 | **SHELL** — returns fake stage timings |
| `search/ranking-engine.ts` | 56 | **PARTIAL** — deterministic but relevance is substring-only |
| `governance/quality-engine.ts` | 31 | **SHELL** — length checks presented as quality |
| `standards/compliance-engine.ts` | 47 | **PARTIAL** — arithmetic is real; fails open on empty |
| `operations/observability-engine.ts` | 27 | **SHELL** — hardcoded uptime |
| `graph/traversal-engine.ts` | 67 | **PARTIAL** |
| `standards/impact-engine.ts` | 78 | **PARTIAL** |
| `versioning/diff-engine.ts` | 57 | **PARTIAL** |
| `devops/deployment-engine.ts` | 43 | **SHELL** |
| `developer/openapi-spec.ts` | 80 | **PARTIAL** — static spec, drifts from routes |

### 5.1 `extractor-engine.ts` — fabricated engineering data (CRITICAL)

```ts
export function extractEntitiesFromDocument(documentText: string): ExtractedEntityResult[] {
  const results: ExtractedEntityResult[] = [];
  results.push({
    entityType: 'PROBLEM',
    extractedText: 'High-frequency thermoacoustic oscillations during high-thrust ignition cycles',
    pageNumber: 2,
    sectionName: 'Section 1.2 - Problem Statement',
    confidence: 94,
  });
  // ... five more, all hardcoded
}
```

The parameter `documentText` is **never read**. The function returns six fabricated engineering
claims — Helmholtz resonator arrays, Inconel 718, an 1,800 K wall temperature limit — each with
an invented page number, an invented section name, and an invented confidence between 89 and 96.

`src/app/api/ingestion/documents/route.ts:48` calls it and **persists every result**:

```ts
const extracted = extractEntitiesFromDocument(rawText || '');
const entities = await Promise.all(
  extracted.map((e) => prisma.extractedEntity.create({ data: { documentId: doc.id, ... } }))
);
```

`rawText` is optional and defaults to `''`. The consequence: uploading **any** document — a
blank one, a purchase order, a photograph — writes six plausible-looking aerospace engineering
claims into the database, attributed to that document, with page-level citations that do not
exist.

This is precisely the failure mode the directive's Rule 1 exists to prevent, and it is worse
than a stub, because the output is indistinguishable from real extraction until someone opens
the source PDF. For a system whose entire value proposition is verified provenance, this is
the highest-severity item in the audit. **It should be deleted or hard-disabled before anything
else is built.**

The same route also writes `checksum: \`sha256-${Math.random().toString(36).substring(2, 10)}\``
— a random string labelled as a SHA-256 hash. Span-level deduplication (Phase 11) and evidence
independence grouping (Phase 3) both depend on content hashing, and both are pre-poisoned by this.

### 5.2 `translation-engine.ts` — M7, hardcoded confidence

Cross-domain transfer, the mechanism the product is named after, is:

```ts
if (source.technicalExplanation.toLowerCase().includes('heat') &&
    target.technicalExplanation.toLowerCase().includes('heat')) {
  sharedPrinciples.push('Heat Transfer & Thermal Dissipation');
}
// ...
const translationConfidence = 88;
```

Three `includes()` checks against the literals `'heat'`, `'fatigue'`, `'resonator'`/`'acoustic'`.
If none match, it asserts `'Structural Boundary Mechanics'` as a shared principle regardless of
content. `differingConstraints` and `riskFactors` are template strings interpolating the two
industry names; they are identical for every pair of records in the system.

`translationConfidence` is the literal `88` in all cases.

Against the Transfer Card specification: no invariant, no what-transfers with span support, no
what-does-not-transfer with reasons, no adaptation, no residual risk, no prior failures, no
computed confidence. Seven of eight required sections are absent and the eighth is a constant.

### 5.3 `similarity-engine.ts` — score floors manufacture confidence

Each of six sub-scores has a nonzero floor applied when nothing matches: functional 60,
failure 55, phenomenon 50, material 60, process 60, environmental 70. A candidate matching
**nothing at all** scores:

```
60(.25) + 55(.25) + 50(.20) + 60(.15) + 60(.08) + 70(.07) = 57.45 → 57 / 100
```

Every record in the database is therefore at least a 57% match to every query. Combined with
the fallback explanation `'Matched on cross-domain physical boundary parameters'`, the UI will
present unrelated records as moderately-confident matches with an authoritative-sounding
rationale. This is worse than returning nothing.

Note also `environmentalScore` fires on `candidate.knownConstraints?.includes('Kelvin')` — a
check for a unit *string*, which is the closest the repository comes to unit handling, and it
then emits the fixed explanation `'High thermal boundary conditions (>1200 K) aligned'`
irrespective of the actual value.

### 5.4 `strength-engine.ts` — M3, not an evidence calculus

Seven booleans, each adding a fixed point value to a base of 40. Missing, per the Phase 3
specification: evidence typing beyond booleans, directionality (nothing can *refute*),
independence grouping and correlated-source discounting, sample size, replication count,
age decay, method quality, versioned weight config (weights are inline literals, not a file),
and any notion of confidence as distinct from trust. `recomputeAllScores()` does not exist.

The `breakdown` array is real and is the one salvageable idea in the module.

### 5.5 Fail-open on empty input — systemic

Two modules return perfect scores for empty input:

- `observability-engine.ts:9-16` — zero services ⇒ `overallHealthScore: 100`, `status: 'HEALTHY'`, `uptimePercentage: 99.99`
- `compliance-engine.ts:22-31` — zero mappings ⇒ `readinessPercentage: 100`, `rating: 'EXCELLENT'`

`uptimePercentage` is additionally hardcoded to `99.98` on the non-empty path, and
`activeIncidents` is derived as `hasCritical ? 2 : hasDegraded ? 1 : 0` — a fabricated count,
not a query.

Because the database is empty (§1.3), **this is the current production behaviour**: the
governance and operations dashboards report a fully compliant, perfectly healthy system with
99.99% uptime on a system containing no data. This inverts Rule 5 (fail closed) at exactly the
surfaces a regulated buyer would inspect first.

### 5.6 `retrieval-pipeline.ts` — M8, closest thing to correct

The most defensible module in the repository. It genuinely queries `KnowledgeEntry`,
`FailureRecord`, and `StandardRecord`; it returns citations with real IDs and links; and it has
an explicit abstention path with a `missingInformation` field. The intent matches M8.

Two structural problems:

1. **Retrieval is `contains: query`** — the entire query string as a single substring. A real
   question ("what causes fatigue cracking in welded joints?") will never substring-match any
   stored field. In practice this pipeline returns zero citations for nearly all natural-language
   input, and therefore abstains. **The abstention rate will look excellent for the wrong reason:
   retrieval does not work, rather than the verifier working.** Any Phase 15 measurement taken
   before retrieval is fixed will be meaningless.
2. **No spans.** Citations point at whole records, not document offsets. There is no
   sentence-to-span binding, no post-generation verifier, no entailment check, no
   `groundednessRatio`. Answer text is built by string concatenation of whole summary fields,
   so it is trivially "grounded" in the sense that it is copied verbatim — but there is no
   mechanism that would *catch* an ungrounded sentence if composition ever became generative.

The fallback `: 80` on line 151 assigns a confidence of 80 when there is no primary knowledge
entry — an unearned number on a low-evidence path.

---

## 6. Auth, session, and tenancy

### 6.1 Session tokens are unsigned user IDs (CRITICAL)

`src/app/api/auth/login/route.ts:53`

```ts
response.cookies.set(AUTH_COOKIE_NAME, user.id, { httpOnly: true, ... });
```

`src/lib/auth/session.ts:33`

```ts
const userId = token;
const user = await prisma.user.findUnique({ where: { id: userId } });
```

The session cookie **is** the user's primary key, in plaintext. There is no signature, no MAC,
no JWT, no expiry claim, no server-side session record. `JWT_SECRET` is defined in
`.env.example` and is never used anywhere in the codebase.

Anyone who obtains or guesses a user ID can authenticate as that user by setting one cookie.
User IDs are not secrets — they are returned in the login response body, and any endpoint
exposing `contributorId`, `authorId`, or `reviewerId` leaks valid credentials.

This must be fixed before Phase 13 and arguably before any deployment. It also undermines M9:
a receipt attributing an answer to a user is not evidence of anything if identity is forgeable.

### 6.2 Multi-tenancy is not enforced

- **29 of 48** DB-querying API routes make no reference to `organizationId` at all.
- Of the 19 that do reference it, most use it to *write* the field on create, not to *filter*
  reads.
- There is **no row-level security** in `prisma/schema.prisma` and no RLS policy migration.
  Phase 13 requires enforcement at the database layer; the current enforcement is neither at
  the database layer nor reliably in application code.

Routes returning cross-tenant data include `activity`, `analytics/executive`,
`assistant/conversations`, `discovery/search`, `graph/nodes`, `problems`, `translation`,
`matcher/analyze`, `standards/*`, and `versions/*`. The full list is in §5 of the ledger notes.

### 6.3 Middleware coverage is partial

`PROTECTED_ROUTES` in `src/middleware.ts:5-18` lists 12 prefixes. The dashboard has ~40 route
prefixes. Unlisted and therefore **not gated by middleware**: `/knowledge`, `/evidence`,
`/failures`, `/standards`, `/analytics`, `/graph`, `/verification`, `/decisions`, `/discovery`,
`/matcher`, `/translation`, `/assistant`, `/versions`, `/tasks`, `/admin`, `/integrations`,
`/collaboration`, `/bookmarks`, `/saved-searches`, `/principles`, `/activity`.

`/admin` being absent from the protected list is notable. Server-side `getSession()` checks in
individual pages are the only remaining defence, and those are inconsistent.

Security headers set in middleware are real and correct as far as they go, though there is no
CSP.

---

## 7. Build, test, and CI status

| Check | Result |
|---|---|
| `npm ci` | Passes — 173 packages, no peer conflicts |
| `npm run build` | **Passes.** 92 routes compiled, no type errors |
| Type strictness | `strict: true`, `skipLibCheck: true`, no `ignoreBuildErrors` — the green build is genuine |
| `npm test` | **Did not exist.** No script, no runner, no test files |
| Test count (pre-audit) | **0** |
| Pass rate (pre-audit) | n/a — nothing to run |
| Lint | `next lint` configured; ESLint config file absent from repo root |

**No stop-the-line condition on the build.** The production build is green and was green before
this audit. Phase 1 is unblocked on that count.

Test infrastructure was added as part of Phase 0 in order to satisfy directive task 4 (the
ledger must not be able to lie): Vitest 3 + `vite-tsconfig-paths`, with `npm test` wired up.

---

## 8. Grep sweep (directive task 7)

| Pattern | Hits | Assessment |
|---|---|---|
| `TODO` / `FIXME` / `XXX` / `HACK` | **0** genuine | Two hits in `tasks/page.tsx` are a `'TODO'` task-status enum value, not markers |
| `catch {}` / `catch (e) {}` swallowing errors | **0** | Error handling is consistently `console.error` + typed response |
| `placeholder` | 64 across 22 files | All are JSX `placeholder=` form attributes. Benign |
| `lorem` | 0 | — |
| `dummy` | 0 | — |
| `mock` | 0 | — |
| `sample` | 3 | `hasSampleCalibrationData` (field name), `sample.pdf` (hardcoded fallback storage URL), `aero-09.pdf` |
| Hardcoded arrays returned from service functions | **6 modules** | `extractor-engine`, `pipeline-engine`, `translation-engine`, `observability-engine`, `deployment-engine`, `openapi-spec` |
| Magic-number returns presented as computed | **5** | `88` (translation confidence), `94` (extraction confidence), `99.98`/`99.99` (uptime), `80` (assistant fallback), score floors in `similarity-engine` |

**The absence of TODO markers is itself a finding.** None of the shells are labelled as
incomplete. `extractEntitiesFromDocument` carries the comment `// Parse structured sections`
above hardcoded literals, and `route.ts:47` carries `// Run entity extraction engine`. A reader
skimming the code would reasonably conclude extraction is implemented. This is why the
Capability Ledger is a necessary artifact rather than a bureaucratic one.

---

## 9. Data flow, as actually implemented

```
Browser
  → middleware.ts          (12 of ~40 dashboard prefixes gated; unsigned cookie presence check only)
  → Server Component page  (direct prisma import, mostly unscoped by tenant)
  → or /api/* route        (getSession() → prisma → engine fn → NextResponse.json)
       ↓
     lib/*-engine.ts       (pure functions; 6 of 20 ignore their inputs)
       ↓
     Prisma → PostgreSQL   (74 tables, no RLS, effectively empty)
```

There is no job queue, no scheduler, no background worker, no vector store, no embedding model,
no OCR, no PDF parser, and no external content fetcher. Phases 9 (standards watcher) and 11
(ingestion pipeline) have no runtime substrate to attach to; both will need one built.

`IngestionJob` and `SyncJob` models exist and are written to synchronously inside request
handlers — they record that work happened, but no worker executes them.

---

## 10. What is genuinely good

Stating this plainly, because the rest of the document is adversarial by design and the
directive's Rule 7 says not to rebuild what works:

- **The Prisma schema is a real asset.** 1,552 lines, 74 models, sensible relations, soft
  deletes, audit-log tables, version tables, org membership. Much of M5, M9, and Phase 12
  can extend it rather than replace it. It is over-broad relative to what is implemented, but
  it is not wrong.
- **The build is green under `strict: true`.** Rare, and it means Phase 1's type-level work
  (`Quantity`, `Dimension`) will be enforced by the compiler from day one.
- **Determinism is already the house style.** No LLM has been wired in, so there is nothing to
  rip out. Every engine is a pure function that takes data and returns a score with a
  `breakdown`. The *shape* the directive asks for in M3 is already present — the contents are
  wrong, but `{ score, rating, breakdown }` is exactly right and should be kept.
- **`retrieval-pipeline.ts` already abstains,** with a `missingInformation` field and
  non-apologetic copy. M8's hardest cultural battle — treating abstention as a good outcome —
  has already been won in this code.
- **The UI surface is broad and coherent.** 92 pages with consistent primitives. Phases 4, 6,
  and 12 need places to *display* envelope status, conflicts, and evidence chips; those pages
  exist and need enrichment, not creation.

---

## 11. Recommended remediation order (pre-Phase-1)

1. **Delete `extractor-engine.ts` and disable the extraction call path.** Fabricated data in a
   provenance system is not a bug to be scheduled; it is a correctness emergency. (§5.1)
2. **Fix session signing.** Replace the raw-ID cookie with a signed, expiring token. (§6.1)
3. **Remove empty-input perfect scores.** Both should return `UNDETERMINED`, not 100. (§5.5)
4. **Remove score floors from `similarity-engine`.** A non-match must score 0. (§5.3)
5. **Remove the hardcoded `88` and `94`.** Any number a user might act on must be computed or absent.

Items 1, 3, 4, and 5 are deletions. None of them requires new architecture, and all four
directly serve the directive's core principle that the system must never manufacture
confidence it has not earned.

---

## 12. Ledger

Machine-readable classification: [`capability-ledger.json`](../../capability-ledger.json)
Enforcement test: [`tests/ledger.spec.ts`](../../tests/ledger.spec.ts)
Runtime endpoint: `GET /api/system/capabilities`
Admin surface: `/admin/capabilities`
