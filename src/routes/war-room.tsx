import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Radio, AlertOctagon, AlertTriangle, Activity, RefreshCw, Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { getDashboardSnapshot } from "@/lib/analytics.functions";
import { generateWarRoomCommentary } from "@/lib/copilot.functions";
import { fmtMoney, fmtInt, fmtWeeks } from "@/lib/format";

export const Route = createFileRoute("/war-room")({
  head: () => ({
    meta: [
      { title: "Executive War Room — Memory Control Tower" },
      { name: "description", content: "Live KPI wall with AI commentary for high-stakes memory supply decisions." },
    ],
  }),
  component: WarRoom,
});

const SEV: Record<string, string> = {
  critical: "bg-destructive/15 border-destructive/40 text-destructive",
  high: "bg-orange-500/15 border-orange-500/40 text-orange-400",
  medium: "bg-yellow-500/15 border-yellow-500/40 text-yellow-400",
};

function WarRoom() {
  const snapFn = useServerFn(getDashboardSnapshot);
  const aiFn = useServerFn(generateWarRoomCommentary);
  const snap = useQuery({ queryKey: ["dashboard-snapshot"], queryFn: () => snapFn(), refetchInterval: 30_000 });
  const ai = useQuery({ queryKey: ["war-room-ai"], queryFn: () => aiFn(), refetchInterval: 60_000 });

  const s = snap.data?.seeded ? snap.data : null;

  return (
    <AppShell>
      <div className="px-10 py-8">
        <div className="flex items-end justify-between mb-8">
          <PageHeader
            kicker="INTELLIGENCE / WAR ROOM"
            title="Executive War Room"
            description="Live KPI wall, refreshed continuously, with AI commentary on the unfolding picture."
          />
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> LIVE
            </div>
            <button
              onClick={() => { snap.refetch(); ai.refetch(); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border hover:bg-secondary"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {!s ? (
          <div className="glass rounded-xl p-12 text-center text-sm text-muted-foreground">
            Seed the planning data on the Executive Dashboard to activate the War Room.
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 mb-6 border border-primary/30"
            >
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-primary mb-2">
                <Radio className="w-3 h-3" /> AI HEADLINE · {new Date().toLocaleTimeString()}
              </div>
              {ai.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing live commentary…
                </div>
              ) : ai.data?.ok ? (
                <div className="text-xl font-semibold tracking-tight">{ai.data.headline}</div>
              ) : (
                <div className="text-sm text-muted-foreground">{ai.data && "error" in ai.data ? ai.data.error : "AI commentary unavailable."}</div>
              )}
            </motion.div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <KpiTile label="Planning Intelligence" value={`${s.pis.score}`} sub="/ 100" tone="primary" />
              <KpiTile label="Revenue at Risk" value={fmtMoney(s.kpis.revenueAtRisk)} tone="destructive" />
              <KpiTile label="Open Shortages" value={fmtInt(s.kpis.openShortages)} tone="warning" />
              <KpiTile label="Coverage" value={fmtWeeks(s.kpis.coverageWeeks)} sub={`target ${s.kpis.coverageTargetWeeks}w`} />
              <KpiTile label="Supplier Risk Index" value={`${s.kpis.supplierRiskIndex}`} sub="/ 100" />
              <KpiTile label="Watch Suppliers" value={fmtInt(s.kpis.watchSuppliers)} />
              <KpiTile label="Forecast Confidence" value={`${s.pis.subScores.confidence}%`} />
              <KpiTile label="Purchase Readiness" value={`${s.pis.subScores.purchasing}%`} />

            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertOctagon className="w-4 h-4 text-destructive" />
                  <div className="text-sm font-semibold">Live Alerts</div>
                  <div className="ml-auto text-[10px] font-mono text-muted-foreground">AI-CURATED</div>
                </div>
                <div className="space-y-2">
                  {ai.isLoading ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Generating…</div>
                  ) : ai.data?.ok && ai.data.alerts.length ? (
                    ai.data.alerts.map((a, i) => (
                      <div key={i} className={`rounded-lg px-3 py-2.5 border ${SEV[a.severity] ?? SEV.medium}`}>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider mb-1">
                          <AlertTriangle className="w-3 h-3" /> {a.severity}
                        </div>
                        <div className="text-sm font-medium text-foreground">{a.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{a.detail}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No alerts.</div>
                  )}
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-primary" />
                  <div className="text-sm font-semibold">Recommended Next Actions</div>
                </div>
                <div className="space-y-2">
                  {ai.isLoading ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Generating…</div>
                  ) : ai.data?.ok && ai.data.nextActions.length ? (
                    ai.data.nextActions.map((a, i) => (
                      <div key={i} className="flex gap-3 rounded-lg px-3 py-2.5 bg-secondary/40 border border-border/40">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-mono grid place-items-center shrink-0">{i + 1}</div>
                        <div className="text-sm">{a}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No actions available.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function KpiTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "primary" | "destructive" | "warning" }) {
  const accent =
    tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-orange-400" : "text-foreground";
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase mb-1.5">{label}</div>
      <div className={`text-2xl font-semibold tracking-tight ${accent}`}>{value}</div>
      {sub && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
