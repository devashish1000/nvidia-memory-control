import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  planningIntelligenceScore,
  projectedShortage,
  weeksOfSupply,
  supplierConcentration,
  revenueAtRisk,
  purchaseRecommendation,
} from "./planning/calculations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabaseAdmin;

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

async function loadCore() {
  const [families, techs, suppliers, regions, periods, forecasts, capacity, inventory, pos, allocs, risks] =
    await Promise.all([
      db.from("product_families").select("*").order("sort_order"),
      db.from("memory_technologies").select("*").order("sort_order"),
      db.from("suppliers").select("*").order("sort_order"),
      db.from("regions").select("*").order("sort_order"),
      db.from("fiscal_periods").select("*").order("sort_order"),
      db.from("demand_forecasts").select("*").limit(2000),
      db.from("supplier_capacity").select("*").limit(2000),
      db.from("inventory").select("*").limit(2000),
      db.from("purchase_orders").select("*").limit(2000),
      db.from("supplier_allocations").select("*").limit(2000),
      db.from("risk_events").select("*").limit(2000),
    ]);
  return {
    families: families.data ?? [],
    techs: techs.data ?? [],
    suppliers: suppliers.data ?? [],
    regions: regions.data ?? [],
    periods: periods.data ?? [],
    forecasts: forecasts.data ?? [],
    capacity: capacity.data ?? [],
    inventory: inventory.data ?? [],
    pos: pos.data ?? [],
    allocs: allocs.data ?? [],
    risks: risks.data ?? [],
  };
}

export const getDashboardSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const core = await loadCore();
  if (!core.families.length) {
    return { seeded: false } as const;
  }

  const techById = new Map(core.techs.map((t: any) => [t.id, t]));
  const familyById = new Map(core.families.map((f: any) => [f.id, f]));

  // Aggregate by tech: demand vs (inventory + capacity)
  const byTech: Record<string, { tech: string; demand: number; inventory: number; capacity: number; shortage: number; revenueAtRisk: number }> = {};
  for (const t of core.techs) {
    byTech[t.id] = { tech: t.name, demand: 0, inventory: 0, capacity: 0, shortage: 0, revenueAtRisk: 0 };
  }
  for (const f of core.forecasts) {
    const k = byTech[f.memory_technology_id];
    if (k) k.demand += num(f.forecast_units);
  }
  for (const i of core.inventory) {
    const k = byTech[i.memory_technology_id];
    if (k) k.inventory += num(i.inventory_units);
  }
  for (const c of core.capacity) {
    const k = byTech[c.memory_technology_id];
    if (k) k.capacity += num(c.available_capacity_units);
  }
  const openPosByTech: Record<string, number> = {};
  for (const p of core.pos) {
    if (p.status === "open") openPosByTech[p.memory_technology_id] = (openPosByTech[p.memory_technology_id] ?? 0) + num(p.quantity);
  }

  let totalDemand = 0, totalInventory = 0, totalShortage = 0, totalRevenueAtRisk = 0;
  for (const id of Object.keys(byTech)) {
    const row = byTech[id];
    const open = openPosByTech[id] ?? 0;
    row.shortage = projectedShortage(row.demand, row.inventory, row.capacity, open);
    // approximate avg revenue per unit using related product families that use this tech
    const avgRpu =
      core.families.reduce((s: number, f: any) => s + num(f.revenue_per_unit), 0) /
        Math.max(1, core.families.length) / 4; // memory contributes a fraction of revenue
    row.revenueAtRisk = revenueAtRisk(row.shortage, avgRpu);
    totalDemand += row.demand;
    totalInventory += row.inventory;
    totalShortage += row.shortage;
    totalRevenueAtRisk += row.revenueAtRisk;
  }

  const openShortages = core.risks.filter((r: any) => r.status === "open").length;
  const avgWeeklyDemand = totalDemand / 36 / 4.3; // 36 months
  const coverageWeeks = weeksOfSupply(totalInventory, avgWeeklyDemand);

  // Supplier concentration across allocations
  const allocBySupplier: Record<string, number> = {};
  for (const a of core.allocs) {
    allocBySupplier[a.supplier_id] = (allocBySupplier[a.supplier_id] ?? 0) + num(a.allocation_percent);
  }
  const conc = supplierConcentration(Object.values(allocBySupplier));

  // Forecast confidence avg
  const avgConfidence =
    core.forecasts.reduce((s: number, f: any) => s + num(f.forecast_confidence), 0) /
    Math.max(1, core.forecasts.length);

  // Purchase readiness — % of techs with sufficient open POs to cover shortage
  const techsWithShortage = Object.values(byTech).filter((b) => b.shortage > 0);
  const purchaseReadiness =
    techsWithShortage.length === 0
      ? 1
      : techsWithShortage.filter((b) => (openPosByTech[Object.keys(byTech).find((k) => byTech[k] === b)!] ?? 0) > b.shortage * 0.5).length /
        techsWithShortage.length;

  const shortageRisk = totalDemand > 0 ? totalShortage / totalDemand : 0;
  const inventoryHealth = Math.min(1, coverageWeeks / 8);

  const pis = planningIntelligenceScore({
    shortageRisk,
    inventoryHealth,
    supplierConcentration: conc,
    forecastConfidence: avgConfidence,
    purchaseReadiness,
  });

  const supplierRiskIndex = Math.round(
    (core.suppliers.reduce((s: number, x: any) => s + num(x.risk_baseline), 0) / Math.max(1, core.suppliers.length)) * 100
  );
  const watchSuppliers = core.suppliers.filter((s: any) => num(s.risk_baseline) >= 0.3).length;

  return {
    seeded: true,
    pis,
    kpis: {
      revenueAtRisk: totalRevenueAtRisk,
      openShortages,
      coverageWeeks,
      coverageTargetWeeks: 8,
      supplierRiskIndex,
      watchSuppliers,
    },
    byTech: Object.values(byTech).sort((a, b) => b.demand - a.demand),
    families: core.families.length,
    suppliers: core.suppliers.length,
  } as const;
});

