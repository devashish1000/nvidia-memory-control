/**
 * Synthetic seed data generator for the Memory Supply Control Tower.
 * Server-only — imports supabaseAdmin to bypass RLS.
 * Idempotent: clears planning tables before reseeding (ref data preserved if present).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";

// Types for new tables aren't generated yet; cast to any for the seed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = _supabaseAdmin;
// Deterministic PRNG so re-seeding produces the same dataset.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const rng = () => rand();
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const range = (min: number, max: number) => min + rng() * (max - min);
const intRange = (min: number, max: number) => Math.floor(range(min, max + 1));

const PRODUCT_FAMILIES = [
  { code: "AI_TRAIN", name: "AI Training Accelerators", segment: "AI", revenue_per_unit: 32000 },
  { code: "AI_INFER", name: "AI Inference Accelerators", segment: "AI", revenue_per_unit: 18000 },
  { code: "DC_GPU", name: "Data Center GPUs", segment: "Data Center", revenue_per_unit: 14000 },
  { code: "ENT_GPU", name: "Enterprise Compute GPUs", segment: "Enterprise", revenue_per_unit: 7500 },
  { code: "NET_SYS", name: "Networking Systems", segment: "Networking", revenue_per_unit: 22000 },
  { code: "DGX_SYS", name: "DGX-Class Systems", segment: "Systems", revenue_per_unit: 250000 },
  { code: "HSCALE", name: "Hyperscaler Programs", segment: "Cloud", revenue_per_unit: 45000 },
  { code: "CLOUD_INFRA", name: "Cloud Infrastructure Deployments", segment: "Cloud", revenue_per_unit: 36000 },
  { code: "AV_PLAT", name: "Autonomous Vehicle Platforms", segment: "Automotive", revenue_per_unit: 5200 },
  { code: "EDGE_AI", name: "Edge AI Platforms", segment: "Edge", revenue_per_unit: 1800 },
  { code: "PRO_VIZ", name: "Professional Visualization Systems", segment: "ProViz", revenue_per_unit: 4400 },
  { code: "GAMING", name: "Gaming GPUs", segment: "Gaming", revenue_per_unit: 850 },
];

const MEMORY_TECHS = [
  { code: "HBM3", name: "HBM3", generation: "HBM" },
  { code: "HBM3E", name: "HBM3E", generation: "HBM" },
  { code: "HBM4", name: "HBM4", generation: "HBM" },
  { code: "HBM4E", name: "HBM4E", generation: "HBM" },
  { code: "GDDR6", name: "GDDR6", generation: "GDDR" },
  { code: "GDDR6X", name: "GDDR6X", generation: "GDDR" },
  { code: "GDDR7", name: "GDDR7", generation: "GDDR" },
  { code: "LPDDR5", name: "LPDDR5", generation: "LPDDR" },
  { code: "LPDDR5X", name: "LPDDR5X", generation: "LPDDR" },
  { code: "DDR5", name: "DDR5", generation: "DDR" },
];

const SUPPLIERS = [
  { code: "AMS_A", name: "Advanced Memory Supplier A", supplier_type: "Advanced Memory", region: "APAC", risk_baseline: 0.18 },
  { code: "AMS_B", name: "Advanced Memory Supplier B", supplier_type: "Advanced Memory", region: "APAC", risk_baseline: 0.22 },
  { code: "AMS_C", name: "Advanced Memory Supplier C", supplier_type: "Advanced Memory", region: "APAC", risk_baseline: 0.28 },
  { code: "CMS_D", name: "Commodity Memory Supplier D", supplier_type: "Commodity Memory", region: "APAC", risk_baseline: 0.25 },
  { code: "CMS_E", name: "Commodity Memory Supplier E", supplier_type: "Commodity Memory", region: "EMEA", risk_baseline: 0.30 },
  { code: "CMS_F", name: "Commodity Memory Supplier F", supplier_type: "Commodity Memory", region: "Americas", risk_baseline: 0.27 },
  { code: "PKG_G", name: "Packaging Partner G", supplier_type: "Packaging", region: "APAC", risk_baseline: 0.35 },
  { code: "PKG_H", name: "Packaging Partner H", supplier_type: "Packaging", region: "APAC", risk_baseline: 0.32 },
  { code: "SUB_I", name: "Substrate Partner I", supplier_type: "Substrate", region: "APAC", risk_baseline: 0.40 },
  { code: "SUB_J", name: "Substrate Partner J", supplier_type: "Substrate", region: "EMEA", risk_baseline: 0.38 },
  { code: "STR_K", name: "Strategic Supplier K", supplier_type: "Strategic", region: "APAC", risk_baseline: 0.15 },
  { code: "STR_L", name: "Strategic Supplier L", supplier_type: "Strategic", region: "Americas", risk_baseline: 0.20 },
];

const CUSTOMER_SEGMENTS = [
  "Hyperscalers", "Cloud Providers", "Enterprise Customers", "OEM Partners",
  "Channel Partners", "Automotive Customers", "Government Programs",
];

const REGIONS = ["Americas", "EMEA", "APAC", "China"];

const PLANNING_VERSIONS = ["Baseline", "Consensus", "Upside", "Downside", "Executive Commit"];

const RISK_CATEGORIES = [
  "Capacity Constraint", "Yield Degradation", "Supplier Concentration",
  "Geopolitical Risk", "Logistics Delay", "Quality Event",
  "Packaging Bottleneck", "Substrate Bottleneck", "Demand Surge",
  "NPI Ramp Risk", "Forecast Error Risk", "Inventory Shortage Risk",
];

const SCENARIO_TEMPLATES = [
  {
    code: "SUPPLIER_OUTAGE",
    name: "Advanced Memory Supplier Factory Outage",
    description: "Major capacity loss at a primary advanced-memory fab.",
    lever: "supplier_capacity_reduction",
    magnitude: -0.6,
    scope: { supplier: "AMS_A" },
    duration_weeks: 8,
    narrative: "Fab outage at Advanced Memory Supplier A cuts HBM3E and HBM4 output by 60% for 8 weeks. Allocation pressure cascades to top AI accelerator programs.",
    sort_order: 1,
  },
  {
    code: "YIELD_DEGRADATION",
    name: "Yield Degradation Event",
    description: "HBM3E line yields collapse on a critical node.",
    lever: "yield_degradation",
    magnitude: -0.25,
    scope: { memory_tech: "HBM3E" },
    duration_weeks: 12,
    narrative: "Process-variation event drops HBM3E yields by 25% for 12 weeks. Effective supply shrinks across all suppliers.",
    sort_order: 2,
  },
  {
    code: "HYPERSCALER_SURGE",
    name: "Hyperscaler Demand Surge",
    description: "Top hyperscalers pull in CY orders by 2 quarters.",
    lever: "demand_surge",
    magnitude: 0.4,
    scope: { segment: "Hyperscalers" },
    duration_weeks: 26,
    narrative: "Hyperscalers raise AI capex guidance and pull in demand by 40% for 2 quarters. Available capacity is the binding constraint.",
    sort_order: 3,
  },
  {
    code: "AI_LAUNCH_SPIKE",
    name: "AI Accelerator Launch Spike",
    description: "New AI accelerator program ramps faster than plan.",
    lever: "demand_surge",
    magnitude: 0.55,
    scope: { product_family: "AI_TRAIN" },
    duration_weeks: 26,
    narrative: "Flagship AI training accelerator launch ramps 55% above plan. HBM3E and substrate quickly become bottlenecks.",
    sort_order: 4,
  },
  {
    code: "LOGISTICS_DELAY",
    name: "Logistics Disruption",
    description: "APAC → Americas logistics adds 4 weeks of lead time.",
    lever: "lead_time_increase",
    magnitude: 4,
    scope: { region: "Americas" },
    duration_weeks: 10,
    narrative: "Port congestion and air-freight tightening adds 4 weeks to APAC → Americas lead times. Inventory burns down before replenishment lands.",
    sort_order: 5,
  },
  {
    code: "GEO_RESTRICTION",
    name: "Geopolitical Restriction",
    description: "Export controls cut allocation to a major region.",
    lever: "allocation_shift",
    magnitude: -0.5,
    scope: { region: "China" },
    duration_weeks: 26,
    narrative: "Tightened export controls reduce supplier allocation into China by 50% for 6 months. Demand reallocated; revenue at risk in affected programs.",
    sort_order: 6,
  },
  {
    code: "PACKAGING_CONSTRAINT",
    name: "Packaging Capacity Constraint",
    description: "Advanced packaging capacity drops at Partner G.",
    lever: "supplier_capacity_reduction",
    magnitude: -0.35,
    scope: { supplier: "PKG_G" },
    duration_weeks: 16,
    narrative: "Packaging Partner G loses 35% advanced packaging capacity for 16 weeks. HBM-based programs slip until alternate flow qualifies.",
    sort_order: 7,
  },
  {
    code: "SUBSTRATE_SHORTAGE",
    name: "Substrate Shortage",
    description: "Substrate constraint hits both qualified partners.",
    lever: "supplier_capacity_reduction",
    magnitude: -0.30,
    scope: { supplier_type: "Substrate" },
    duration_weeks: 20,
    narrative: "Both substrate partners I and J report 30% capacity loss for 20 weeks. Top of plan must be re-cut by program.",
    sort_order: 8,
  },
];

export interface SeedSummary {
  ref: Record<string, number>;
  planning: Record<string, number>;
}

export async function seedDatabase(): Promise<SeedSummary> {
  const clear = [
    "scenario_timeline_points", "scenario_simulations", "scenario_templates",
    "copilot_messages", "test_runs", "executive_summaries",
    "shortage_events", "forecast_variance", "risk_events",
    "supplier_allocations", "purchase_orders", "inventory",
    "supplier_capacity", "demand_forecasts",
    "fiscal_periods", "planning_versions", "regions",
    "customer_segments", "suppliers", "memory_technologies", "product_families",
  ];
  for (const t of clear) {
    await db.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const insertRet = async <T,>(table: string, rows: T[]) => {
    const { data, error } = await db.from(table).insert(rows as never).select();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data ?? [];
  };

  const families = await insertRet(
    "product_families",
    PRODUCT_FAMILIES.map((p, i) => ({ ...p, sort_order: i }))
  );
  const techs = await insertRet(
    "memory_technologies",
    MEMORY_TECHS.map((m, i) => ({ ...m, sort_order: i }))
  );
  const suppliers = await insertRet(
    "suppliers",
    SUPPLIERS.map((s, i) => ({ ...s, sort_order: i }))
  );
  const segments = await insertRet(
    "customer_segments",
    CUSTOMER_SEGMENTS.map((name, i) => ({ code: name.toUpperCase().replace(/ /g, "_"), name, sort_order: i }))
  );
  const regions = await insertRet(
    "regions",
    REGIONS.map((name, i) => ({ code: name.toUpperCase(), name, sort_order: i }))
  );
  const versions = await insertRet(
    "planning_versions",
    PLANNING_VERSIONS.map((name, i) => ({ code: name.toUpperCase().replace(/ /g, "_"), name, sort_order: i }))
  );

  const today = new Date();
  const monthRows: Array<Record<string, unknown>> = [];
  for (let offset = -12; offset < 24; offset++) {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const fy = d.getFullYear();
    const fq = Math.floor(d.getMonth() / 3) + 1;
    monthRows.push({
      period_code: `FY${fy}-M${String(d.getMonth() + 1).padStart(2, "0")}`,
      period_type: "month",
      start_date: d.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      fiscal_year: fy,
      fiscal_quarter: fq,
      sort_order: offset + 12,
    });
  }
  const months = await insertRet("fiscal_periods", monthRows);

  const futureMonths = months.filter((m) => new Date(m.start_date) >= new Date(today.getFullYear(), today.getMonth(), 1));
  const consensusVersion = versions.find((v) => v.code === "CONSENSUS")!;

  const forecasts: Array<Record<string, unknown>> = [];
  for (const family of families) {
    for (const tech of techs.slice(0, 5)) {
      for (const segment of segments.slice(0, 4)) {
        for (const region of regions) {
          for (const period of futureMonths.slice(0, 6)) {
            const baseUnits = range(800, 12000) * (family.revenue_per_unit > 20000 ? 0.4 : 1.0);
            forecasts.push({
              product_family_id: family.id,
              memory_technology_id: tech.id,
              customer_segment_id: segment.id,
              region_id: region.id,
              planning_version_id: consensusVersion.id,
              fiscal_period_id: period.id,
              forecast_units: Math.round(baseUnits),
              forecast_confidence: Number(range(0.55, 0.95).toFixed(2)),
            });
          }
        }
      }
    }
  }
  await insertChunks("demand_forecasts", forecasts, 500);

  const capacityRows: Array<Record<string, unknown>> = [];
  for (const sup of suppliers) {
    for (const tech of techs) {
      const isHbm = tech.code.startsWith("HBM");
      const isAdv = sup.supplier_type === "Advanced Memory" || sup.supplier_type === "Strategic";
      const isCommodity = sup.supplier_type === "Commodity Memory";
      const isPkgSub = sup.supplier_type === "Packaging" || sup.supplier_type === "Substrate";
      if (isHbm && !isAdv && !isPkgSub) continue;
      if (!isHbm && !isCommodity && !isPkgSub && !isAdv) continue;
      for (const period of months) {
        const cap = range(20000, 90000);
        const committed = cap * range(0.55, 0.92);
        capacityRows.push({
          supplier_id: sup.id,
          memory_technology_id: tech.id,
          fiscal_period_id: period.id,
          committed_capacity_units: Math.round(committed),
          available_capacity_units: Math.round(cap - committed),
          lead_time_weeks: Number(range(6, 16).toFixed(1)),
          yield_risk_percent: Number(range(2, 12).toFixed(1)),
          moq: 1000 * intRange(1, 10),
        });
      }
    }
  }
  await insertChunks("supplier_capacity", capacityRows, 500);

  const invRows: Array<Record<string, unknown>> = [];
  for (const family of families) {
    for (const tech of techs.slice(0, 4)) {
      for (const region of regions) {
        const units = Math.round(range(2000, 60000));
        invRows.push({
          product_family_id: family.id,
          memory_technology_id: tech.id,
          region_id: region.id,
          inventory_units: units,
          safety_stock_units: Math.round(units * range(0.15, 0.4)),
        });
      }
    }
  }
  await insertChunks("inventory", invRows, 500);

  const poRows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 500; i++) {
    const sup = pick(suppliers);
    const tech = pick(techs);
    const family = pick(families);
    const days = intRange(7, 120);
    const arr = new Date(today.getTime() + days * 86400000);
    poRows.push({
      supplier_id: sup.id,
      memory_technology_id: tech.id,
      product_family_id: family.id,
      quantity: Math.round(range(2000, 50000)),
      expected_arrival_date: arr.toISOString().slice(0, 10),
      status: pick(["open", "open", "open", "shipped", "received"]),
      expedite_cost: Math.round(range(0, 250000)),
    });
  }
  await insertChunks("purchase_orders", poRows, 500);

  const allocRows: Array<Record<string, unknown>> = [];
  for (const family of families) {
    const eligibleSups = suppliers.filter(
      (s) => s.supplier_type === "Advanced Memory" || s.supplier_type === "Strategic" || s.supplier_type === "Commodity Memory"
    );
    let remaining = 100;
    const selected = eligibleSups.slice(0, intRange(2, 4));
    selected.forEach((sup, idx) => {
      const tech = pick(techs);
      const pct = idx === selected.length - 1 ? remaining : Math.round(range(15, 50));
      remaining -= pct;
      allocRows.push({
        supplier_id: sup.id,
        product_family_id: family.id,
        memory_technology_id: tech.id,
        allocation_percent: Math.max(0, pct),
        fiscal_period_id: futureMonths[0].id,
      });
    });
  }
  await insertChunks("supplier_allocations", allocRows, 500);

  const riskRows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 300; i++) {
    const cat = pick(RISK_CATEGORIES);
    const sup = pick(suppliers);
    const family = pick(families);
    const tech = pick(techs);
    const sev = pick(["low", "medium", "medium", "high", "high", "critical"]);
    const impact = Math.round(range(1000, 50000));
    riskRows.push({
      category: cat,
      severity: sev,
      supplier_id: sup.id,
      product_family_id: family.id,
      memory_technology_id: tech.id,
      description: `${cat} affecting ${family.name} (${tech.name}) via ${sup.name}.`,
      impact_units: impact,
      revenue_at_risk: Math.round(impact * (family.revenue_per_unit as number) * range(0.05, 0.4)),
      status: pick(["open", "open", "open", "mitigating", "closed"]),
      event_date: new Date(today.getTime() - intRange(0, 90) * 86400000).toISOString().slice(0, 10),
    });
  }
  await insertChunks("risk_events", riskRows, 500);

  const varianceRows: Array<Record<string, unknown>> = [];
  const pastMonths = months.filter((m) => new Date(m.end_date) < today);
  for (let i = 0; i < 250; i++) {
    const family = pick(families);
    const period = pick(pastMonths);
    const forecast = Math.round(range(5000, 60000));
    const variancePct = Number(range(-0.3, 0.3).toFixed(3));
    const actual = Math.round(forecast * (1 + variancePct));
    varianceRows.push({
      product_family_id: family.id,
      fiscal_period_id: period.id,
      planning_version_id: consensusVersion.id,
      forecast_units: forecast,
      actual_units: actual,
      variance_percent: variancePct,
    });
  }
  await insertChunks("forecast_variance", varianceRows, 500);

  const shortageRows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 150; i++) {
    const family = pick(families);
    const tech = pick(techs);
    const period = pick(futureMonths);
    const units = Math.round(range(500, 25000));
    shortageRows.push({
      product_family_id: family.id,
      memory_technology_id: tech.id,
      fiscal_period_id: period.id,
      shortage_units: units,
      severity: pick(["low", "medium", "medium", "high", "high", "critical"]),
      status: pick(["open", "open", "open", "mitigating", "resolved"]),
    });
  }
  await insertChunks("shortage_events", shortageRows, 500);

  await insertRet("scenario_templates", SCENARIO_TEMPLATES);

  const summRows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 24; i++) {
    summRows.push({
      period: `Week ${24 - i}`,
      summary: `Supply position remains tight on HBM3E and HBM4 driven by AI accelerator demand. Hyperscaler pull-ins create downside risk on consensus plan. Top supplier exposure: Advanced Memory Supplier A.`,
      top_risk: pick(["HBM3E yield degradation", "Substrate constraint at Partner I", "Packaging capacity at Partner G", "Hyperscaler pull-in pressure"]),
      top_action: pick(["Expedite HBM3E POs at AMS_B", "Qualify alternate substrate flow", "Lock allocation with strategic supplier", "Re-cut top of plan for AI Training"]),
      revenue_at_risk: Math.round(range(120, 850) * 1_000_000),
    });
  }
  await insertChunks("executive_summaries", summRows, 500);

  return {
    ref: {
      product_families: families.length,
      memory_technologies: techs.length,
      suppliers: suppliers.length,
      customer_segments: segments.length,
      regions: regions.length,
      fiscal_periods: months.length,
      planning_versions: versions.length,
      scenario_templates: SCENARIO_TEMPLATES.length,
    },
    planning: {
      demand_forecasts: forecasts.length,
      supplier_capacity: capacityRows.length,
      inventory: invRows.length,
      purchase_orders: poRows.length,
      supplier_allocations: allocRows.length,
      risk_events: riskRows.length,
      forecast_variance: varianceRows.length,
      shortage_events: shortageRows.length,
      executive_summaries: summRows.length,
    },
  };
}

async function insertChunks(table: string, rows: Array<Record<string, unknown>>, chunkSize: number) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await db.from(table).insert(slice as never);
    if (error) throw new Error(`${table} chunk ${i}: ${error.message}`);
  }
}
