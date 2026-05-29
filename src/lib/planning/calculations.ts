/**
 * Core planning calculations for the Memory Supply Control Tower.
 * Pure functions — no I/O, fully unit-testable.
 */

export function projectedShortage(
  demand: number,
  inventory: number,
  confirmedSupply: number,
  openPOs: number
): number {
  return Math.max(0, demand - inventory - confirmedSupply - openPOs);
}

export function weeksOfSupply(
  inventory: number,
  averageWeeklyDemand: number
): number {
  if (averageWeeklyDemand <= 0) return inventory > 0 ? 99 : 0;
  return inventory / averageWeeklyDemand;
}

export function purchaseRecommendation(
  demand: number,
  safetyStock: number,
  inventory: number,
  confirmedSupply: number,
  openPOs: number
): number {
  return Math.max(
    0,
    demand + safetyStock - inventory - confirmedSupply - openPOs
  );
}

/**
 * Herfindahl-style concentration. Returns 0..1 — higher = more concentrated.
 */
export function supplierConcentration(
  allocationPercents: number[]
): number {
  if (!allocationPercents.length) return 0;
  const total = allocationPercents.reduce((s, v) => s + v, 0) || 1;
  return allocationPercents
    .map((p) => (p / total) ** 2)
    .reduce((s, v) => s + v, 0);
}

export function riskScore(input: {
  shortageSeverity: number; // 0..1
  leadTimeRisk: number;     // 0..1
  concentration: number;    // 0..1
  forecastVolatility: number; // 0..1
}): number {
  const { shortageSeverity, leadTimeRisk, concentration, forecastVolatility } = input;
  // weighted blend, scaled to 0..100
  return Math.round(
    (shortageSeverity * 0.40 +
      leadTimeRisk * 0.20 +
      concentration * 0.20 +
      forecastVolatility * 0.20) * 100
  );
}

export function revenueAtRisk(
  shortageUnits: number,
  revenuePerUnit: number
): number {
  return Math.max(0, shortageUnits) * Math.max(0, revenuePerUnit);
}

/**
 * Planning Intelligence Score — composite 0..100.
 * Higher = healthier plan.
 */
export interface PISInput {
  shortageRisk: number;        // 0..1 (higher = worse)
  inventoryHealth: number;     // 0..1 (1 = at target WoS, 0 = stockout)
  supplierConcentration: number; // 0..1 (higher = worse)
  forecastConfidence: number;  // 0..1 (higher = better)
  purchaseReadiness: number;   // 0..1 (higher = better)
}

export interface PISResult {
  score: number;
  subScores: {
    shortage: number;
    inventory: number;
    concentration: number;
    confidence: number;
    purchasing: number;
  };
}

export function planningIntelligenceScore(input: PISInput): PISResult {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const shortage = (1 - clamp(input.shortageRisk)) * 100;
  const inventory = clamp(input.inventoryHealth) * 100;
  const concentration = (1 - clamp(input.supplierConcentration)) * 100;
  const confidence = clamp(input.forecastConfidence) * 100;
  const purchasing = clamp(input.purchaseReadiness) * 100;

  const score = Math.round(
    shortage * 0.25 +
      inventory * 0.20 +
      concentration * 0.20 +
      confidence * 0.20 +
      purchasing * 0.15
  );

  return {
    score,
    subScores: {
      shortage: Math.round(shortage),
      inventory: Math.round(inventory),
      concentration: Math.round(concentration),
      confidence: Math.round(confidence),
      purchasing: Math.round(purchasing),
    },
  };
}

export function severityFromShortagePct(pct: number): "low" | "medium" | "high" | "critical" {
  if (pct >= 0.5) return "critical";
  if (pct >= 0.25) return "high";
  if (pct >= 0.1) return "medium";
  return "low";
}