export const getForecastAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const core = await loadCore();
  if (!core.families.length) return { seeded: false } as const;

  const periodById = new Map(core.periods.map((p: any) => [p.id, p]));
  const familyById = new Map(core.families.map((f: any) => [f.id, f]));
  const segmentById = new Map<string, any>();
  const { data: segs } = await db.from("customer_segments").select("*");
  for (const s of segs ?? []) segmentById.set(s.id, s);

  // Trend by month for monthly periods only
  const months = core.periods.filter((p: any) => p.period_type === "month").sort((a: any, b: any) => a.sort_order - b.sort_order);
  const byMonth: Record<string, { period: string; demand: number; confidence: number; count: number }> = {};
  for (const m of months) byMonth[m.id] = { period: m.period_code, demand: 0, confidence: 0, count: 0 };
  for (const f of core.forecasts) {
    const k = byMonth[f.fiscal_period_id];
    if (k) {
      k.demand += num(f.forecast_units);
      k.confidence += num(f.forecast_confidence);
      k.count += 1;
    }
  }
  const trend = Object.values(byMonth)
    .map((r) => ({ period: r.period, demand: r.demand, confidence: r.count ? r.confidence / r.count : 0 }))
    .slice(0, 24);

  // By family
  const byFamily: Record<string, { family: string; segment: string; demand: number; confidence: number; count: number }> = {};
  for (const f of core.forecasts) {
    const fam: any = familyById.get(f.product_family_id);
    if (!fam) continue;
    const k = (byFamily[fam.id] ??= { family: fam.name, segment: fam.segment, demand: 0, confidence: 0, count: 0 });
    k.demand += num(f.forecast_units);
    k.confidence += num(f.forecast_confidence);
    k.count += 1;
  }
  const families = Object.values(byFamily)
    .map((r) => ({ family: r.family, segment: r.segment, demand: r.demand, confidence: r.count ? r.confidence / r.count : 0 }))
    .sort((a, b) => b.demand - a.demand);

  // By segment
  const segMap: Record<string, number> = {};
  for (const f of families) segMap[f.segment] = (segMap[f.segment] ?? 0) + f.demand;
  const segments = Object.entries(segMap).map(([name, demand]) => ({ name, demand })).sort((a, b) => b.demand - a.demand);

  return { seeded: true, trend, families, segments } as const;
});

