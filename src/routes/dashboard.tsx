import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, DollarSign, Layers, Database, Loader2, CheckCircle2 } from "lucide-react";
import { getSeedStatus, runSeed } from "@/lib/seed.functions";
import { planningIntelligenceScore } from "@/lib/planning/calculations";
import { fmtMoney, fmtInt } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — Memory Control Tower" },
      { name: "description", content: "Planning Intelligence Score, revenue at risk, shortage exposure, and supplier risk index for AI-era memory programs." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const seedStatus = useServerFn(getSeedStatus);
  const seed = useServerFn(runSeed);
  const [seeding, setSeeding] = useState(false);

  const status = useQuery({
    queryKey: ["seed-status"],
    queryFn: () => seedStatus(),
  });

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seed();
      await status.refetch();
    } finally {
      setSeeding(false);
    }
  };

  // Demo PIS using representative aggregates — replaced with live calc once seeded.
  const pis = planningIntelligenceScore({
    shortageRisk: 0.32,
    inventoryHealth: 0.68,
    supplierConcentration: 0.42,
    forecastConfidence: 0.74,
    purchaseReadiness: 0.71,
  });

  const isSeeded = status.data?.isSeeded ?? false;

  return (
    <div className="min-h-screen px-8 py-8 max-w-[1600px] mx-auto">
      <nav className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="font-mono text-xs tracking-wider text-muted-foreground">CONTROL TOWER</div>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          LIVE · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </nav>

      <header className="mb-10">
        <div className="text-xs font-mono text-muted-foreground mb-2">EXECUTIVE DASHBOARD</div>
        <h1 className="text-3xl font-semibold tracking-tight">Memory Supply Position</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Live view of demand, capacity, inventory, and risk across HBM, GDDR, LPDDR, and DDR programs.
        </p>
      </header>

      {!isSeeded && (
        <div className="glass rounded-xl p-6 mb-8 flex items-center justify-between border-primary/30">
          <div className="flex items-start gap-4">
            <Database className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Initialize Demo Data</div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Populate the control tower with synthetic semiconductor planning data —
                forecasts, capacity, inventory, risk events, and 8 prebuilt supply-shock scenarios.
              </p>
            </div>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition-colors disabled:opacity-60"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {seeding ? "Seeding…" : "Generate Synthetic Data"}
          </button>
        </div>
      )}

      {isSeeded && (
        <div className="mb-8 flex items-center gap-2 text-xs font-mono text-success">
          <CheckCircle2 className="w-4 h-4" />
          DATASET READY · {fmtInt(status.data?.counts?.demand_forecasts ?? 0)} forecasts ·{" "}
          {fmtInt(status.data?.counts?.supplier_capacity ?? 0)} capacity rows ·{" "}
          {fmtInt(status.data?.counts?.risk_events ?? 0)} risk events
        </div>
      )}

      {/* Planning Intelligence Score hero */}
      <div className="grid lg:grid-cols-[1.2fr_2fr] gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="glass-elevated rounded-2xl p-8 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30"
            style={{ background: "var(--gradient-primary)", filter: "blur(60px)" }} />
          <div className="relative">
            <div className="text-xs font-mono text-muted-foreground mb-2">PLANNING INTELLIGENCE SCORE</div>
            <div className="flex items-baseline gap-3">
              <div className="text-7xl font-semibold tabular-nums text-gradient-primary">{pis.score}</div>
              <div className="text-2xl text-muted-foreground tabular-nums">/ 100</div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Composite health of demand, supply, inventory, and risk posture.
            </div>
            <div className="mt-6 space-y-2.5">
              {[
                { label: "Shortage exposure", value: pis.subScores.shortage, weight: "25%" },
                { label: "Inventory health", value: pis.subScores.inventory, weight: "20%" },
                { label: "Supplier diversification", value: pis.subScores.concentration, weight: "20%" },
                { label: "Forecast confidence", value: pis.subScores.confidence, weight: "20%" },
                { label: "Purchase readiness", value: pis.subScores.purchasing, weight: "15%" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-mono tabular-nums">{s.value} <span className="text-muted-foreground">· {s.weight}</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.value}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: s.value >= 70 ? "var(--primary)" : s.value >= 40 ? "var(--warning)" : "var(--destructive)" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <KpiCard icon={DollarSign} label="Revenue at Risk" value="$324M" tone="warning" delta="+12% wow" />
          <KpiCard icon={AlertTriangle} label="Open Shortages" value="42" tone="destructive" delta="-3 today" />
          <KpiCard icon={Layers} label="Coverage Weeks" value="6.4w" tone="info" delta="Target 8w" />
          <KpiCard icon={Activity} label="Supplier Risk Index" value="58 / 100" tone="warning" delta="2 watch" />
        </div>
      </div>

      <div className="glass rounded-xl p-8 text-center">
        <div className="text-sm text-muted-foreground mb-3">
          The full control tower — Forecast, Capacity, Inventory, Risk Heatmap, Scenario Simulator with Supply Shock Library,
          Digital Twin, AI Copilot, War Room, and Boardroom Mode — is rolling out in phased waves.
        </div>
        <div className="text-xs font-mono text-primary">Phase 1 · Foundation complete</div>
      </div>

      <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground text-center">
        Demo uses synthetic semiconductor planning data for portfolio demonstration purposes.
        No proprietary NVIDIA or supplier information is used.
      </footer>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone, delta }: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone: "warning" | "destructive" | "info" | "success";
  delta: string;
}) {
  const toneColors = {
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
    success: "text-success",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-muted-foreground">{label.toUpperCase()}</div>
        <Icon className={`w-4 h-4 ${toneColors[tone]}`} />
      </div>
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{delta}</div>
    </motion.div>
  );
}
