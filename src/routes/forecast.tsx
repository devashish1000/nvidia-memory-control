import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getForecastAnalytics } from "@/lib/analytics.functions";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { fmtCompact, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Demand Forecast — Memory Control Tower" },
      { name: "description", content: "Multi-segment memory demand forecast with confidence intervals across HBM, GDDR, LPDDR, and DDR programs." },
    ],
  }),
  component: ForecastPage,
});

function ForecastPage() {
  const fn = useServerFn(getForecastAnalytics);
  const { data } = useQuery({ queryKey: ["forecast-analytics"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <PageHeader
          kicker="DEMAND FORECAST PLANNER"
          title="36-Month Memory Demand"
          description="Aggregated forecast units and consensus confidence across all customer segments and product families."
        />

        {!data ? (
          <EmptyState title="Loading forecast…" />
        ) : !data.seeded ? (
          <EmptyState title="Initialize the dataset first" hint="Open Executive Dashboard and click Generate Synthetic Data." />
        ) : (
          <div className="grid gap-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground">DEMAND TREND</div>
                  <div className="text-lg font-semibold">Monthly demand units across all segments</div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">{data.trend.length} periods</div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.78 0.22 145)" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="oklch(0.78 0.22 145)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                    <XAxis dataKey="period" tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => fmtCompact(v)} tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.16 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => fmtCompact(v)}
                    />
                    <Area type="monotone" dataKey="demand" stroke="oklch(0.78 0.22 145)" fill="url(#g1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <div className="text-xs font-mono text-muted-foreground mb-1">BY CUSTOMER SEGMENT</div>
                <div className="text-base font-semibold mb-4">Total demand mix</div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.segments} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                      <XAxis type="number" tickFormatter={(v) => fmtCompact(v)} tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fill: "oklch(0.75 0 0)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "oklch(0.16 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => fmtCompact(v)}
                      />
                      <Bar dataKey="demand" fill="oklch(0.78 0.22 145)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-6">
                <div className="text-xs font-mono text-muted-foreground mb-1">TOP PRODUCT FAMILIES</div>
                <div className="text-base font-semibold mb-4">Demand × confidence</div>
                <div className="overflow-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground font-mono">
                        <th className="py-2 font-normal">FAMILY</th>
                        <th className="py-2 font-normal">SEGMENT</th>
                        <th className="py-2 font-normal text-right">DEMAND</th>
                        <th className="py-2 font-normal text-right">CONF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.families.slice(0, 12).map((f) => (
                        <tr key={f.family} className="border-t border-border">
                          <td className="py-2">{f.family}</td>
                          <td className="py-2 text-muted-foreground">{f.segment}</td>
                          <td className="py-2 text-right tabular-nums">{fmtCompact(f.demand)}</td>
                          <td className={`py-2 text-right tabular-nums ${f.confidence >= 0.75 ? "text-success" : f.confidence >= 0.6 ? "text-warning" : "text-destructive"}`}>
                            {fmtPct(f.confidence)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
