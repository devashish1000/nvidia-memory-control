import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runScenarioEngine } from "./scenario.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabaseAdmin;

export const listScenarioTemplates = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db.from("scenario_templates").select("*").order("sort_order");
  return data ?? [];
});

export const listScenarioSimulations = createServerFn({ method: "GET" }).handler(async () => {
  const { data: sims } = await db
    .from("scenario_simulations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!sims?.length) return [];
  const ids = sims.map((s: any) => s.id);
  const { data: tls } = await db
    .from("scenario_timeline_points")
    .select("*")
    .in("simulation_id", ids)
    .order("sort_order");
  const byId: Record<string, any[]> = {};
  for (const t of tls ?? []) (byId[t.simulation_id] ??= []).push(t);
  return sims.map((s: any) => ({ ...s, timeline: byId[s.id] ?? [] }));
});

const ScopeSchema = z
  .object({
    supplier: z.string().optional(),
    supplier_type: z.string().optional(),
    memory_tech: z.string().optional(),
    product_family: z.string().optional(),
    region: z.string().optional(),
    segment: z.string().optional(),
  })
  .strict();

const RunSchema = z.object({
  name: z.string().min(1).max(120),
  lever: z.enum([
    "supplier_capacity_reduction",
    "yield_degradation",
    "demand_surge",
    "lead_time_increase",
    "allocation_shift",
  ]),
  magnitude: z.number(),
  scope: ScopeSchema,
  duration_weeks: z.number().int().min(1).max(104),
  template_id: z.string().uuid().nullable().optional(),
});

export const runScenario = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RunSchema.parse(input))
  .handler(async ({ data }) => {
    return runScenarioEngine(data);
  });
