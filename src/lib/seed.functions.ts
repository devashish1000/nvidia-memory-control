import { createServerFn } from "@tanstack/react-start";
import { seedDatabase } from "./seed.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const runSeed = createServerFn({ method: "POST" }).handler(async () => {
  const result = await seedDatabase();
  return result;
});

export const getSeedStatus = createServerFn({ method: "GET" }).handler(async () => {
  const tables = [
    "product_families", "memory_technologies", "suppliers", "demand_forecasts",
    "supplier_capacity", "inventory", "purchase_orders", "risk_events",
    "scenario_templates", "scenario_simulations",
  ];
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const { count } = await supabaseAdmin.from(t).select("*", { count: "exact", head: true });
    counts[t] = count ?? 0;
  }
  return { counts, isSeeded: (counts.product_families ?? 0) > 0 };
});
