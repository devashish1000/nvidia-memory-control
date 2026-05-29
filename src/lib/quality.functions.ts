import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  projectedShortage,
  weeksOfSupply,
  purchaseRecommendation,
  supplierConcentration,
  riskScore,
  revenueAtRisk,
  planningIntelligenceScore,
  severityFromShortagePct,
} from "./planning/calculations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabaseAdmin;
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

type TestResult = { suite: string; name: string; passed: boolean; detail: string };

function approx(a: number, b: number, tol = 1e-6) {
  return Math.abs(a - b) <= tol;
}

function runCalculationTests(): TestResult[] {
  const r: TestResult[] = [];
  const t = (suite: string, name: string, passed: boolean, detail: string) =>
    r.push({ suite, name, passed, detail });

  // projectedShortage
  t("projectedShortage", "demand exceeds supply", projectedShortage(1000, 200, 300, 100) === 400, "1000 - 200 - 300 - 100 = 400");
  t("projectedShortage", "supply covers demand", projectedShortage(500, 200, 200, 200) === 0, "max(0, -100) = 0");
  t("projectedShortage", "zero demand", projectedShortage(0, 0, 0, 0) === 0, "no demand → no shortage");

  // weeksOfSupply
  t("weeksOfSupply", "normal", approx(weeksOfSupply(1000, 100), 10), "1000 / 100 = 10");
  t("weeksOfSupply", "zero demand with inventory", weeksOfSupply(500, 0) === 99, "capped at 99");
  t("weeksOfSupply", "zero everything", weeksOfSupply(0, 0) === 0, "no inv, no demand");

  // purchaseRecommendation
  t("purchaseRecommendation", "needs purchase", purchaseRecommendation(1000, 200, 100, 300, 100) === 700, "1000+200-100-300-100");
  t("purchaseRecommendation", "no purchase needed", purchaseRecommendation(100, 50, 200, 100, 50) === 0, "supply exceeds need");

  // supplierConcentration (HHI-style)
  t("supplierConcentration", "monopoly", approx(supplierConcentration([100]), 1), "single supplier = 1");
  t("supplierConcentration", "equal duopoly", approx(supplierConcentration([50, 50]), 0.5), "two equal = 0.5");
  t("supplierConcentration", "balanced quartet", approx(supplierConcentration([25, 25, 25, 25]), 0.25), "4 equal = 0.25");
  t("supplierConcentration", "empty", supplierConcentration([]) === 0, "no allocations = 0");

  // riskScore
  t("riskScore", "all max", riskScore({ shortageSeverity: 1, leadTimeRisk: 1, concentration: 1, forecastVolatility: 1 }) === 100, "weighted sum = 100");
  t("riskScore", "all zero", riskScore({ shortageSeverity: 0, leadTimeRisk: 0, concentration: 0, forecastVolatility: 0 }) === 0, "no risk");

  // revenueAtRisk
  t("revenueAtRisk", "standard", revenueAtRisk(1000, 50) === 50000, "1000 × $50");
  t("revenueAtRisk", "negative inputs", revenueAtRisk(-100, 50) === 0, "guarded against negatives");

  // planningIntelligenceScore
  const pisHealthy = planningIntelligenceScore({
    shortageRisk: 0, inventoryHealth: 1, supplierConcentration: 0.1, forecastConfidence: 0.9, purchaseReadiness: 1,
  });
  t("planningIntelligenceScore", "healthy plan ≥ 85", pisHealthy.score >= 85, `score=${pisHealthy.score}`);
  const pisDistressed = planningIntelligenceScore({
    shortageRisk: 0.9, inventoryHealth: 0.1, supplierConcentration: 0.9, forecastConfidence: 0.2, purchaseReadiness: 0.1,
  });
  t("planningIntelligenceScore", "distressed plan ≤ 30", pisDistressed.score <= 30, `score=${pisDistressed.score}`);
  t("planningIntelligenceScore", "subScores present", typeof pisHealthy.subScores.shortage === "number", "subScores object");

  // severity classification
  t("severity", "critical at 50%", severityFromShortagePct(0.5) === "critical", "≥0.5 → critical");
  t("severity", "high at 30%", severityFromShortagePct(0.3) === "high", "≥0.25 → high");
  t("severity", "medium at 15%", severityFromShortagePct(0.15) === "medium", "≥0.10 → medium");
  t("severity", "low at 5%", severityFromShortagePct(0.05) === "low", "<0.10 → low");

  return r;
}

