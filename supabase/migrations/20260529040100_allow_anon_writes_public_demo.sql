-- PUBLIC SYNTHETIC-DATA DEMO: no auth, no real/proprietary data.
-- Allow the anon role to write so the app's server functions (seed, scenarios)
-- work without a service_role secret. To harden later: drop these policies/grants
-- and supply SUPABASE_SERVICE_ROLE_KEY so writes go through the admin client only.
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
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('CREATE POLICY "public_write_demo" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
