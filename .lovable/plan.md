# AI Memory Supply Control Tower — Build Plan (v2)

A dark, NVIDIA-inspired executive command center for semiconductor memory planning. Built on TanStack Start + Lovable Cloud (Supabase) + Lovable AI Gateway, with synthetic data only.

## Key enhancements (v2)

1. **Supply Shock Library** — prebuilt scenario templates one-click to load.
2. **Executive Decision Timeline** — every simulation produces Day 0/15/30/60/90 + Recovery estimate, visualized.
3. **Demo Access** — "Enter Demo Command Center" button, no signup. Auto-provisions an anonymous demo session.
4. **Planning Intelligence Score (PIS)** — composite KPI featured on Executive Dashboard.
5. **Phased delivery** in 5 waves.

---

## Foundation

- Enable **Lovable Cloud** (Supabase) + **Lovable AI Gateway** (LOVABLE_API_KEY).
- Design system in `src/styles.css`: graphite/black surfaces, NVIDIA-green accent (oklch), glassmorphism cards, premium type (Inter + JetBrains Mono), spring motion tokens.
- Shell: collapsible left nav, KPI top strip, Cmd-K palette, "Activate Executive Review Mode" toggle, footer disclaimer on every page.
- **Demo Access**: landing page CTA "Enter Demo Command Center" → calls `enterDemo` server fn that signs in (or creates on first use) a shared demo account via Supabase admin, then navigates to `/`. No signup screens. RLS policies allow that demo user to read/write planning tables; destructive actions scoped to demo sandbox rows.

## Data Model (Supabase)

Tables with RLS + GRANTs:
- Reference: `product_families`, `memory_technologies`, `suppliers`, `customer_segments`, `regions`, `fiscal_periods`, `planning_versions`
- Planning: `demand_forecasts` (1,000+), `supplier_capacity` (1,000+), `inventory` (500+), `purchase_orders` (500+)
- Risk: `risk_events` (300+), `forecast_variance` (250+), `shortage_events` (150+), `supplier_allocations` (100+)
- Sim: `scenario_templates` (8 prebuilt), `scenario_simulations` (100+ seeded + user runs), `scenario_timeline_points` (6 per sim), `executive_summaries` (100+)
- Ops: `app_settings`, `test_runs`, `copilot_messages`

Deterministic synthetic seed across 36 months × 12 quarters × 3 fiscal years, all listed product families/memory techs/suppliers/segments/regions/versions. Names use generic spec labels (e.g. "Advanced Memory Supplier A"); no NVIDIA-proprietary data.

## Core Calculations (`src/lib/planning/`)

Pure TS, unit-tested:
- `projectedShortage`, `weeksOfSupply`, `purchaseRecommendation`, `supplierConcentration`, `riskScore`, `revenueAtRisk`
- **`planningIntelligenceScore`** — 0–100 composite:
  - 25% shortage risk (lower = better)
  - 20% inventory health (WoS vs target)
  - 20% supplier concentration (Herfindahl-style)
  - 20% forecast confidence (weighted avg)
  - 15% purchase readiness (open POs vs recommended)
  - Returns score + sub-scores + delta vs prior period.

## Supply Shock Library (8 templates)

Seeded in `scenario_templates`:
1. Advanced Memory Supplier Factory Outage (Supplier A, -60% capacity, 8 weeks)
2. Yield Degradation Event (HBM3E, -25% yield, 12 weeks)
3. Hyperscaler Demand Surge (Hyperscaler segment, +40% demand, 2 quarters)
4. AI Accelerator Launch Spike (AI Training Accelerators, +55% demand ramp, 6 months)
5. Logistics Disruption (APAC→Americas, +4 wks lead time, 10 weeks)
6. Geopolitical Restriction (China region allocation -50%, 6 months)
7. Packaging Capacity Constraint (Packaging Partner G, -35% capacity, 16 weeks)
8. Substrate Shortage (Substrate Partners I+J, -30% capacity, 20 weeks)

Each template carries lever, magnitude, scope, duration, narrative — one-click loads into Scenario Simulator. Users can still customize before running.

## Scenario Engine

