import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, DollarSign, Layers, Database, Loader2, CheckCircle2 } from "lucide-react";
import { getSeedStatus, runSeed } from "@/lib/seed.functions";
import { getDashboardSnapshot } from "@/lib/analytics.functions";
import { fmtMoney, fmtInt, fmtWeeks } from "@/lib/format";
import { AppShell, PageHeader } from "@/components/AppShell";
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
  const snapshot = useServerFn(getDashboardSnapshot);
  const [seeding, setSeeding] = useState(false);

  const status = useQuery({ queryKey: ["seed-status"], queryFn: () => seedStatus() });
  const snap = useQuery({ queryKey: ["dashboard-snapshot"], queryFn: () => snapshot() });

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seed();
      await Promise.all([status.refetch(), snap.refetch()]);
    } finally {
      setSeeding(false);
    }
  };

  const isSeeded = status.data?.isSeeded ?? false;
  const data = snap.data?.seeded ? snap.data : null;

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <div className="flex items-center justify-between mb-2">
          <PageHeader
            kicker="EXECUTIVE DASHBOARD"
            title="Memory Supply Position"
            description="Live view of demand, capacity, inventory, and risk across HBM, GDDR, LPDDR, and DDR programs."
          />
          {isSeeded && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              DATASET READY · {fmtInt(status.data?.counts?.demand_forecasts ?? 0)} forecasts
            </div>
          )}
        </div>

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
                <div className="text-7xl font-semibold tabular-nums text-gradient-primary">
                  {data?.pis.score ?? "—"}
                </div>
                <div className="text-2xl text-muted-foreground tabular-nums">/ 100</div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Composite health of demand, supply, inventory, and risk posture.
              </div>
              <div className="mt-6 space-y-2.5">
                {[
                  { label: "Shortage exposure", value: data?.pis.subScores.shortage ?? 0, weight: "25%" },
                  { label: "Inventory health", value: data?.pis.subScores.inventory ?? 0, weight: "20%" },
                  { label: "Supplier diversification", value: data?.pis.subScores.concentration ?? 0, weight: "20%" },
                  { label: "Forecast confidence", value: data?.pis.subScores.confidence ?? 0, weight: "20%" },
                  { label: "Purchase readiness", value: data?.pis.subScores.purchasing ?? 0, weight: "15%" },
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
            <KpiCard icon={DollarSign} label="Revenue at Risk" value={data ? fmtMoney(data.kpis.revenueAtRisk) : "—"} tone="warning" delta="Across open shortages" />
            <KpiCard icon={AlertTriangle} label="Open Risk Events" value={data ? fmtInt(data.kpis.openShortages) : "—"} tone="destructive" delta="Active mitigations" />
            <KpiCard icon={Layers} label="Coverage Weeks" value={data ? fmtWeeks(data.kpis.coverageWeeks) : "—"} tone="info" delta={data ? `Target ${data.kpis.coverageTargetWeeks}w` : ""} />
            <KpiCard icon={Activity} label="Supplier Risk Index" value={data ? `${data.kpis.supplierRiskIndex} / 100` : "—"} tone="warning" delta={data ? `${data.kpis.watchSuppliers} on watch` : ""} />
          </div>
        </div>

        {data && (
          <div className="glass rounded-xl p-6">
            <div className="text-xs font-mono text-muted-foreground mb-1">DEMAND VS SUPPLY BY MEMORY TECHNOLOGY</div>
            <div className="text-base font-semibold mb-4">36-month aggregated position</div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground font-mono">
                    <th className="py-2 font-normal">TECH</th>
                    <th className="py-2 font-normal text-right">DEMAND</th>
                    <th className="py-2 font-normal text-right">CAPACITY</th>
                    <th className="py-2 font-normal text-right">INVENTORY</th>
                    <th className="py-2 font-normal text-right">SHORTAGE</th>
                    <th className="py-2 font-normal text-right">REV @ RISK</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTech.map((b) => (
                    <tr key={b.tech} className="border-t border-border">
                      <td className="py-2 font-medium">{b.tech}</td>
                      <td className="py-2 text-right tabular-nums">{fmtInt(b.demand)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtInt(b.capacity)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtInt(b.inventory)}</td>
                      <td className={`py-2 text-right tabular-nums ${b.shortage > 0 ? "text-destructive" : "text-success"}`}>{fmtInt(b.shortage)}</td>
                      <td className="py-2 text-right tabular-nums">{b.revenueAtRisk > 0 ? fmtMoney(b.revenueAtRisk) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground text-center">
          Demo uses synthetic semiconductor planning data for portfolio demonstration purposes.
          No proprietary NVIDIA or supplier information is used.
        </footer>
      </div>
    </AppShell>
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
