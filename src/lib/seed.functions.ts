import { createServerFn } from "@tanstack/react-start";
import { seedDatabase } from "./seed.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabaseAdmin;

export const runSeed = createServerFn({ method: "POST" }).handler(async () => {
  return await seedDatabase();
});

export const getSeedStatus = createServerFn({ method: "GET" }).handler(async () => {
  const tables = [
    "product_families", "memory_technologies", "suppliers", "demand_forecasts",
    "supplier_capacity", "inventory", "purchase_orders", "risk_events",
    "scenario_templates", "scenario_simulations",
  ];
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
    if (error) throw error;
    counts[t] = count ?? 0;
  }
  return { counts, isSeeded: (counts.product_families ?? 0) > 0 };
});
