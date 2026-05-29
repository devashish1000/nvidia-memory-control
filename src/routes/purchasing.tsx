import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { getPurchasingAnalytics } from "@/lib/analytics.functions";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { fmtCompact, fmtMoney, fmtInt } from "@/lib/format";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "Purchase Engine — Memory Control Tower" },
      { name: "description", content: "Recommended memory purchase quantities and open PO pipeline derived from demand, capacity, inventory, and safety stock." },
    ],
  }),
  component: PurchasingPage,
});

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-success/15 text-success border-success/30",
};

function PurchasingPage() {
  const fn = useServerFn(getPurchasingAnalytics);
  const { data } = useQuery({ queryKey: ["purchasing-analytics"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <PageHeader
          kicker="PURCHASE RECOMMENDATION ENGINE"
          title="Buy Plan"
          description="Recommended quantities = demand + safety − inventory − capacity − open POs (next 30-day horizon)."
        />

        {!data ? (
          <EmptyState title="Loading recommendations…" />
        ) : !data.seeded ? (
          <EmptyState title="Initialize the dataset first" hint="Open Executive Dashboard and click Generate Synthetic Data." />
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile label="Open POs" value={fmtInt(data.summary.openPoCount)} />
              <KpiTile label="Open Units" value={fmtCompact(data.summary.totalOpenUnits)} />
              <KpiTile label="Recommended Buy" value={fmtCompact(data.summary.recommendedUnits)} tone="warning" />
              <KpiTile label="Expedite Spend" value={fmtMoney(data.summary.expediteSpend)} tone="destructive" />
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">RECOMMENDED BUY BY TECHNOLOGY</div>
              <div className="text-base font-semibold mb-4">30-day horizon</div>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground font-mono">
                      <th className="py-2 font-normal">TECH</th>
                      <th className="py-2 font-normal text-right">DEMAND</th>
                      <th className="py-2 font-normal text-right">INVENTORY</th>
                      <th className="py-2 font-normal text-right">CAPACITY</th>
                      <th className="py-2 font-normal text-right">OPEN POs</th>
                      <th className="py-2 font-normal text-right">RECOMMEND</th>
                      <th className="py-2 font-normal">PRIORITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recommendations.map((r) => (
                      <tr key={r.tech} className="border-t border-border">
                        <td className="py-2 font-medium">{r.tech}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(r.demand)}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(r.inventory)}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(r.capacity)}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(r.openPOs)}</td>
                        <td className="py-2 text-right tabular-nums font-semibold text-primary">{fmtCompact(r.recommend)}</td>
                        <td className="py-2">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${PRIORITY_STYLES[r.priority]}`}>
                            {r.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <div className="glass rounded-xl p-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">OPEN PO PIPELINE</div>
              <div className="text-base font-semibold mb-4">Next 100 arrivals</div>
              <div className="overflow-auto max-h-[520px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted-foreground font-mono">
                      <th className="py-2 font-normal">SUPPLIER</th>
                      <th className="py-2 font-normal">TECH</th>
                      <th className="py-2 font-normal">FAMILY</th>
                      <th className="py-2 font-normal text-right">QTY</th>
                      <th className="py-2 font-normal">EXPECTED</th>
                      <th className="py-2 font-normal text-right">EXPEDITE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.openPos.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-2 font-medium">{p.supplier}</td>
                        <td className="py-2 text-muted-foreground">{p.tech}</td>
                        <td className="py-2 text-muted-foreground">{p.family}</td>
                        <td className="py-2 text-right tabular-nums">{fmtCompact(p.quantity)}</td>
                        <td className="py-2 font-mono text-muted-foreground">{p.expected}</td>
                        <td className="py-2 text-right tabular-nums">{p.expediteCost > 0 ? fmtMoney(p.expediteCost) : "—"}</td>
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

function KpiTile({ label, value, tone }: { label: string; value: string; tone?: "warning" | "destructive" }) {
  const cls = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="glass rounded-xl px-4 py-3">
      <div className="text-xs font-mono text-muted-foreground">{label.toUpperCase()}</div>
      <div className={`text-2xl font-semibold tabular-nums mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
