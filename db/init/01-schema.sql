-- ============================================================================
-- KTN DEBKG — 01-schema.sql
-- Tables are tenant-scoped (Row-Level Security) and follow immutable /
-- append-only patterns where noted. Triggers prevent UPDATE/DELETE on
-- critical, content-addressed tables.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- Runtime role: non-superuser so Row-Level Security is actually enforced.
-- The container superuser (ktn_app) seeds; the backend connects as
-- ktn_app_runtime which is subject to RLS (superusers bypass it).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ktn_app_runtime') THEN
    CREATE ROLE ktn_app_runtime LOGIN PASSWORD 'ktn_app_runtime_password'
      NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Tenant bootstrap
-- ----------------------------------------------------------------------------
CREATE FUNCTION ktn_current_tenant() RETURNS uuid
LANGUAGE sql IMMUTABLE AS
$$ SELECT '00000000-0000-0000-0000-000000000001'::uuid $$;

-- ----------------------------------------------------------------------------
-- Knowledge graph (immutable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kv_nodes (
  id             text PRIMARY KEY,                 -- stable key, e.g. 'thickness'
  tenant_id      uuid NOT NULL DEFAULT ktn_current_tenant(),
  name           text NOT NULL,
  node_type      text NOT NULL,                    -- DESIGN_VARIABLE, PARAMETER, MATERIAL, COMPONENT, FORMULA, CONSTRAINT, EQUATION, ...
  value_json     jsonb,                            -- numeric value when the node is a quantity
  unit           text,
  description    text,
  evidence_hashes jsonb NOT NULL DEFAULT '[]',     -- content-addressed evidence spans
  content_hash   text NOT NULL,                    -- sha256 of the row payload
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kv_nodes_tenant CHECK (tenant_id = ktn_current_tenant())
);

CREATE TABLE IF NOT EXISTS kv_edges (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL DEFAULT ktn_current_tenant(),
  source_key     text NOT NULL REFERENCES kv_nodes(id),
  target_key     text NOT NULL REFERENCES kv_nodes(id),
  relation       text NOT NULL,                    -- DEFINES, INPUT_TO, GOVERNED_BY, CONSTRAINS, BOUND_BY, ...
  weight         double precision NOT NULL DEFAULT 1.0,
  evidence_hashes jsonb NOT NULL DEFAULT '[]',
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kv_edges_tenant CHECK (tenant_id = ktn_current_tenant()),
  CONSTRAINT kv_edges_no_self CHECK (source_key <> target_key),
  CONSTRAINT kv_edges_unique UNIQUE (source_key, target_key)
);
CREATE INDEX IF NOT EXISTS kv_edges_source_idx ON kv_edges (source_key);
CREATE INDEX IF NOT EXISTS kv_edges_target_idx ON kv_edges (target_key);

-- ----------------------------------------------------------------------------
-- Evidence spans (immutable, append-only via retraction table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_spans (
  id             text PRIMARY KEY,                 -- content hash itself
  tenant_id      uuid NOT NULL DEFAULT ktn_current_tenant(),
  document_ref   text NOT NULL,                    -- simulated literature/standard reference
  quote          text NOT NULL,                    -- the extracted text
  claim          text NOT NULL,                    -- the formal claim
  value_json     jsonb,
  unit           text,
  verified       boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_spans_tenant CHECK (tenant_id = ktn_current_tenant())
);

CREATE TABLE IF NOT EXISTS evidence_retractions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL DEFAULT ktn_current_tenant(),
  retracted_span_id text NOT NULL REFERENCES evidence_spans(id),
  revised_span_id   text REFERENCES evidence_spans(id),
  reason          text NOT NULL,
  actor           text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_retractions_tenant CHECK (tenant_id = ktn_current_tenant())
);
CREATE INDEX IF NOT EXISTS evidence_retractions_span_idx
  ON evidence_retractions (retracted_span_id);

-- ----------------------------------------------------------------------------
-- Design variables & model parameters (mutable definitions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS design_variables (
  id             text PRIMARY KEY,
  tenant_id      uuid NOT NULL DEFAULT ktn_current_tenant(),
  name           text NOT NULL,
  symbol         text,
  value_json     jsonb NOT NULL,                   -- current/initial value
  unit           text,
  lower_bound    double precision NOT NULL,
  upper_bound    double precision NOT NULL,
  active         boolean NOT NULL DEFAULT true,
  evidence_hashes jsonb NOT NULL DEFAULT '[]',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT design_variables_tenant CHECK (tenant_id = ktn_current_tenant())
);

CREATE TABLE IF NOT EXISTS model_parameters (
  id             text PRIMARY KEY,
  tenant_id      uuid NOT NULL DEFAULT ktn_current_tenant(),
  name           text NOT NULL,
  value_json     jsonb NOT NULL,
  unit           text,
  bound_span_id  text NOT NULL REFERENCES evidence_spans(id),
  status         text NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE, RETRACTED
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT model_parameters_tenant CHECK (tenant_id = ktn_current_tenant())
);

CREATE TABLE IF NOT EXISTS model_equations (
  id             text PRIMARY KEY,                 -- e.g. 'stress_eq', 'mass_eq'
  tenant_id      uuid NOT NULL DEFAULT ktn_current_tenant(),
  name           text NOT NULL,
  expression     text NOT NULL,                    -- human-readable equation
  source_node    text NOT NULL REFERENCES kv_nodes(id),
  target_node    text NOT NULL REFERENCES kv_nodes(id),
  bound_span_id  text NOT NULL REFERENCES evidence_spans(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT model_equations_tenant CHECK (tenant_id = ktn_current_tenant())
);

-- ----------------------------------------------------------------------------
-- Optimisation runs & steps (steps are immutable, content-addressed chain)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS optimisation_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL DEFAULT ktn_current_tenant(),
  run_type        text NOT NULL DEFAULT 'GRADIENT_DESCENT',
  model_fingerprint text NOT NULL,
  input_json      jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED
  progress        integer NOT NULL DEFAULT 0,
  current_x       jsonb,
  current_loss    double precision,
  step_count      integer NOT NULL DEFAULT 0,
  evidence_hashes jsonb NOT NULL DEFAULT '[]',
  iterations      integer,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  CONSTRAINT optimisation_runs_tenant CHECK (tenant_id = ktn_current_tenant())
);
CREATE INDEX IF NOT EXISTS optimisation_runs_status_idx
  ON optimisation_runs (status);

CREATE TABLE IF NOT EXISTS optimisation_steps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL DEFAULT ktn_current_tenant(),
  run_id          uuid NOT NULL REFERENCES optimisation_runs(id),
  step_no         integer NOT NULL,
  x               jsonb NOT NULL,
  gradient        jsonb NOT NULL,
  loss            double precision NOT NULL,
  step_hash       text NOT NULL UNIQUE,
  prev_hash       text,
  model_fingerprint text NOT NULL,
  evidence_hashes jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT optimisation_steps_tenant CHECK (tenant_id = ktn_current_tenant())
);
CREATE INDEX IF NOT EXISTS optimisation_steps_run_idx
  ON optimisation_steps (run_id, step_no);

-- ----------------------------------------------------------------------------
-- Review queue (proposals) + append-only decisions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL DEFAULT ktn_current_tenant(),
  kind            text NOT NULL DEFAULT 'RETRACTION_RE_OPTIMISATION',
  summary         text NOT NULL,
  old_values      jsonb NOT NULL DEFAULT '{}',
  new_values      jsonb NOT NULL DEFAULT '{}',
  diff            text NOT NULL,
  evidence_hashes jsonb NOT NULL DEFAULT '[]',
  audit_refs      jsonb NOT NULL DEFAULT '[]',
  status          text NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
  run_id          uuid REFERENCES optimisation_runs(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposals_tenant CHECK (tenant_id = ktn_current_tenant())
);

CREATE TABLE IF NOT EXISTS proposal_decisions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL DEFAULT ktn_current_tenant(),
  proposal_id   uuid NOT NULL REFERENCES proposals(id),
  decision      text NOT NULL,                     -- ACCEPTED, REJECTED
  rationale     text,
  actor         text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_decisions_tenant CHECK (tenant_id = ktn_current_tenant())
);

