-- ============================================================================
-- KTN DEBKG — 02-seed.sql
-- Seeds the demo knowledge graph, evidence spans, design variables, model
-- parameters/equations, and performs a finite-difference gradient check IN
-- SQL (the container fails to start if the check does not pass).
-- ============================================================================

-- Content-addressed helper: sha256 of a canonical string (pgcrypto).
CREATE OR REPLACE FUNCTION ktn_sha256(input text) RETURNS text
LANGUAGE sql IMMUTABLE AS
$$ SELECT encode(digest(input::bytea, 'sha256'), 'hex') $$;

-- ----------------------------------------------------------------------------
-- 1. EVIDENCE SPANS (content-addressed; id == sha256(content))
-- ----------------------------------------------------------------------------
INSERT INTO evidence_spans (id, document_ref, quote, claim, value_json, unit, verified) VALUES
  (
    ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)'),
    'Simulated TR-2026-011: Mechanics of Tension Members',
    'The nominal axial stress is σ = F / (w · t) for a rectangular section of width w and thickness t under axial load F.',
    'stress = force / (width * thickness)',
    '{"formula":"force/(width*thickness)"}'::jsonb,
    'MPa',
    true
  ),
  (
    ktn_sha256('MAT-CS-2024|The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.|yield_strength = 250 MPa'),
    'Simulated MAT-CS-2024: Carbon Steel Properties',
    'The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.',
    'yield_strength = 250 MPa',
    '{"value":250}'::jsonb,
    'MPa',
    true
  ),
  (
    ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10'),
    'Simulated POL-DES-07: Design Safety Factor',
    'All static-load design checks shall apply a safety factor of 10 against the yield strength.',
    'safety_factor = 10',
    '{"value":10}'::jsonb,
    NULL,
    true
  ),
  (
    ktn_sha256('LR-2026-004|The governing axial load case applies a force of 1000 N.|force = 1000 N'),
    'Simulated LR-2026-004: Load Case Definition',
    'The governing axial load case applies a force of 1000 N.',
    'force = 1000 N',
    '{"value":1000}'::jsonb,
    'N',
    true
  ),
  (
    ktn_sha256('DWG-1002|The tension member cross-section has a width of 10 mm.|width = 10 mm'),
    'Simulated DWG-1002: Cross-Section Geometry',
    'The tension member cross-section has a width of 10 mm.',
    'width = 10 mm',
    '{"value":10}'::jsonb,
    'mm',
    true
  ),
  (
    ktn_sha256('DWG-1002|The reference member length used for the mass model is 1 mm.|length = 1 mm'),
    'Simulated DWG-1002: Cross-Section Geometry',
    'The reference member length used for the mass model is 1 mm.',
    'length = 1 mm',
    '{"value":1}'::jsonb,
    'mm',
    true
  ),
  (
    ktn_sha256('MAT-CS-2024|The carbon steel density is 1 g/mm3 for the simplified mass model.|density = 1 g/mm3'),
    'Simulated MAT-CS-2024: Carbon Steel Properties',
    'The carbon steel density is 1 g/mm³ for the simplified mass model.',
    'density = 1 g/mm3',
    '{"value":1}'::jsonb,
    'g/mm3',
    true
  ),
  (
    ktn_sha256('TR-2026-011|The mass of a prismatic tension member is rho * w * t * L.|mass = density * width * thickness * length'),
    'Simulated TR-2026-011: Mechanics of Tension Members',
    'The mass of a prismatic tension member is ρ · w · t · L.',
    'mass = density * width * thickness * length',
    '{"formula":"density*width*thickness*length"}'::jsonb,
    'g',
    true
  );