async function runDataIntegrityTests(): Promise<TestResult[]> {
  const r: TestResult[] = [];
  const [families, techs, suppliers, periods, capacity, forecasts, inventory, allocs] = await Promise.all([
    db.from("product_families").select("id"),
    db.from("memory_technologies").select("id"),
    db.from("suppliers").select("id,risk_baseline"),
    db.from("fiscal_periods").select("id"),
    db.from("supplier_capacity").select("supplier_id,memory_technology_id,available_capacity_units,committed_capacity_units"),
    db.from("demand_forecasts").select("product_family_id,memory_technology_id,forecast_units,forecast_confidence"),
    db.from("inventory").select("inventory_units,safety_stock_units"),
    db.from("supplier_allocations").select("allocation_percent,product_family_id,fiscal_period_id"),
  ]);

  const F = families.data ?? [], T = techs.data ?? [], S = suppliers.data ?? [], P = periods.data ?? [];
  const C = capacity.data ?? [], FC = forecasts.data ?? [], IN = inventory.data ?? [], A = allocs.data ?? [];

  r.push({ suite: "seed", name: "product families present", passed: F.length > 0, detail: `${F.length} rows` });
  r.push({ suite: "seed", name: "memory technologies present", passed: T.length > 0, detail: `${T.length} rows` });
  r.push({ suite: "seed", name: "suppliers present", passed: S.length > 0, detail: `${S.length} rows` });
  r.push({ suite: "seed", name: "fiscal periods present", passed: P.length > 0, detail: `${P.length} rows` });
  r.push({ suite: "seed", name: "demand forecasts present", passed: FC.length > 0, detail: `${FC.length} rows` });
  r.push({ suite: "seed", name: "supplier capacity present", passed: C.length > 0, detail: `${C.length} rows` });

  const techIds = new Set(T.map((x: any) => x.id));
  const supIds = new Set(S.map((x: any) => x.id));
  const famIds = new Set(F.map((x: any) => x.id));

  const orphanCap = C.filter((c: any) => !techIds.has(c.memory_technology_id) || !supIds.has(c.supplier_id)).length;
  r.push({ suite: "integrity", name: "no orphan capacity rows", passed: orphanCap === 0, detail: `${orphanCap} orphans` });

  const orphanFc = FC.filter((f: any) => !famIds.has(f.product_family_id) || !techIds.has(f.memory_technology_id)).length;
  r.push({ suite: "integrity", name: "no orphan forecasts", passed: orphanFc === 0, detail: `${orphanFc} orphans` });

  const negCap = C.filter((c: any) => num(c.available_capacity_units) < 0 || num(c.committed_capacity_units) < 0).length;
  r.push({ suite: "integrity", name: "capacity is non-negative", passed: negCap === 0, detail: `${negCap} negatives` });

  const overCommit = C.filter((c: any) => num(c.committed_capacity_units) > num(c.available_capacity_units) * 1.01).length;
  r.push({ suite: "integrity", name: "committed ≤ available capacity", passed: overCommit === 0, detail: `${overCommit} over-committed rows` });

  const outOfRangeConf = FC.filter((f: any) => num(f.forecast_confidence) < 0 || num(f.forecast_confidence) > 1).length;
  r.push({ suite: "integrity", name: "forecast confidence in [0,1]", passed: outOfRangeConf === 0, detail: `${outOfRangeConf} out-of-range` });

  const negInv = IN.filter((i: any) => num(i.inventory_units) < 0).length;
  r.push({ suite: "integrity", name: "inventory is non-negative", passed: negInv === 0, detail: `${negInv} negatives` });

  // Allocation sums per (family, period) should be ~100
  const sums: Record<string, number> = {};
  for (const a of A) {
    const k = `${a.product_family_id}::${a.fiscal_period_id}`;
    sums[k] = (sums[k] ?? 0) + num(a.allocation_percent);
  }
  const badSums = Object.values(sums).filter((v) => Math.abs(v - 100) > 1).length;
  r.push({ suite: "integrity", name: "supplier allocations sum to 100", passed: badSums === 0, detail: `${badSums} groups off` });

  const badRisk = S.filter((s: any) => num(s.risk_baseline) < 0 || num(s.risk_baseline) > 1).length;
  r.push({ suite: "integrity", name: "supplier risk baseline in [0,1]", passed: badRisk === 0, detail: `${badRisk} out-of-range` });

  return r;
}

export const runAllTests = createServerFn({ method: "POST" }).handler(async () => {
  const results = [...runCalculationTests(), ...(await runDataIntegrityTests())];
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  // Persist a test run
  await db.from("test_runs").insert({ passed, failed, results });
  return { results, passed, failed };
});

export const getLatestTestRun = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db.from("test_runs").select("*").order("ran_at", { ascending: false }).limit(1);
  return data?.[0] ?? null;
});

// ===== Data Quality =====