-- ----------------------------------------------------------------------------
-- Audit log (append-only) & gradient checks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  tenant_id   uuid NOT NULL DEFAULT ktn_current_tenant(),
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text NOT NULL,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_tenant CHECK (tenant_id = ktn_current_tenant())
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at);

CREATE TABLE IF NOT EXISTS gradient_checks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL DEFAULT ktn_current_tenant(),
  model        text NOT NULL,
  x            jsonb NOT NULL,
  analytic     jsonb NOT NULL,
  finite_diff  jsonb NOT NULL,
  max_error    double precision NOT NULL,
  tolerance    double precision NOT NULL DEFAULT 1e-5,
  passed       boolean NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gradient_checks_tenant CHECK (tenant_id = ktn_current_tenant())
);

-- ============================================================================
-- Row-Level Security — enforce tenant isolation on every table
-- ============================================================================
ALTER TABLE kv_nodes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_edges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_spans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_retractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_variables     ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_parameters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_equations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimisation_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimisation_steps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_decisions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradient_checks      ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('kv_nodes','kv_edges','evidence_spans','evidence_retractions',
                        'design_variables','model_parameters','model_equations',
                        'optimisation_runs','optimisation_steps','proposals',
                        'proposal_decisions','audit_log','gradient_checks')
  LOOP
    EXECUTE format('CREATE POLICY %I_policy ON %I USING (tenant_id = ktn_current_tenant()) WITH CHECK (tenant_id = ktn_current_tenant())', t, t);
  END LOOP;