`runScenario({templateId?, lever, magnitude, scope, duration})`:
1. Snapshot affected rows.
2. Apply lever math across horizon.
3. Recompute shortages, WoS, risk, revenue-at-risk.
4. Generate causality chain (Supplier → Supply → Inventory → Shortage → Risk → Revenue → Actions) for animated playback.
5. Generate **Executive Decision Timeline**: Day 0 / 15 / 30 / 60 / 90 + Recovery estimate. Each point = {date, headline metric deltas, top action, narrative}. Recovery = weeks until shortage clears given recommended actions.
6. AI narrative summary via Lovable AI (fallback to rule-based).
7. Persist to `scenario_simulations` + `scenario_timeline_points`.

UI: horizontal timeline rail with milestone nodes, KPI sparkline per node, hover → narrative panel; animates left-to-right after a run.

## Modules / Routes

1. `/` **Executive Dashboard** — **Planning Intelligence Score hero** (gauge + sub-score breakdown + trend), glass KPIs (Revenue at Risk, Open Shortages, Coverage Weeks, Supplier Risk Index), top risks, demand-vs-supply chart, action queue.
2. `/forecast` Demand Forecast Planner — editable pivot, variance, confidence bands.
3. `/capacity` Supplier Capacity Planner — committed vs available, allocation %, lead time, MOQ.
4. `/inventory` Inventory Coverage Tracker — WoS heatmap, safety-stock breaches.
5. `/purchasing` Purchase Recommendation Engine — formula-driven PO suggestions, approve writes row.
6. `/risk` Risk Heatmap — category × product family matrix.
7. `/scenarios` Scenario Simulator — **Supply Shock Library** panel on left, custom levers on right, animated causality + **Executive Decision Timeline** below.
8. `/twin` Mission-Control Digital Twin — force-directed network with animated disruption flows.
9. `/copilot` AI Strategic Copilot — Lovable AI Gateway chat grounded with live aggregates; streaming, markdown, fallback.
10. `/war-room` Executive War Room — oversized KPIs, top risks/actions, revenue-at-risk waterfall, AI narrative.
11. `/present` Boardroom Presentation Mode — full-screen keyboard-navigated slides from live data.
12. `/data-quality` Data Quality Center — null/range/orphan/freshness/duplicate checks.
13. `/tests` Test Center — DB, seed, formulas (golden cases for PIS + shortage + WoS + recommendation), simulator end-to-end, validations, chart smoke, AI fallback. Pass/fail with timings.
14. `/case-study` Resume Case Study — problem, architecture, planning logic, data model, scenario engine, validation/testing, business impact, disclaimer.

Footer disclaimer on every page: synthetic-data statement.

## Validation & Edge Cases

- Zod schemas, required/numeric/date/range/duplicate, loading + success + error states (sonner).
- Defensive UI: empty states, error boundaries, negative-inventory guards, missing-data placeholders, AI/chart fallbacks, refresh-during-sim safety.

## Motion

Framer Motion springs for KPI updates, panel transitions, scenario propagation, timeline reveal. Restrained, executive feel.

---

## Phased Implementation

**Phase 1 — Foundation**
Enable Cloud + AI Gateway · design tokens + shell · schema migrations · synthetic seed · demo-access flow · Executive Dashboard with **Planning Intelligence Score** + core KPIs.

**Phase 2 — Planning Core**
Forecast · Capacity · Inventory · Purchasing.

**Phase 3 — Risk & Simulation**
Risk Heatmap · Scenario Engine + **Supply Shock Library** + **Executive Decision Timeline** · Digital Twin.

**Phase 4 — Executive Layer**
AI Copilot · War Room · Boardroom Presentation Mode.

**Phase 5 — Quality & Story**
Data Quality Center · Test Center · Case Study · final polish pass (animations, empty states, copy, QA).

## Technical Notes

- Stack: TanStack Start, TanStack Query, Tailwind v4, shadcn/ui, Framer Motion, Recharts, Lovable Cloud (Supabase), Lovable AI Gateway (default `google/gemini-2.5-flash`).
- Auth: Demo Access auto-signs in shared demo account; data reads/writes via `createServerFn` (+ `requireSupabaseAuth` for user-scoped, `supabaseAdmin` for seed/aggregates/demo provisioning).
- Routing: separate route per module with own `head()` meta.
- All numbers derive from formulas + seeded data — no hard-coded KPIs anywhere.

Ready to start Phase 1 on approval.