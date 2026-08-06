# KTN Engineering Reasoning Platform — Differentiable Evidence-Bound Knowledge Graph (DEBKG)

A self-contained demo of a knowledge graph whose arithmetic is **differentiable** and whose every
derived value is **bound to evidence**. The graph holds engineering knowledge as nodes and edges;
a small automatic-differentiation engine (pure TypeScript dual numbers) lets the platform *reason*
with the graph — running constrained gradient descent over design variables, tracing every
optimisation step as a **content-addressed SHA-256 chain** back to the evidence hashes that
produced it, and responding to **evidence retraction** by re-running the whole pipeline.

## Architecture

```
┌─────────────┐   HTTP :3001 (REST / OpenAPI 3.0)   ┌──────────────┐
│  Fastify    │◄────────────────────────────────────│  Next.js 14  │
│  API (3001) │                                     │  Frontend    │
└──────┬──────┘                                     │  (:3000)     │
       │ PostgreSQL 16 (RLS + immutable/append-only triggers)
┌──────▼──────┐
│  PostgreSQL │   tables, RLS, triggers, seed + SQL gradient check
│  (db:5432)  │
└─────────────┘
```

- **Domain core** (`backend/src/domain-core`) is zero-dependency TypeScript: dual-number
  automatic differentiation, SHA-256 content addressing (Node `crypto`), projected gradient
  descent with golden-section line search, and a finite-difference gradient check.
- **Backend** exposes a REST/OpenAPI 3.0 interface at `http://localhost:3001/openapi.json`.
- **Frontend** is a single Optimisation Studio page with inline SVG/CSS animation — no third-party
  libraries, no external CDNs, no calls to external AI models.

## Quick start

Requires Docker with Compose (Docker Desktop).

```bash
docker compose up --build
```

- Frontend:  http://localhost:3000/studio/optimize
- OpenAPI:   http://localhost:3001/openapi.json
- Health:    http://localhost:3001/health

On first start the database initializes with schema + seed (PostgreSQL RLS, immutable triggers,
17 knowledge-graph nodes, 19 edges, 8 evidence spans, and a **finite-difference gradient check
executed inside the seed script** — the container fails to start if it does not pass).

## The demo story

Pre-seeded engineering graph:

| Quantity  | Value | Evidence |
|-----------|-------|----------|
| `thickness` (design variable) | 4.0 mm initial guess | design variable |
| `force` (load)                | 1000 N              | evidence span |
| `width`                       | 10 mm              | evidence span |
| `length`                      | 1                  | evidence span |
| `density`                     | 1                  | evidence span |
| `yield_strength`              | 250 MPa            | evidence span (VERIFIED) |
| `safety_factor`               | 10                 | evidence span (VERIFIED) |
| `stress` equation             | σ = F / (w·t)      | evidence span (VERIFIED) |
| `mass` equation               | m = ρ·w·t·L         | evidence span |
| failure constraint            | σ·SF ≤ yield       | bound to yield + SF evidence |

Design objective: **minimise mass** subject to the yield constraint.
The optimum sits at the constraint boundary: `t* = F / (w · (yield / SF))`.

### Step 1 — Open the Studio and run an optimisation

1. Open http://localhost:3000/studio/optimize — the studio shows the live model parameters,
   the latest AD gradient check, and the SVG trace panel.
2. Click **Run optimisation** (optionally set `start` / `lr` / `maxIter`). The backend runs
   dual-number gradient descent; the studio animates the marker flowing along the loss curve.
3. Thickness converges to **4.0 mm**:
   `stress = 1000 / (10 · 4) = 25 MPa ≤ 250 MPa`, `mass = 1 · 10 · 4 · 1 = 40`.
4. Every step is stored as a content-addressed SHA-256 chain; the step table shows each hash and
   its predecessor, and the header shows **chain verified**.

### Step 2 — Retract evidence and watch re-optimisation

1. In the *Evidence-bound spans* panel click **Retract** on the `yield_strength = 250 MPa` span.
2. Enter the revised value (**230 MPa**) and a reason. The backend appends an immutable
   retraction record, mints a **new** content-addressed span for `yield_strength = 230 MPa`,
   rebinds the `yield_strength` model parameter, and opens a **proposal** in the review queue.
3. In the *Review queue* panel click **Decide → Accept**. Acceptance triggers automatic
   re-optimisation: the new optimum is `t* = 1000 / (10 · 23) ≈ 4.35 mm`
   (`stress = 23 MPa ≤ 230 MPa`), and the trace/step-chain panels refresh with the new run.
4. The audit log records the retraction, the proposal, and the decision (append-only).

### Step 3 — Inspect the gradient check

The backend verifies its dual-number engine against central finite differences at boot and on
`POST /api/gradient-checks/run`. The seed script performs the same verification **in SQL** during
initialisation. All results are stored in `gradient_checks` (append-only) and shown in the studio.

## Repository layout

```
db/init/01-schema.sql        tables, RLS, immutable/append-only triggers, runtime role
db/init/02-seed.sql          graph, evidence spans, design variables, SQL gradient check
backend/src/domain-core/     zero-dependency engine (dual numbers, hashing, optimisation)
backend/src/services/        graph / optimisation / evidence services
backend/src/routes/          Fastify route modules
frontend/src/                Next.js 14 app (Optimisation Studio, inline SVG/CSS)
```

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/health` | liveness + DB ping |
| GET  | `/openapi.json` | OpenAPI 3.0 document |
| GET  | `/api/graph` | knowledge graph nodes + edges |
| GET  | `/api/evidence/spans` | evidence spans with retraction status |
| GET  | `/api/parameters` | design variables, model parameters, equations |
| GET  | `/api/gradient-checks` | recent AD gradient checks |
| POST | `/api/gradient-checks/run` | run + store a gradient check |
| GET  | `/api/runs` | list optimisation runs |
| POST | `/api/runs` | start an optimisation run |
| GET  | `/api/runs/:id/steps` | content-addressed step chain |
| GET  | `/api/runs/:id/verify` | verify the hash chain integrity |
| POST | `/api/retractions` | retract evidence + rebind parameters + open proposal |
| GET  | `/api/proposals` | review queue |
| POST | `/api/proposals/:id/decide` | accept/reject (accept auto re-optimises) |
| GET  | `/api/audit` | append-only audit log |

Tenant is hardcoded for the demo: `00000000-0000-0000-0000-000000000001`, enforced by PostgreSQL
Row-Level Security on every table. The backend connects as a **non-superuser** runtime role
(`ktn_app_runtime`) so RLS is actually enforced (superusers bypass it).

## Local development (without Docker)

You need PostgreSQL 16 with `db/init/*.sql` loaded, plus the `ktn_app_runtime` role
(`ktn_app_runtime_password`) created by `01-schema.sql`.

Backend:
```bash
cd backend
npm ci
DATABASE_URL="postgresql://ktn_app_runtime:ktn_app_runtime_password@localhost:5432/ktn_debkg" npm run dev
```

Frontend:
```bash
cd frontend
npm ci
NEXT_PUBLIC_API_URL="http://localhost:3001" npm run dev
```

Domain-core self-check (no database needed):
```bash
cd backend
npm run test:core
```

## Verified behaviours

- AD vs finite-difference gradient check: relative error < 1e-5 (typically ~1e-9).
- Gradient descent converges to the analytic optimum `t* = 4.0 mm` at `yield = 250 MPa`.
- Retraction to `yield = 230 MPa` re-optimises to `t* ≈ 4.3478 mm`.
- Step chains verify (hash recomputation + `prev_hash` linkage) end-to-end.