END $$;

-- Force RLS even for the table owner.
ALTER TABLE kv_nodes             FORCE ROW LEVEL SECURITY;
ALTER TABLE kv_edges             FORCE ROW LEVEL SECURITY;
ALTER TABLE evidence_spans       FORCE ROW LEVEL SECURITY;
ALTER TABLE evidence_retractions FORCE ROW LEVEL SECURITY;
ALTER TABLE design_variables     FORCE ROW LEVEL SECURITY;
ALTER TABLE model_parameters     FORCE ROW LEVEL SECURITY;
ALTER TABLE model_equations      FORCE ROW LEVEL SECURITY;
ALTER TABLE optimisation_runs    FORCE ROW LEVEL SECURITY;
ALTER TABLE optimisation_steps   FORCE ROW LEVEL SECURITY;
ALTER TABLE proposals            FORCE ROW LEVEL SECURITY;
ALTER TABLE proposal_decisions   FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log            FORCE ROW LEVEL SECURITY;
ALTER TABLE gradient_checks      FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Immutable / append-only triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION deny_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Mutation forbidden on immutable table %. Table is append-only/content-addressed.',
    TG_TABLE_NAME;
END $$;

CREATE OR REPLACE FUNCTION prevent_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'DELETE forbidden on append-only table %.',
    TG_TABLE_NAME;
END $$;

-- Immutable (no UPDATE, no DELETE):
CREATE TRIGGER kv_nodes_immutable
  BEFORE UPDATE OR DELETE ON kv_nodes FOR EACH ROW EXECUTE FUNCTION deny_mutation();
CREATE TRIGGER kv_edges_immutable
  BEFORE UPDATE OR DELETE ON kv_edges FOR EACH ROW EXECUTE FUNCTION deny_mutation();
CREATE TRIGGER evidence_spans_immutable
  BEFORE UPDATE OR DELETE ON evidence_spans FOR EACH ROW EXECUTE FUNCTION deny_mutation();
CREATE TRIGGER evidence_retractions_append_only
  BEFORE UPDATE OR DELETE ON evidence_retractions FOR EACH ROW EXECUTE FUNCTION deny_mutation();
CREATE TRIGGER optimisation_steps_immutable
  BEFORE UPDATE OR DELETE ON optimisation_steps FOR EACH ROW EXECUTE FUNCTION deny_mutation();
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION deny_mutation();
CREATE TRIGGER proposal_decisions_append_only
  BEFORE UPDATE OR DELETE ON proposal_decisions FOR EACH ROW EXECUTE FUNCTION deny_mutation();
CREATE TRIGGER gradient_checks_append_only
  BEFORE UPDATE OR DELETE ON gradient_checks FOR EACH ROW EXECUTE FUNCTION deny_mutation();

-- Append-only audit log also blocks DELETE only (UPDATE already blocked above).

-- ----------------------------------------------------------------------------
-- Grants for the runtime role (RLS now applies: non-superuser)
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO ktn_app_runtime;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ktn_app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ktn_app_runtime;
