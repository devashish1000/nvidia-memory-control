/**
 * Scenario engine — applies a lever to a snapshot of the supply base and
 * computes downstream KPIs + a Day 0/15/30/60/90/Recovery decision timeline.
 * Pure deterministic math, server-side only.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  projectedShortage,
  revenueAtRisk,
  riskScore,
  supplierConcentration,
} from "./planning/calculations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabaseAdmin;
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

export type Lever =
  | "supplier_capacity_reduction"
  | "yield_degradation"
  | "demand_surge"
  | "lead_time_increase"
  | "allocation_shift";

export interface ScenarioScope {
  supplier?: string;       // supplier code
  supplier_type?: string;
  memory_tech?: string;    // tech code
  product_family?: string; // family code
  region?: string;
  segment?: string;
}

export interface ScenarioInput {
  name: string;
  lever: Lever;
  magnitude: number;
  scope: ScenarioScope;
  duration_weeks: number;
  template_id?: string | null;
}

export interface TimelinePoint {
  day_offset: number;
  label: string;
  headline: string;
  metric_delta_pct: number;
  narrative: string;
  sort_order: number;
}

export interface ScenarioResult {
  id: string;
  name: string;
  shortage_impact_units: number;
  revenue_at_risk: number;
  risk_score_delta: number;
  recovery_weeks: number;
  summary: string;
  timeline: TimelinePoint[];
  causality: string[];
}

async function loadAll() {
  const [families, techs, suppliers, regions, segments, forecasts, capacity, inventory, pos, allocs] =
    await Promise.all([
      db.from("product_families").select("*"),
      db.from("memory_technologies").select("*"),
      db.from("suppliers").select("*"),
      db.from("regions").select("*"),
      db.from("customer_segments").select("*"),
      db.from("demand_forecasts").select("*").limit(2000),
      db.from("supplier_capacity").select("*").limit(2000),
      db.from("inventory").select("*").limit(2000),
      db.from("purchase_orders").select("*").limit(2000),
      db.from("supplier_allocations").select("*").limit(2000),
    ]);
  return {
    families: families.data ?? [],
    techs: techs.data ?? [],
    suppliers: suppliers.data ?? [],
    regions: regions.data ?? [],
    segments: segments.data ?? [],
    forecasts: forecasts.data ?? [],
    capacity: capacity.data ?? [],
    inventory: inventory.data ?? [],
    pos: pos.data ?? [],
    allocs: allocs.data ?? [],
  };
}

export async function runScenarioEngine(input: ScenarioInput): Promise<ScenarioResult> {
  const core = await loadAll();
  if (!core.families.length) throw new Error("Dataset not initialized.");

  const supplierByCode = new Map(core.suppliers.map((s: any) => [s.code, s]));
  const techByCode = new Map(core.techs.map((t: any) => [t.code, t]));
  const familyByCode = new Map(core.families.map((f: any) => [f.code, f]));

  const scopedSupplierIds = new Set<string>();
  if (input.scope.supplier) {
    const s: any = supplierByCode.get(input.scope.supplier);
    if (s) scopedSupplierIds.add(s.id);
  }
  if (input.scope.supplier_type) {
    for (const s of core.suppliers as any[]) {
      if (s.supplier_type === input.scope.supplier_type) scopedSupplierIds.add(s.id);
    }
  }
  const scopedTechIds = new Set<string>();
  if (input.scope.memory_tech) {
    const t: any = techByCode.get(input.scope.memory_tech);
    if (t) scopedTechIds.add(t.id);
  }
  const scopedFamilyIds = new Set<string>();
  if (input.scope.product_family) {
    const f: any = familyByCode.get(input.scope.product_family);
    if (f) scopedFamilyIds.add(f.id);
  }

  // Baseline aggregates per tech
  const demandByTech: Record<string, number> = {};
  const invByTech: Record<string, number> = {};
  const capByTech: Record<string, number> = {};
  const openPosByTech: Record<string, number> = {};
  for (const t of core.techs as any[]) {
    demandByTech[t.id] = 0; invByTech[t.id] = 0; capByTech[t.id] = 0; openPosByTech[t.id] = 0;
  }
  for (const f of core.forecasts as any[]) demandByTech[f.memory_technology_id] = (demandByTech[f.memory_technology_id] ?? 0) + num(f.forecast_units);
  for (const i of core.inventory as any[]) invByTech[i.memory_technology_id] = (invByTech[i.memory_technology_id] ?? 0) + num(i.inventory_units);
  for (const c of core.capacity as any[]) capByTech[c.memory_technology_id] = (capByTech[c.memory_technology_id] ?? 0) + num(c.available_capacity_units);
  for (const p of core.pos as any[]) if (p.status === "open") openPosByTech[p.memory_technology_id] = (openPosByTech[p.memory_technology_id] ?? 0) + num(p.quantity);

  let baselineShortage = 0;
  for (const t of core.techs as any[]) {
    baselineShortage += projectedShortage(demandByTech[t.id], invByTech[t.id], capByTech[t.id], openPosByTech[t.id]);
  }

  // Apply lever to a working copy
  const causality: string[] = [];
  const scenarioDemand: Record<string, number> = { ...demandByTech };
  const scenarioCap: Record<string, number> = { ...capByTech };

  const horizon = Math.max(1, input.duration_weeks) / 52; // fraction of annual
  const mag = input.magnitude;

  if (input.lever === "supplier_capacity_reduction" || input.lever === "yield_degradation") {
    // Reduce capacity at scoped suppliers/techs.
    let lost = 0;
    for (const c of core.capacity as any[]) {
      const supplierMatch = scopedSupplierIds.size === 0 || scopedSupplierIds.has(c.supplier_id);
      const techMatch = scopedTechIds.size === 0 || scopedTechIds.has(c.memory_technology_id);
      if (supplierMatch && techMatch) {
        const reduction = num(c.available_capacity_units) * Math.abs(mag) * horizon;
        scenarioCap[c.memory_technology_id] = (scenarioCap[c.memory_technology_id] ?? 0) - reduction;
        lost += reduction;
      }
    }
    causality.push(`Lever applied: ${input.lever} (${Math.round(mag * 100)}%) for ${input.duration_weeks} weeks.`);
    causality.push(`Effective capacity reduced by ${Math.round(lost).toLocaleString()} units across scoped rows.`);
  } else if (input.lever === "demand_surge") {
    let added = 0;
    for (const f of core.forecasts as any[]) {
      const techMatch = scopedTechIds.size === 0 || scopedTechIds.has(f.memory_technology_id);
      const famMatch = scopedFamilyIds.size === 0 || scopedFamilyIds.has(f.product_family_id);
      const segMatch = !input.scope.segment || (core.segments as any[]).find((s) => s.id === f.customer_segment_id)?.name === input.scope.segment;
      const regMatch = !input.scope.region || (core.regions as any[]).find((r) => r.id === f.region_id)?.name === input.scope.region;
      if (techMatch && famMatch && segMatch && regMatch) {
        const lift = num(f.forecast_units) * mag * horizon;
        scenarioDemand[f.memory_technology_id] = (scenarioDemand[f.memory_technology_id] ?? 0) + lift;
        added += lift;
      }
    }
    causality.push(`Lever applied: demand surge (+${Math.round(mag * 100)}%) for ${input.duration_weeks} weeks.`);
    causality.push(`Additional demand introduced: ${Math.round(added).toLocaleString()} units.`);
  } else if (input.lever === "lead_time_increase") {
    // Lead-time increase erodes effective in-window supply ~ proportional to duration / lead time delta.
    const erosionFactor = Math.min(0.5, mag / 26); // weeks added / planning horizon
    let lost = 0;
    for (const t of core.techs as any[]) {
      const baseCap = scenarioCap[t.id] ?? 0;
      const reduction = baseCap * erosionFactor * horizon;
      scenarioCap[t.id] = baseCap - reduction;
      lost += reduction;
    }
    causality.push(`Lever applied: lead-time increase of ${mag} weeks for ${input.duration_weeks} weeks.`);
    causality.push(`In-window effective capacity erodes by ${Math.round(lost).toLocaleString()} units.`);
  } else if (input.lever === "allocation_shift") {
    // Treat allocation reduction in scope as demand removed from scoped region / supplier
    let shifted = 0;
    for (const f of core.forecasts as any[]) {
      const regMatch = !input.scope.region || (core.regions as any[]).find((r) => r.id === f.region_id)?.name === input.scope.region;
      if (regMatch) {
        const shift = num(f.forecast_units) * Math.abs(mag) * horizon;
        scenarioDemand[f.memory_technology_id] = Math.max(0, (scenarioDemand[f.memory_technology_id] ?? 0) - shift);
        shifted += shift;
      }
    }
    causality.push(`Lever applied: allocation shift (${Math.round(mag * 100)}%) in ${input.scope.region ?? "scope"}.`);
    causality.push(`Demand reallocated out of scope: ${Math.round(shifted).toLocaleString()} units.`);
  }

  // Recompute scenario shortage + revenue at risk
  let scenarioShortage = 0;
  let revAtRisk = 0;
  const avgRpu =
    (core.families as any[]).reduce((s: number, f: any) => s + num(f.revenue_per_unit), 0) /
      Math.max(1, core.families.length) / 4;
  for (const t of core.techs as any[]) {
    const sh = projectedShortage(scenarioDemand[t.id], invByTech[t.id], scenarioCap[t.id], openPosByTech[t.id]);
    scenarioShortage += sh;
    revAtRisk += revenueAtRisk(sh, avgRpu);
  }
  const shortageDelta = scenarioShortage - baselineShortage;

  // Risk-score delta proxy
  const baselineRisk = riskScore({ shortageSeverity: 0.3, leadTimeRisk: 0.3, concentration: 0.4, forecastVolatility: 0.3 });
  const scenarioRisk = riskScore({
    shortageSeverity: Math.min(1, scenarioShortage / Math.max(1, Object.values(scenarioDemand).reduce((a, b) => a + b, 0))),
    leadTimeRisk: input.lever === "lead_time_increase" ? 0.7 : 0.35,
    concentration: input.lever.includes("supplier") || input.lever === "yield_degradation" ? 0.6 : 0.4,
    forecastVolatility: input.lever === "demand_surge" ? 0.7 : 0.3,
  });
  const riskDelta = scenarioRisk - baselineRisk;

  // Recovery weeks ~ duration + lead-time buffer
  const recoveryWeeks = Math.round(input.duration_weeks * 0.6 + (input.lever === "lead_time_increase" ? mag : 4));

  causality.push(`Baseline shortage: ${Math.round(baselineShortage).toLocaleString()} units.`);
  causality.push(`Scenario shortage: ${Math.round(scenarioShortage).toLocaleString()} units (Δ ${shortageDelta >= 0 ? "+" : ""}${Math.round(shortageDelta).toLocaleString()}).`);
  causality.push(`Estimated revenue at risk: $${Math.round(revAtRisk).toLocaleString()}.`);

  // Build Day 0 / 15 / 30 / 60 / 90 / Recovery timeline
  const deltaPct = baselineShortage > 0 ? shortageDelta / baselineShortage : (scenarioShortage > 0 ? 1 : 0);
  const timeline: TimelinePoint[] = [
    {
      day_offset: 0,
      label: "Day 0 — Trigger",
      headline: input.name,
      metric_delta_pct: 0,
      narrative: causality[0] ?? "Scenario applied to live plan.",
      sort_order: 0,
    },
    {
      day_offset: 15,
      label: "Day 15 — Triage",
      headline: "Allocation board convenes; expedite POs queued",
      metric_delta_pct: deltaPct * 0.2,
      narrative: "Planning issues stop-ship guidance on low-priority programs. Top customers protected with safety stock buffer.",
      sort_order: 1,
    },
    {
      day_offset: 30,
      label: "Day 30 — First Impact",
      headline: `Shortage exposure climbs ${Math.round(deltaPct * 30)}%`,
      metric_delta_pct: deltaPct * 0.45,
      narrative: "Expedite cost begins to accrue. Inventory drawdown accelerates on affected memory technologies.",
      sort_order: 2,
    },
    {
      day_offset: 60,
      label: "Day 60 — Peak Stress",
      headline: "Revenue at risk crystallizes",
      metric_delta_pct: deltaPct,
      narrative: `Estimated $${Math.round(revAtRisk / 1_000_000)}M revenue at risk if mitigation not landed. Alternate supplier qualification kicked off.`,
      sort_order: 3,
    },
    {
      day_offset: 90,
      label: "Day 90 — Mitigation",
      headline: "Alternate flow online; allocations rebalanced",
      metric_delta_pct: deltaPct * 0.65,
      narrative: "Substitution path qualified. Demand reshaping with sales lowers exposure. Capacity adders ramp.",
      sort_order: 4,
    },
    {
      day_offset: Math.max(120, recoveryWeeks * 7),
      label: `Recovery — Week ${recoveryWeeks}`,
      headline: "Plan re-stabilizes",
      metric_delta_pct: deltaPct * 0.2,
      narrative: "Inventory replenishes to target weeks-of-supply; risk score returns within tolerance.",
      sort_order: 5,
    },
  ];

  const summary = `${input.name}: ${shortageDelta >= 0 ? "+" : ""}${Math.round(shortageDelta).toLocaleString()} units of shortage, ~$${Math.round(revAtRisk / 1_000_000)}M revenue at risk, recovery estimated in ${recoveryWeeks} weeks.`;

  // Persist simulation and timeline
  const { data: sim, error: simErr } = await db
    .from("scenario_simulations")
    .insert({
      template_id: input.template_id ?? null,
      name: input.name,
      lever: input.lever,
      magnitude: input.magnitude,
      scope: input.scope,
      duration_weeks: input.duration_weeks,
      shortage_impact_units: Math.round(scenarioShortage),
      revenue_at_risk: Math.round(revAtRisk),
      risk_score_delta: riskDelta,
      recovery_weeks: recoveryWeeks,
      summary,
      causality_chain: causality,
    })
    .select()
    .single();
  if (simErr || !sim) throw new Error(`scenario_simulations: ${simErr?.message ?? "insert failed"}`);

  const tlRows = timeline.map((p) => ({ ...p, simulation_id: sim.id }));
  const { error: tlErr } = await db.from("scenario_timeline_points").insert(tlRows);
  if (tlErr) throw new Error(`scenario_timeline_points: ${tlErr.message}`);

  return {
    id: sim.id,
    name: sim.name,
    shortage_impact_units: Math.round(scenarioShortage),
    revenue_at_risk: Math.round(revAtRisk),
    risk_score_delta: riskDelta,
    recovery_weeks: recoveryWeeks,
    summary,
    timeline,
    causality,
  };
}
