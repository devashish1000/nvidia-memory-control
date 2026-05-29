-- Enable Supabase Realtime on all public tables so the app receives live
-- change events and refreshes the UI in real time.
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
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
  END LOOP;
END $$;
