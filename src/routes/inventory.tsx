import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getInventoryAnalytics } from "@/lib/analytics.functions";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { fmtCompact, fmtWeeks } from "@/lib/format";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Coverage — Memory Control Tower" },
      { name: "description", content: "On-hand inventory, safety stock coverage and weeks-of-supply across memory technologies and regions." },
    ],
  }),
  component: InventoryPage,
});

const STATUS_STYLES: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  low: "bg-warning/15 text-warning border-warning/30",
  healthy: "bg-success/15 text-success border-success/30",
  excess: "bg-info/15 text-info border-info/30",
};

function InventoryPage() {
  const fn = useServerFn(getInventoryAnalytics);
  const { data } = useQuery({ queryKey: ["inventory-analytics"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <PageHeader
          kicker="INVENTORY COVERAGE TRACKER"
          title="On-Hand Position"
          description="Live coverage vs safety stock by technology, family and region. Target weeks-of-supply: 8w."
        />

        {!data ? (
          <EmptyState title="Loading inventory…" />
        ) : !data.seeded ? (
          <EmptyState title="Initialize the dataset first" hint="Open Executive Dashboard and click Generate Synthetic Data." />
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { k: "critical", label: "Critical" },
                { k: "low", label: "Below Safety" },
                { k: "healthy", label: "Healthy" },
                { k: "excess", label: "Excess" },
              ].map((s) => (
                <div key={s.k} className={`rounded-xl px-4 py-3 border ${STATUS_STYLES[s.k]}`}>
                  <div className="text-xs font-mono opacity-80">{s.label.toUpperCase()}</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1">{data.statusCounts[s.k] ?? 0}</div>
                </div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">INVENTORY VS SAFETY STOCK</div>
              <div className="text-base font-semibold mb-4">By memory technology</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.techs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                    <XAxis dataKey="tech" tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => fmtCompact(v)} tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.16 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => fmtCompact(v)}
                    />
                    <Bar dataKey="inventory" fill="oklch(0.78 0.22 145)" name="On hand" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="safetyStock" fill="oklch(0.45 0.12 145)" name="Safety stock" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="glass rounded-xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">INVENTORY DETAIL</div>
              <div className="text-base font-semibold mb-4">Family × technology × region</div>
              <div className="overflow-auto max-h-[520px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted-foreground font-mono">
                      <th className="py-2 font-normal">TECH</th>
                      <th className="py-2 font-normal">FAMILY</th>
                      <th className="py-2 font-normal">REGION</th>
                      <th className="py-2 font-normal text-right">ON HAND</th>
                      <th className="py-2 font-normal text-right">SAFETY</th>
                      <th className="py-2 font-normal text-right">WoS</th>
                      <th className="py-2 font-normal">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-2">{r.tech}</td>
                        <td className="py-2 text-muted-foreground">{r.family}</td>
                        <td className="py-2 text-muted-foreground">{r.region}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(r.inventory)}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(r.safetyStock)}</td>
                        <td className="py-2 text-right tabular-nums">{fmtWeeks(r.wos)}</td>
                        <td className="py-2">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${STATUS_STYLES[r.status]}`}>
                            {r.status}
                          </span>
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