export const getCapacityAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const core = await loadCore();
  if (!core.families.length) return { seeded: false } as const;

  const techById = new Map(core.techs.map((t: any) => [t.id, t]));
  const supplierById = new Map(core.suppliers.map((s: any) => [s.id, s]));

  // Capacity by supplier × tech
  type Row = { supplier: string; tech: string; available: number; committed: number; utilization: number; leadTime: number; yieldRisk: number; supplierType: string; region: string };
  const rows: Row[] = [];
  for (const c of core.capacity) {
    const sup: any = supplierById.get(c.supplier_id);
    const tech: any = techById.get(c.memory_technology_id);
    if (!sup || !tech) continue;
    const avail = num(c.available_capacity_units);
    const committed = num(c.committed_capacity_units);
    rows.push({
      supplier: sup.name,
      tech: tech.name,
      available: avail,
      committed,
      utilization: avail > 0 ? committed / avail : 0,
      leadTime: num(c.lead_time_weeks),
      yieldRisk: num(c.yield_risk_percent),
      supplierType: sup.supplier_type,
      region: sup.region,
    });
  }

  // Aggregate per supplier
  const bySupplier: Record<string, { supplier: string; type: string; region: string; available: number; committed: number; avgLeadTime: number; avgYieldRisk: number; n: number }> = {};
  for (const r of rows) {
    const k = (bySupplier[r.supplier] ??= { supplier: r.supplier, type: r.supplierType, region: r.region, available: 0, committed: 0, avgLeadTime: 0, avgYieldRisk: 0, n: 0 });
    k.available += r.available;
    k.committed += r.committed;
    k.avgLeadTime += r.leadTime;
    k.avgYieldRisk += r.yieldRisk;
    k.n += 1;
  }
  const suppliers = Object.values(bySupplier).map((s) => ({
    supplier: s.supplier,
    type: s.type,
    region: s.region,
    available: s.available,
    committed: s.committed,
    utilization: s.available > 0 ? s.committed / s.available : 0,
    avgLeadTime: s.n ? s.avgLeadTime / s.n : 0,
    avgYieldRisk: s.n ? s.avgYieldRisk / s.n : 0,
  })).sort((a, b) => b.available - a.available);

  // Aggregate per tech
  const byTechAgg: Record<string, { tech: string; available: number; committed: number; suppliers: Set<string> }> = {};
  for (const r of rows) {
    const k = (byTechAgg[r.tech] ??= { tech: r.tech, available: 0, committed: 0, suppliers: new Set() });
    k.available += r.available;
    k.committed += r.committed;
    k.suppliers.add(r.supplier);
  }
  const techs = Object.values(byTechAgg).map((t) => ({
    tech: t.tech,
    available: t.available,
    committed: t.committed,
    utilization: t.available > 0 ? t.committed / t.available : 0,
    supplierCount: t.suppliers.size,
  })).sort((a, b) => b.available - a.available);

  return { seeded: true, suppliers, techs } as const;
});

export const getInventoryAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const core = await loadCore();
  if (!core.families.length) return { seeded: false } as const;

  const techById = new Map(core.techs.map((t: any) => [t.id, t]));
  const familyById = new Map(core.families.map((f: any) => [f.id, f]));
  const regionById = new Map(core.regions.map((r: any) => [r.id, r]));

  // demand per tech (annualized → weekly)
  const demandByTech: Record<string, number> = {};
  for (const f of core.forecasts) demandByTech[f.memory_technology_id] = (demandByTech[f.memory_technology_id] ?? 0) + num(f.forecast_units);

  const rows = core.inventory.map((i: any) => {
    const tech: any = techById.get(i.memory_technology_id);
    const fam: any = familyById.get(i.product_family_id);
    const reg: any = regionById.get(i.region_id);
    const inv = num(i.inventory_units);
    const safety = num(i.safety_stock_units);
    const annualDemand = demandByTech[i.memory_technology_id] ?? 0;
    const weekly = annualDemand / 36 / 4.3;
    const wos = weeksOfSupply(inv, weekly);
    return {
      tech: tech?.name ?? "—",
      family: fam?.name ?? "—",
      region: reg?.name ?? "—",
      inventory: inv,
      safetyStock: safety,
      wos,
      coverage: safety > 0 ? inv / safety : 0,
      status: inv < safety * 0.5 ? "critical" : inv < safety ? "low" : wos > 16 ? "excess" : "healthy",
    };
  });

  // Aggregate by tech
  const byTech: Record<string, { tech: string; inventory: number; safetyStock: number; rows: number; wosSum: number }> = {};
  for (const r of rows) {
    const k = (byTech[r.tech] ??= { tech: r.tech, inventory: 0, safetyStock: 0, rows: 0, wosSum: 0 });
    k.inventory += r.inventory;
    k.safetyStock += r.safetyStock;
    k.rows += 1;
    k.wosSum += r.wos;
  }
  const techs = Object.values(byTech).map((t) => ({
    tech: t.tech,
    inventory: t.inventory,
    safetyStock: t.safetyStock,
    avgWos: t.rows ? t.wosSum / t.rows : 0,
  })).sort((a, b) => b.inventory - a.inventory);

  const statusCounts = rows.reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return { seeded: true, rows: rows.slice(0, 200), techs, statusCounts } as const;
});

