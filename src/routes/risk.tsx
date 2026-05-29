import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { getRiskAnalytics } from "@/lib/analytics.functions";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { fmtInt, fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Heatmap — Memory Control Tower" },
      { name: "description", content: "Severity × category risk heatmap with revenue at risk and event-level detail for the memory supply base." },
    ],
  }),
  component: RiskPage,
});

const SEV_STYLES: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-info/15 text-info border-info/30",
  low: "bg-success/15 text-success border-success/30",
};

function cellShade(n: number, max: number) {
  if (max <= 0 || n <= 0) return "oklch(0.18 0 0)";
  const t = Math.min(1, n / max);
  // From dim graphite to vivid green-warning-destructive based on count
  const hue = 145 - t * 120; // 145 (green) → 25 (red)
  const lightness = 0.25 + t * 0.45;
  const chroma = 0.05 + t * 0.20;
  return `oklch(${lightness} ${chroma} ${hue})`;
}

function RiskPage() {
  const fn = useServerFn(getRiskAnalytics);
  const { data } = useQuery({ queryKey: ["risk-analytics"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <PageHeader
          kicker="RISK HEATMAP"
          title="Live Risk Posture"
          description="Category × severity exposure across the memory supply base. Cells weighted by event count; revenue at risk shown per category."
        />

        {!data ? (
          <EmptyState title="Loading risk…" />
        ) : !data.seeded ? (
          <EmptyState title="Initialize the dataset first" hint="Open Executive Dashboard and click Generate Synthetic Data." />
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile label="Total Events" value={fmtInt(data.summary.total)} />
              <KpiTile label="Open" value={fmtInt(data.summary.open)} tone="warning" />
              <KpiTile label="Revenue @ Risk" value={fmtMoney(data.summary.totalRevenueAtRisk)} tone="destructive" />
              <KpiTile label="Critical Events" value={fmtInt(data.severityCounts.critical ?? 0)} tone="destructive" />
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">CATEGORY × SEVERITY</div>
              <div className="text-base font-semibold mb-4">Heatmap weighted by event count</div>
              <Heatmap rows={data.heatmap as any[]} />
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <div className="text-xs font-mono text-muted-foreground mb-1">TOP SUPPLIERS BY EXPOSURE</div>
                <div className="text-base font-semibold mb-4">Revenue at risk by supplier</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground font-mono">
                      <th className="py-2 font-normal">SUPPLIER</th>
                      <th className="py-2 font-normal text-right">EVENTS</th>
                      <th className="py-2 font-normal text-right">REV @ RISK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.suppliers as any[]).slice(0, 12).map((s) => (
                      <tr key={s.supplier} className="border-t border-border">
                        <td className="py-2">{s.supplier}</td>
                        <td className="py-2 text-right tabular-nums">{s.count}</td>
                        <td className="py-2 text-right tabular-nums">{fmtMoney(s.revenueAtRisk)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="glass rounded-xl p-6">
                <div className="text-xs font-mono text-muted-foreground mb-1">SEVERITY MIX</div>
                <div className="text-base font-semibold mb-4">Open and active events</div>
                <div className="space-y-3 mt-4">
                  {(() => {
                    const max = Math.max(0, ...Object.values(data.severityCounts).map((n) => Number(n) || 0));
                    return ["critical", "high", "medium", "low"].map((s) => {
                    const count = data.severityCounts[s] ?? 0;
                    const pct = max ? (count / max) * 100 : 0;
                    return (
                      <div key={s}>
                        <div className="flex items-baseline justify-between text-xs mb-1">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${SEV_STYLES[s]}`}>{s}</span>
                          <span className="font-mono tabular-nums">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                            className="h-full rounded-full" style={{
                              background: s === "critical" ? "var(--destructive)" : s === "high" ? "var(--warning)" : s === "medium" ? "var(--info)" : "var(--success)"
                            }} />
                        </div>
                      </div>
                    );
                  });
                  })()}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">EVENT DETAIL</div>
              <div className="text-base font-semibold mb-4">Top 150 events by revenue at risk</div>
              <div className="overflow-auto max-h-[520px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted-foreground font-mono">
                      <th className="py-2 font-normal">CATEGORY</th>
                      <th className="py-2 font-normal">SEVERITY</th>
                      <th className="py-2 font-normal">SUPPLIER</th>
                      <th className="py-2 font-normal">TECH</th>
                      <th className="py-2 font-normal">DESCRIPTION</th>
                      <th className="py-2 font-normal text-right">REV @ RISK</th>
                      <th className="py-2 font-normal">DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.events as any[]).map((e) => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="py-2">{e.category}</td>
                        <td className="py-2">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${SEV_STYLES[e.severity]}`}>{e.severity}</span>
                        </td>
                        <td className="py-2 text-muted-foreground">{e.supplier}</td>
                        <td className="py-2 text-muted-foreground">{e.tech}</td>
                        <td className="py-2 text-muted-foreground max-w-md truncate">{e.description}</td>
                        <td className="py-2 text-right tabular-nums">{fmtMoney(e.revenueAtRisk)}</td>
                        <td className="py-2 font-mono text-muted-foreground">{e.eventDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Heatmap({ rows }: { rows: any[] }) {
  const severities = ["low", "medium", "high", "critical"];
  const max = Math.max(1, ...rows.flatMap((r) => severities.map((s) => Number(r[s]) || 0)));
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground font-mono">
            <th className="py-2 text-left font-normal">CATEGORY</th>
            {severities.map((s) => (
              <th key={s} className="py-2 text-center font-normal uppercase">{s}</th>
            ))}
            <th className="py-2 text-right font-normal">REV @ RISK</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.category} className="border-t border-border">
              <td className="py-2 pr-4 font-medium">{r.category}</td>
              {severities.map((s) => {
                const n = Number(r[s]) || 0;
                return (
                  <td key={s} className="p-1.5 text-center">
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="rounded-md h-10 grid place-items-center tabular-nums text-xs font-semibold border border-border/50"
                      style={{ background: cellShade(n, max), color: n / max > 0.5 ? "white" : "var(--foreground)" }}
                    >
                      {n}
                    </motion.div>
                  </td>
                );
              })}
              <td className="py-2 text-right tabular-nums">{fmtMoney(r.revenueAtRisk)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone?: "warning" | "destructive" }) {
  const cls = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="glass rounded-xl px-4 py-3">
      <div className="text-xs font-mono text-muted-foreground">{label.toUpperCase()}</div>
      <div className={`text-2xl font-semibold tabular-nums mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