type DQCheck = { domain: string; name: string; status: "pass" | "warn" | "fail"; count: number; detail: string };

export const getDataQualityReport = createServerFn({ method: "GET" }).handler(async () => {
  const [families, techs, suppliers, capacity, forecasts, inventory, allocs, risks, pos] = await Promise.all([
    db.from("product_families").select("id,code,name,revenue_per_unit"),
    db.from("memory_technologies").select("id,code,name"),
    db.from("suppliers").select("id,code,name,risk_baseline"),
    db.from("supplier_capacity").select("supplier_id,memory_technology_id,available_capacity_units,committed_capacity_units,lead_time_weeks,yield_risk_percent"),
    db.from("demand_forecasts").select("product_family_id,memory_technology_id,forecast_units,forecast_confidence"),
    db.from("inventory").select("inventory_units,safety_stock_units,memory_technology_id"),
    db.from("supplier_allocations").select("allocation_percent,product_family_id,fiscal_period_id"),
    db.from("risk_events").select("severity,status,revenue_at_risk"),
    db.from("purchase_orders").select("quantity,status,expected_arrival_date"),
  ]);

  const F = families.data ?? [], T = techs.data ?? [], S = suppliers.data ?? [];
  const C = capacity.data ?? [], FC = forecasts.data ?? [], IN = inventory.data ?? [];
  const A = allocs.data ?? [], R = risks.data ?? [], PO = pos.data ?? [];

  const checks: DQCheck[] = [];
  const push = (domain: string, name: string, count: number, max: number, detail: string) =>
    checks.push({
      domain, name, count, detail,
      status: count === 0 ? "pass" : count <= max ? "warn" : "fail",
    });

  // Completeness
  push("Completeness", "Families missing code", F.filter((x: any) => !x.code).length, 0, "code is required");
  push("Completeness", "Families with zero revenue", F.filter((x: any) => num(x.revenue_per_unit) <= 0).length, 0, "revenue_per_unit must be > 0");
  push("Completeness", "Technologies missing code", T.filter((x: any) => !x.code).length, 0, "code is required");
  push("Completeness", "Suppliers missing code", S.filter((x: any) => !x.code).length, 0, "code is required");

  // Range / validity
  push("Validity", "Forecast confidence out of [0,1]", FC.filter((f: any) => num(f.forecast_confidence) < 0 || num(f.forecast_confidence) > 1).length, 0, "confidence ∈ [0,1]");
  push("Validity", "Negative forecast units", FC.filter((f: any) => num(f.forecast_units) < 0).length, 0, "no negative demand");
  push("Validity", "Supplier risk baseline out of [0,1]", S.filter((s: any) => num(s.risk_baseline) < 0 || num(s.risk_baseline) > 1).length, 0, "risk ∈ [0,1]");
  push("Validity", "Negative inventory", IN.filter((i: any) => num(i.inventory_units) < 0).length, 0, "inventory ≥ 0");
  push("Validity", "Lead time out of range", C.filter((c: any) => num(c.lead_time_weeks) < 1 || num(c.lead_time_weeks) > 52).length, 0, "lead time 1–52 wks");
  push("Validity", "Yield risk out of [0,100]", C.filter((c: any) => num(c.yield_risk_percent) < 0 || num(c.yield_risk_percent) > 100).length, 0, "yield % 0–100");

  // Consistency
  push("Consistency", "Over-committed capacity", C.filter((c: any) => num(c.committed_capacity_units) > num(c.available_capacity_units) * 1.01).length, 0, "committed ≤ available");
  const sums: Record<string, number> = {};
  for (const a of A) {
    const k = `${a.product_family_id}::${a.fiscal_period_id}`;
    sums[k] = (sums[k] ?? 0) + num(a.allocation_percent);
  }
  push("Consistency", "Allocation groups not summing to 100", Object.values(sums).filter((v) => Math.abs(v - 100) > 1).length, 0, "must sum to 100");
  push("Consistency", "Safety stock above inventory", IN.filter((i: any) => num(i.safety_stock_units) > num(i.inventory_units) * 5).length, 5, "may be expected for hot SKUs");

  // Operations
  push("Operations", "Open risks without revenue impact", R.filter((x: any) => x.status === "open" && num(x.revenue_at_risk) === 0).length, 3, "needs revenue quantification");
  push("Operations", "Open POs with past arrival", PO.filter((p: any) => p.status === "open" && new Date(p.expected_arrival_date) < new Date()).length, 0, "needs reschedule or close");

  const passed = checks.filter((c) => c.status === "pass").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const score = Math.round((passed / Math.max(1, checks.length)) * 100);

  return { checks, passed, warned, failed, score, total: checks.length };
});