export const getPurchasingAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const core = await loadCore();
  if (!core.families.length) return { seeded: false } as const;

  const techById = new Map(core.techs.map((t: any) => [t.id, t]));
  const supplierById = new Map(core.suppliers.map((s: any) => [s.id, s]));
  const familyById = new Map(core.families.map((f: any) => [f.id, f]));

  // Aggregate forecast vs inventory + open POs per tech to build recommendations
  const demandByTech: Record<string, number> = {};
  const safetyByTech: Record<string, number> = {};
  const invByTech: Record<string, number> = {};
  const capByTech: Record<string, number> = {};
  const openPosByTech: Record<string, number> = {};

  for (const f of core.forecasts) demandByTech[f.memory_technology_id] = (demandByTech[f.memory_technology_id] ?? 0) + num(f.forecast_units);
  for (const i of core.inventory) {
    invByTech[i.memory_technology_id] = (invByTech[i.memory_technology_id] ?? 0) + num(i.inventory_units);
    safetyByTech[i.memory_technology_id] = (safetyByTech[i.memory_technology_id] ?? 0) + num(i.safety_stock_units);
  }
  for (const c of core.capacity) capByTech[c.memory_technology_id] = (capByTech[c.memory_technology_id] ?? 0) + num(c.available_capacity_units);
  for (const p of core.pos) {
    if (p.status === "open") openPosByTech[p.memory_technology_id] = (openPosByTech[p.memory_technology_id] ?? 0) + num(p.quantity);
  }

  const horizon = 1 / 12; // 1 month of annualized demand
  const recommendations = core.techs.map((t: any) => {
    const demand = (demandByTech[t.id] ?? 0) * horizon;
    const safety = safetyByTech[t.id] ?? 0;
    const inv = invByTech[t.id] ?? 0;
    const cap = capByTech[t.id] ?? 0;
    const open = openPosByTech[t.id] ?? 0;
    const recommend = purchaseRecommendation(demand, safety, inv, cap, open);
    return {
      tech: t.name,
      demand,
      inventory: inv,
      capacity: cap,
      openPOs: open,
      safety,
      recommend,
      priority: recommend > demand * 0.3 ? "high" : recommend > 0 ? "medium" : "low",
    };
  }).sort((a: any, b: any) => b.recommend - a.recommend);

  const openPos = core.pos.filter((p: any) => p.status === "open").map((p: any) => {
    const sup: any = supplierById.get(p.supplier_id);
    const tech: any = techById.get(p.memory_technology_id);
    const fam: any = p.product_family_id ? familyById.get(p.product_family_id) : null;
    return {
      supplier: sup?.name ?? "—",
      tech: tech?.name ?? "—",
      family: fam?.name ?? "—",
      quantity: num(p.quantity),
      expected: p.expected_arrival_date,
      expediteCost: num(p.expedite_cost),
    };
  }).sort((a: any, b: any) => (a.expected < b.expected ? -1 : 1)).slice(0, 100);

  const totalOpenValue = openPos.reduce((s: number, p: any) => s + p.quantity, 0);
  const expediteSpend = openPos.reduce((s: number, p: any) => s + p.expediteCost, 0);

  return {
    seeded: true,
    recommendations,
    openPos,
    summary: {
      openPoCount: core.pos.filter((p: any) => p.status === "open").length,
      totalOpenUnits: totalOpenValue,
      expediteSpend,
      recommendedUnits: recommendations.reduce((s: number, r: any) => s + r.recommend, 0),
    },
  } as const;
});

