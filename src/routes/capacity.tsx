import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { getCapacityAnalytics } from "@/lib/analytics.functions";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { fmtCompact, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/capacity")({
  head: () => ({
    meta: [
      { title: "Supplier Capacity — Memory Control Tower" },
      { name: "description", content: "Available vs committed memory supplier capacity, lead times, and yield risk by supplier and memory technology." },
    ],
  }),
  component: CapacityPage,
});

function utilColor(u: number) {
  if (u >= 0.95) return "oklch(0.65 0.25 25)"; // destructive
  if (u >= 0.85) return "oklch(0.78 0.18 75)"; // warning
  return "oklch(0.78 0.22 145)";
}

function CapacityPage() {
  const fn = useServerFn(getCapacityAnalytics);
  const { data } = useQuery({ queryKey: ["capacity-analytics"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <PageHeader
          kicker="SUPPLIER CAPACITY PLANNER"
          title="Memory Capacity Position"
          description="Available vs committed capacity across HBM, GDDR, LPDDR, and DDR partners. Utilization over 85% indicates upside-bid risk."
        />

        {!data ? (
          <EmptyState title="Loading capacity…" />
        ) : !data.seeded ? (
          <EmptyState title="Initialize the dataset first" hint="Open Executive Dashboard and click Generate Synthetic Data." />
        ) : (
          <div className="grid gap-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">CAPACITY BY MEMORY TECHNOLOGY</div>
              <div className="text-base font-semibold mb-4">Available vs Committed (units, all suppliers)</div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.techs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                    <XAxis dataKey="tech" tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => fmtCompact(v)} tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.16 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => fmtCompact(v)}
                    />
                    <Bar dataKey="available" fill="oklch(0.45 0.12 145)" name="Available" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="committed" fill="oklch(0.78 0.22 145)" name="Committed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="glass rounded-xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">SUPPLIER UTILIZATION</div>
              <div className="text-base font-semibold mb-4">Capacity load, lead time and yield risk by supplier</div>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground font-mono">
                      <th className="py-2 font-normal">SUPPLIER</th>
                      <th className="py-2 font-normal">TYPE</th>
                      <th className="py-2 font-normal">REGION</th>
                      <th className="py-2 font-normal text-right">AVAILABLE</th>
                      <th className="py-2 font-normal text-right">COMMITTED</th>
                      <th className="py-2 font-normal text-right">UTIL</th>
                      <th className="py-2 font-normal text-right">LEAD TIME</th>
                      <th className="py-2 font-normal text-right">YIELD RISK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.suppliers.map((s) => (
                      <tr key={s.supplier} className="border-t border-border">
                        <td className="py-2 font-medium">{s.supplier}</td>
                        <td className="py-2 text-muted-foreground">{s.type}</td>
                        <td className="py-2 text-muted-foreground">{s.region}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(s.available)}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(s.committed)}</td>
                        <td className="py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.utilization * 100)}%`, background: utilColor(s.utilization) }} />
                            </div>
                            <span className="tabular-nums w-10 text-right">{fmtPct(s.utilization)}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right tabular-nums">{s.avgLeadTime.toFixed(1)}w</td>
                        <td className={`py-2 text-right tabular-nums ${s.avgYieldRisk >= 10 ? "text-destructive" : s.avgYieldRisk >= 6 ? "text-warning" : "text-success"}`}>
                          {s.avgYieldRisk.toFixed(1)}%
                        </td>
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