-- ----------------------------------------------------------------------------
-- 2. KNOWLEDGE GRAPH NODES (immutable, content-addressed)
-- ----------------------------------------------------------------------------
INSERT INTO kv_nodes (id, name, node_type, value_json, unit, description, evidence_hashes, content_hash) VALUES
  ('thickness',            'thickness',            'DESIGN_VARIABLE', '{"value":4.0}'::jsonb, 'mm', 'Design variable: member thickness.',
    jsonb_build_array(),
    ktn_sha256('thickness|DESIGN_VARIABLE|{"value":4.0}|')),
  ('force',                'force',                'PARAMETER', '{"value":1000}'::jsonb, 'N', 'Applied axial load.',
    jsonb_build_array(ktn_sha256('LR-2026-004|The governing axial load case applies a force of 1000 N.|force = 1000 N')),
    ktn_sha256('force|PARAMETER|{"value":1000}|' || ktn_sha256('LR-2026-004|The governing axial load case applies a force of 1000 N.|force = 1000 N'))),
  ('width',                'width',                'PARAMETER', '{"value":10}'::jsonb, 'mm', 'Cross-section width.',
    jsonb_build_array(ktn_sha256('DWG-1002|The tension member cross-section has a width of 10 mm.|width = 10 mm')),
    ktn_sha256('width|PARAMETER|{"value":10}|' || ktn_sha256('DWG-1002|The tension member cross-section has a width of 10 mm.|width = 10 mm'))),
  ('length',               'length',               'PARAMETER', '{"value":1}'::jsonb, 'mm', 'Reference member length.',
    jsonb_build_array(ktn_sha256('DWG-1002|The reference member length used for the mass model is 1 mm.|length = 1 mm')),
    ktn_sha256('length|PARAMETER|{"value":1}|' || ktn_sha256('DWG-1002|The reference member length used for the mass model is 1 mm.|length = 1 mm'))),
  ('density',              'density',              'PARAMETER', '{"value":1}'::jsonb, 'g/mm3', 'Material density.',
    jsonb_build_array(ktn_sha256('MAT-CS-2024|The carbon steel density is 1 g/mm3 for the simplified mass model.|density = 1 g/mm3')),
    ktn_sha256('density|PARAMETER|{"value":1}|' || ktn_sha256('MAT-CS-2024|The carbon steel density is 1 g/mm3 for the simplified mass model.|density = 1 g/mm3'))),
  ('yield_strength',       'yield_strength',       'PARAMETER', '{"value":250}'::jsonb, 'MPa', 'Material yield strength.',
    jsonb_build_array(ktn_sha256('MAT-CS-2024|The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.|yield_strength = 250 MPa')),
    ktn_sha256('yield_strength|PARAMETER|{"value":250}|' || ktn_sha256('MAT-CS-2024|The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.|yield_strength = 250 MPa'))),
  ('safety_factor',        'safety_factor',        'PARAMETER', '{"value":10}'::jsonb, NULL, 'Design safety factor.',
    jsonb_build_array(ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10')),
    ktn_sha256('safety_factor|PARAMETER|{"value":10}|' || ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10'))),
  ('stress',               'stress',               'FORMULA', NULL, 'MPa', 'Derived nominal stress σ = F/(w·t).',
    jsonb_build_array(ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)')),
    ktn_sha256('stress|FORMULA|' || ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)'))),
  ('mass',                 'mass',                 'FORMULA', NULL, 'g', 'Derived mass m = ρ·w·t·L.',
    jsonb_build_array(ktn_sha256('TR-2026-011|The mass of a prismatic tension member is rho * w * t * L.|mass = density * width * thickness * length')),
    ktn_sha256('mass|FORMULA|' || ktn_sha256('TR-2026-011|The mass of a prismatic tension member is rho * w * t * L.|mass = density * width * thickness * length'))),
  ('cross_section',        'cross_section',        'GEOMETRY', NULL, 'mm2', 'Rectangular cross-section defined by width × thickness.',
    jsonb_build_array(),
    ktn_sha256('cross_section|GEOMETRY|')),
  ('beam_component',       'beam_component',       'COMPONENT', NULL, NULL, 'Tension member component subject to axial load.',
    jsonb_build_array(),
    ktn_sha256('beam_component|COMPONENT|')),
  ('load_case',            'load_case',            'CONSTRAINT', '{"value":1000}'::jsonb, 'N', 'Governing axial load case.',
    jsonb_build_array(ktn_sha256('LR-2026-004|The governing axial load case applies a force of 1000 N.|force = 1000 N')),
    ktn_sha256('load_case|CONSTRAINT|{"value":1000}|' || ktn_sha256('LR-2026-004|The governing axial load case applies a force of 1000 N.|force = 1000 N'))),
  ('material_carbon_steel','material_carbon_steel','MATERIAL', NULL, NULL, 'Carbon steel used for the member.',
    jsonb_build_array(ktn_sha256('MAT-CS-2024|The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.|yield_strength = 250 MPa')),
    ktn_sha256('material_carbon_steel|MATERIAL|' || ktn_sha256('MAT-CS-2024|The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.|yield_strength = 250 MPa'))),
  ('failure_criterion',    'failure_criterion',    'CONSTRAINT', NULL, NULL, 'Yield constraint: σ·SF ≤ yield.',
    jsonb_build_array(ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10')),
    ktn_sha256('failure_criterion|CONSTRAINT|' || ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10'))),
  ('stress_equation',      'stress_equation',      'EQUATION', NULL, NULL, 'σ = F / (w · t).',
    jsonb_build_array(ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)')),
    ktn_sha256('stress_equation|EQUATION|' || ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)'))),
  ('mass_equation',        'mass_equation',        'EQUATION', NULL, NULL, 'm = ρ · w · t · L.',
    jsonb_build_array(ktn_sha256('TR-2026-011|The mass of a prismatic tension member is rho * w * t * L.|mass = density * width * thickness * length')),
    ktn_sha256('mass_equation|EQUATION|' || ktn_sha256('TR-2026-011|The mass of a prismatic tension member is rho * w * t * L.|mass = density * width * thickness * length'))),
  ('constraint_equation',  'constraint_equation',  'EQUATION', NULL, NULL, 'σ · SF ≤ yield.',
    jsonb_build_array(ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10')),
    ktn_sha256('constraint_equation|EQUATION|' || ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10')));

-- ----------------------------------------------------------------------------
-- 3. KNOWLEDGE GRAPH EDGES (immutable)
-- ----------------------------------------------------------------------------
INSERT INTO kv_edges (source_key, target_key, relation, weight, evidence_hashes) VALUES
  ('thickness',             'cross_section',       'DEFINES',     1.0, jsonb_build_array()),
  ('width',                 'cross_section',       'DEFINES',     1.0, jsonb_build_array()),
  ('cross_section',         'stress',              'GOVERNED_BY', 1.0, jsonb_build_array(ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)'))),
  ('stress_equation',       'stress',              'DEFINES',     1.0, jsonb_build_array(ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)'))),
  ('force',                 'stress',              'INPUT_TO',    1.0, jsonb_build_array()),
  ('width',                 'stress',              'INPUT_TO',    1.0, jsonb_build_array()),
  ('thickness',             'stress',              'INPUT_TO',    1.0, jsonb_build_array()),
  ('material_carbon_steel', 'yield_strength',      'DEFINES',     1.0, jsonb_build_array(ktn_sha256('MAT-CS-2024|The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.|yield_strength = 250 MPa'))),
  ('yield_strength',        'failure_criterion',   'INPUT_TO',    1.0, jsonb_build_array()),
  ('safety_factor',         'failure_criterion',   'INPUT_TO',    1.0, jsonb_build_array()),
  ('stress',                'failure_criterion',   'COMPARED_IN', 1.0, jsonb_build_array()),
  ('failure_criterion',     'beam_component',      'CONSTRAINS',  1.0, jsonb_build_array()),
  ('load_case',             'beam_component',      'APPLIES_TO',  1.0, jsonb_build_array()),
  ('mass_equation',         'mass',                'DEFINES',     1.0, jsonb_build_array(ktn_sha256('TR-2026-011|The mass of a prismatic tension member is rho * w * t * L.|mass = density * width * thickness * length'))),
  ('density',               'mass',                'INPUT_TO',    1.0, jsonb_build_array()),
  ('width',                 'mass',                'INPUT_TO',    1.0, jsonb_build_array()),
  ('thickness',             'mass',                'INPUT_TO',    1.0, jsonb_build_array()),
  ('length',                'mass',                'INPUT_TO',    1.0, jsonb_build_array()),
  ('stress_equation',       'thickness',           'BOUND_BY',    1.0, jsonb_build_array(ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)')));

-- ----------------------------------------------------------------------------
-- 4. DESIGN VARIABLES & MODEL PARAMETERS / EQUATIONS
-- ----------------------------------------------------------------------------
INSERT INTO design_variables (id, name, symbol, value_json, unit, lower_bound, upper_bound, active) VALUES
  ('thickness', 'thickness', 't', '{"value":4.0}'::jsonb, 'mm', 0.5, 20.0, true);

INSERT INTO model_parameters (id, name, value_json, unit, bound_span_id, status) VALUES
  ('force',         'force',         '{"value":1000}'::jsonb, 'N',     ktn_sha256('LR-2026-004|The governing axial load case applies a force of 1000 N.|force = 1000 N'), 'ACTIVE'),
  ('width',         'width',         '{"value":10}'::jsonb,   'mm',    ktn_sha256('DWG-1002|The tension member cross-section has a width of 10 mm.|width = 10 mm'), 'ACTIVE'),
  ('length',        'length',        '{"value":1}'::jsonb,    'mm',    ktn_sha256('DWG-1002|The reference member length used for the mass model is 1 mm.|length = 1 mm'), 'ACTIVE'),
  ('density',       'density',       '{"value":1}'::jsonb,    'g/mm3', ktn_sha256('MAT-CS-2024|The carbon steel density is 1 g/mm3 for the simplified mass model.|density = 1 g/mm3'), 'ACTIVE'),
  ('yield_strength','yield_strength','{"value":250}'::jsonb,  'MPa',   ktn_sha256('MAT-CS-2024|The carbon steel grade used in this assembly exhibits a nominal yield strength of 250 MPa.|yield_strength = 250 MPa'), 'ACTIVE'),
  ('safety_factor', 'safety_factor', '{"value":10}'::jsonb,   NULL,    ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10'), 'ACTIVE');

INSERT INTO model_equations (id, name, expression, source_node, target_node, bound_span_id) VALUES
  ('stress_eq', 'stress equation', 'σ = F / (w · t)', 'stress_equation', 'stress',
    ktn_sha256('TR-2026-011|The nominal axial stress is sigma = F / (w * t) for a rectangular section of width w and thickness t under axial load F.|stress = force / (width * thickness)')),
  ('mass_eq',   'mass equation',   'm = ρ · w · t · L', 'mass_equation', 'mass',
    ktn_sha256('TR-2026-011|The mass of a prismatic tension member is rho * w * t * L.|mass = density * width * thickness * length')),
  ('constraint_eq', 'failure constraint', 'σ · SF ≤ yield', 'constraint_equation', 'failure_criterion',
    ktn_sha256('POL-DES-07|All static-load design checks shall apply a safety factor of 10 against the yield strength.|safety_factor = 10'));

-- ----------------------------------------------------------------------------
-- 5. GRADIENT CHECK (finite differences) PERFORMED IN SQL
-- Model: Phi(t) = 10·t + 1e6 · max(0, g(t))^2,  g(t) = 1000/t - 250
--        (mass objective + penalty for violating σ·SF ≤ yield, SF=10)
-- Analytic: dPhi/dt = 10 + 2·1e6·g·g' , g' = -1000/t^2   (smooth where g > 0)
-- Check point t0 = 2.5 (constraint active, objective smooth there).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t0       double precision := 2.5;
  h        double precision := 1e-9;
  lambda   double precision := 1e6;
  g0       double precision;
  phi_m    double precision;
  phi_p    double precision;
  fd       double precision;
  analytic double precision;
  rel_err  double precision;
BEGIN
  -- g(t) = 1000/t - 250 ; Phi = 10 t + lambda·max(0,g)^2
  g0 := 1000 / t0 - 250;
  phi_p := 10 * (t0 + h) + lambda * power(greatest(0, 1000 / (t0 + h) - 250), 2);
  phi_m := 10 * (t0 - h) + lambda * power(greatest(0, 1000 / (t0 - h) - 250), 2);
  fd := (phi_p - phi_m) / (2 * h);
  analytic := 10 + 2 * lambda * g0 * (-1000 / (t0 * t0));
  rel_err := abs(analytic - fd) / greatest(1.0, abs(fd));

  IF rel_err > 1e-5 THEN
    RAISE EXCEPTION 'SQL GRADIENT CHECK FAILED: t0=% analytic=% fd=% rel_err=%', t0, analytic, fd, rel_err;
  END IF;

  INSERT INTO gradient_checks (model, x, analytic, finite_diff, max_error, passed)
  VALUES ('tension_member_penalty', jsonb_build_object('thickness', t0),
          jsonb_build_object('dPhi_dt', analytic),
          jsonb_build_object('dPhi_dt', fd), rel_err, true);

  RAISE NOTICE 'SQL gradient check PASSED at t0=% analytic=% fd=% rel_err=%', t0, analytic, fd, rel_err;
END $$;

-- ----------------------------------------------------------------------------
-- 6. AUDIT LOG (append-only)
-- ----------------------------------------------------------------------------
INSERT INTO audit_log (action, entity, entity_id, detail) VALUES
  ('SEED', 'database', 'schema', jsonb_build_object('nodes', 17, 'edges', 19, 'spans', 8)),
  ('GRADIENT_CHECK', 'domain-core', 'sql-finite-difference', jsonb_build_object('passed', true)),
  ('SYSTEM', 'deployment', 'init-complete', jsonb_build_object('message', 'KTN DEBKG seeded and verified'));