export const getRiskAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const core = await loadCore();
  if (!core.families.length) return { seeded: false } as const;

  const supplierById = new Map(core.suppliers.map((s: any) => [s.id, s]));
  const techById = new Map(core.techs.map((t: any) => [t.id, t]));
  const familyById = new Map(core.families.map((f: any) => [f.id, f]));

  // Heatmap: category × severity counts
  const categories = Array.from(new Set((core.risks as any[]).map((r: any) => r.category as string))) as string[];
  const severities = ["low", "medium", "high", "critical"];
  const heatmap = categories.map((cat) => {
    const row: any = { category: cat };
    for (const s of severities) {
      row[s] = core.risks.filter((r: any) => r.category === cat && r.severity === s).length;
    }
    row.total = severities.reduce((acc, s) => acc + row[s], 0);
    row.revenueAtRisk = core.risks
      .filter((r: any) => r.category === cat)
      .reduce((s: number, r: any) => s + num(r.revenue_at_risk), 0);
    return row;
  }).sort((a: any, b: any) => b.revenueAtRisk - a.revenueAtRisk);

  // Top risk events
  const events = core.risks
    .map((r: any) => {
      const sup: any = r.supplier_id ? supplierById.get(r.supplier_id) : null;
      const tech: any = r.memory_technology_id ? techById.get(r.memory_technology_id) : null;
      const fam: any = r.product_family_id ? familyById.get(r.product_family_id) : null;
      return {
        id: r.id,
        category: r.category,
        severity: r.severity,
        status: r.status,
        description: r.description,
        supplier: sup?.name ?? "—",
        tech: tech?.name ?? "—",
        family: fam?.name ?? "—",
        revenueAtRisk: num(r.revenue_at_risk),
        impactUnits: num(r.impact_units),
        eventDate: r.event_date,
      };
    })
    .sort((a: any, b: any) => b.revenueAtRisk - a.revenueAtRisk);

  // Severity counts
  const severityCounts = severities.reduce((acc: Record<string, number>, s) => {
    acc[s] = core.risks.filter((r: any) => r.severity === s).length;
    return acc;
  }, {});

  // By supplier
  const bySupplier: Record<string, { supplier: string; count: number; revenueAtRisk: number }> = {};
  for (const r of core.risks as any[]) {
    if (!r.supplier_id) continue;
    const sup: any = supplierById.get(r.supplier_id);
    if (!sup) continue;
    const k = (bySupplier[sup.id] ??= { supplier: sup.name, count: 0, revenueAtRisk: 0 });
    k.count += 1;
    k.revenueAtRisk += num(r.revenue_at_risk);
  }
  const suppliers = Object.values(bySupplier).sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);

  const totalRevenueAtRisk = core.risks.reduce((s: number, r: any) => s + num(r.revenue_at_risk), 0);
  const openCount = core.risks.filter((r: any) => r.status === "open").length;

  return {
    seeded: true,
    heatmap,
    events: events.slice(0, 150),
    severityCounts,
    suppliers,
    summary: { total: core.risks.length, open: openCount, totalRevenueAtRisk },
  } as const;
});

export const getTwinSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const core = await loadCore();
  if (!core.families.length) return { seeded: false } as const;

  const techById = new Map(core.techs.map((t: any) => [t.id, t]));

  // Suppliers node summary
  const nodeSuppliers = (core.suppliers as any[]).map((s) => {
    const cap = (core.capacity as any[])
      .filter((c) => c.supplier_id === s.id)
      .reduce((acc, c) => acc + num(c.available_capacity_units), 0);
    const committed = (core.capacity as any[])
      .filter((c) => c.supplier_id === s.id)
      .reduce((acc, c) => acc + num(c.committed_capacity_units), 0);
    const util = cap > 0 ? committed / cap : 0;
    return {
      id: s.id,
      name: s.name,
      type: s.supplier_type,
      region: s.region,
      risk: num(s.risk_baseline),
      capacity: cap,
      utilization: util,
      status: util > 0.95 ? "critical" : util > 0.85 ? "warning" : "healthy",
    };
  });

  const nodeTechs = (core.techs as any[]).map((t) => {
    const demand = (core.forecasts as any[])
      .filter((f) => f.memory_technology_id === t.id)
      .reduce((acc, f) => acc + num(f.forecast_units), 0);
    const inv = (core.inventory as any[])
      .filter((i) => i.memory_technology_id === t.id)
      .reduce((acc, i) => acc + num(i.inventory_units), 0);
    return { id: t.id, name: t.name, generation: t.generation, demand, inventory: inv };
  });

  const nodeFamilies = (core.families as any[]).map((f) => ({
    id: f.id, name: f.name, segment: f.segment,
  }));

  // Edges: supplier → tech (from capacity rows aggregated)
  const supplierTechEdges: { source: string; target: string; weight: number }[] = [];
  const stMap: Record<string, number> = {};
  for (const c of core.capacity as any[]) {
    const k = `${c.supplier_id}|${c.memory_technology_id}`;
    stMap[k] = (stMap[k] ?? 0) + num(c.available_capacity_units);
  }
  for (const [k, w] of Object.entries(stMap)) {
    const [source, target] = k.split("|");
    supplierTechEdges.push({ source, target, weight: w });
  }

  return {
    seeded: true,
    suppliers: nodeSuppliers,
    techs: nodeTechs,
    families: nodeFamilies,
    edges: supplierTechEdges,
  } as const;
});
