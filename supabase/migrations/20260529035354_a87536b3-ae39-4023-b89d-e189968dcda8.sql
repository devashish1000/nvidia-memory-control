
-- Reference tables
CREATE TABLE public.product_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  segment text NOT NULL,
  revenue_per_unit numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.memory_technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  generation text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  supplier_type text NOT NULL,
  region text NOT NULL,
  risk_baseline numeric NOT NULL DEFAULT 0.3,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.fiscal_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_code text UNIQUE NOT NULL,
  period_type text NOT NULL, -- month, quarter, year
  start_date date NOT NULL,
  end_date date NOT NULL,
  fiscal_year int NOT NULL,
  fiscal_quarter int,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.planning_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

-- Planning tables
CREATE TABLE public.demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_family_id uuid NOT NULL REFERENCES public.product_families(id) ON DELETE CASCADE,
  memory_technology_id uuid NOT NULL REFERENCES public.memory_technologies(id) ON DELETE CASCADE,
  customer_segment_id uuid NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  planning_version_id uuid NOT NULL REFERENCES public.planning_versions(id) ON DELETE CASCADE,
  fiscal_period_id uuid NOT NULL REFERENCES public.fiscal_periods(id) ON DELETE CASCADE,
  forecast_units numeric NOT NULL DEFAULT 0,
  forecast_confidence numeric NOT NULL DEFAULT 0.7,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_forecasts_period ON public.demand_forecasts(fiscal_period_id);
CREATE INDEX idx_forecasts_family ON public.demand_forecasts(product_family_id);

CREATE TABLE public.supplier_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  memory_technology_id uuid NOT NULL REFERENCES public.memory_technologies(id) ON DELETE CASCADE,
  fiscal_period_id uuid NOT NULL REFERENCES public.fiscal_periods(id) ON DELETE CASCADE,
  committed_capacity_units numeric NOT NULL DEFAULT 0,
  available_capacity_units numeric NOT NULL DEFAULT 0,
  lead_time_weeks numeric NOT NULL DEFAULT 8,
  yield_risk_percent numeric NOT NULL DEFAULT 5,
  moq numeric NOT NULL DEFAULT 1000
);
CREATE INDEX idx_capacity_period ON public.supplier_capacity(fiscal_period_id);
CREATE INDEX idx_capacity_supplier ON public.supplier_capacity(supplier_id);

CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_family_id uuid NOT NULL REFERENCES public.product_families(id) ON DELETE CASCADE,
  memory_technology_id uuid NOT NULL REFERENCES public.memory_technologies(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  inventory_units numeric NOT NULL DEFAULT 0,
  safety_stock_units numeric NOT NULL DEFAULT 0,
  as_of_date date NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  memory_technology_id uuid NOT NULL REFERENCES public.memory_technologies(id) ON DELETE CASCADE,
  product_family_id uuid REFERENCES public.product_families(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 0,
  expected_arrival_date date NOT NULL,
  status text NOT NULL DEFAULT 'open', -- open, shipped, received, cancelled
  expedite_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_family_id uuid NOT NULL REFERENCES public.product_families(id) ON DELETE CASCADE,
  memory_technology_id uuid NOT NULL REFERENCES public.memory_technologies(id) ON DELETE CASCADE,
  allocation_percent numeric NOT NULL DEFAULT 0,
  fiscal_period_id uuid NOT NULL REFERENCES public.fiscal_periods(id) ON DELETE CASCADE
);

-- Risk tables
CREATE TABLE public.risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  severity text NOT NULL, -- low, medium, high, critical
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_family_id uuid REFERENCES public.product_families(id) ON DELETE SET NULL,
  memory_technology_id uuid REFERENCES public.memory_technologies(id) ON DELETE SET NULL,
  description text NOT NULL,
  impact_units numeric NOT NULL DEFAULT 0,
  revenue_at_risk numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  event_date date NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE public.forecast_variance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_family_id uuid NOT NULL REFERENCES public.product_families(id) ON DELETE CASCADE,
  fiscal_period_id uuid NOT NULL REFERENCES public.fiscal_periods(id) ON DELETE CASCADE,
  planning_version_id uuid NOT NULL REFERENCES public.planning_versions(id) ON DELETE CASCADE,
  forecast_units numeric NOT NULL,
  actual_units numeric NOT NULL,
  variance_percent numeric NOT NULL
);

CREATE TABLE public.shortage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_family_id uuid NOT NULL REFERENCES public.product_families(id) ON DELETE CASCADE,
  memory_technology_id uuid NOT NULL REFERENCES public.memory_technologies(id) ON DELETE CASCADE,
  fiscal_period_id uuid NOT NULL REFERENCES public.fiscal_periods(id) ON DELETE CASCADE,
  shortage_units numeric NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  detected_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Scenario engine
CREATE TABLE public.scenario_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  lever text NOT NULL,
  magnitude numeric NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_weeks int NOT NULL DEFAULT 8,
  narrative text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.scenario_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.scenario_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  lever text NOT NULL,
  magnitude numeric NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_weeks int NOT NULL DEFAULT 8,
  shortage_impact_units numeric NOT NULL DEFAULT 0,
  revenue_at_risk numeric NOT NULL DEFAULT 0,
  risk_score_delta numeric NOT NULL DEFAULT 0,
  recovery_weeks int NOT NULL DEFAULT 0,
  summary text NOT NULL DEFAULT '',
  causality_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.scenario_timeline_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES public.scenario_simulations(id) ON DELETE CASCADE,
  day_offset int NOT NULL,
  label text NOT NULL,
  headline text NOT NULL,
  narrative text NOT NULL,
  metric_delta_pct numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.executive_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  summary text NOT NULL,
  top_risk text NOT NULL,
  top_action text NOT NULL,
  revenue_at_risk numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL, -- user, assistant
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_copilot_session ON public.copilot_messages(session_id, created_at);

CREATE TABLE public.test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  passed int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0
);

-- GRANTS (public-readable demo; writes via server fn with service_role)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'product_families','memory_technologies','suppliers','customer_segments','regions',
    'fiscal_periods','planning_versions','demand_forecasts','supplier_capacity','inventory',
    'purchase_orders','supplier_allocations','risk_events','forecast_variance','shortage_events',
    'scenario_templates','scenario_simulations','scenario_timeline_points','executive_summaries',
    'copilot_messages','test_runs'
  ]) LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "public_read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;
