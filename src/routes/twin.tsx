import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { getTwinSnapshot } from "@/lib/analytics.functions";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { fmtCompact, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/twin")({
  head: () => ({
    meta: [
      { title: "Digital Twin — Memory Control Tower" },
      { name: "description", content: "Mission-control digital twin of the memory supply chain — suppliers, technologies, and product families with live flow." },
    ],
  }),
  component: TwinPage,
});

const STATUS_COLOR: Record<string, string> = {
  healthy: "oklch(0.78 0.22 145)",
  warning: "oklch(0.78 0.18 75)",
  critical: "oklch(0.65 0.25 25)",
};

function TwinPage() {
  const fn = useServerFn(getTwinSnapshot);
  const { data } = useQuery({ queryKey: ["twin-snapshot"], queryFn: () => fn() });

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <PageHeader
          kicker="MISSION-CONTROL DIGITAL TWIN"
          title="Memory Supply Network"
          description="Suppliers → memory technologies → product families. Node color encodes utilization status; edge thickness encodes capacity flow."
        />

        {!data ? (
          <EmptyState title="Loading twin…" />
        ) : !data.seeded ? (
          <EmptyState title="Initialize the dataset first" hint="Open Executive Dashboard and click Generate Synthetic Data." />
        ) : (
          <div className="grid gap-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-elevated rounded-2xl p-6">
              <TwinGraph data={data as any} />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              <NodeColumn title="Suppliers" subtitle={`${(data.suppliers as any[]).length} active`} nodes={
                (data.suppliers as any[]).slice(0, 12).map((s) => ({
                  primary: s.name,
                  secondary: `${s.type} · ${s.region}`,
                  metric: fmtPct(s.utilization),
                  color: STATUS_COLOR[s.status],
                }))
              } />
              <NodeColumn title="Memory Technologies" subtitle={`${(data.techs as any[]).length} generations`} nodes={
                (data.techs as any[]).map((t) => ({
                  primary: t.name,
                  secondary: t.generation,
                  metric: fmtCompact(t.demand),
                  color: "oklch(0.78 0.22 145)",
                }))
              } />
              <NodeColumn title="Product Families" subtitle={`${(data.families as any[]).length} programs`} nodes={
                (data.families as any[]).slice(0, 12).map((f) => ({
                  primary: f.name,
                  secondary: f.segment,
                  metric: "",
                  color: "oklch(0.62 0.20 220)",
                }))
              } />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TwinGraph({ data }: { data: any }) {
  const suppliers: any[] = data.suppliers.slice(0, 12);
  const techs: any[] = data.techs;
  const edges: any[] = data.edges;

  const W = 1100, H = 520;
  const supX = 80;
  const techX = W / 2;
  const famX = W - 80;
  const supSpacing = (H - 60) / Math.max(1, suppliers.length - 1);
  const techSpacing = (H - 60) / Math.max(1, techs.length - 1);
  const families: any[] = data.families.slice(0, 12);
  const famSpacing = (H - 60) / Math.max(1, families.length - 1);

  const supPos = new Map<string, { x: number; y: number }>();
  suppliers.forEach((s, i) => supPos.set(s.id, { x: supX, y: 30 + i * supSpacing }));
  const techPos = new Map<string, { x: number; y: number }>();
  techs.forEach((t, i) => techPos.set(t.id, { x: techX, y: 30 + i * techSpacing }));
  const famPos = new Map<string, { x: number; y: number }>();
  families.forEach((f, i) => famPos.set(f.id, { x: famX, y: 30 + i * famSpacing }));

  const maxEdge = Math.max(1, ...edges.map((e: any) => e.weight));

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 900 }}>
        <defs>
          <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.78 0.22 145)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="oklch(0.78 0.22 145)" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Supplier → Tech edges */}
        {edges.map((e: any, i: number) => {
          const a = supPos.get(e.source); const b = techPos.get(e.target);
          if (!a || !b) return null;
          const opacity = 0.1 + 0.7 * (e.weight / maxEdge);
          const width = 0.5 + 2.5 * (e.weight / maxEdge);
          return (
            <motion.path
              key={`st-${i}`}
              d={`M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`}
              stroke="oklch(0.78 0.22 145)"
              strokeOpacity={opacity}
              strokeWidth={width}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: i * 0.01 }}
            />
          );
        })}
        {/* Tech → Family decorative edges (uniform, faint) */}
        {techs.flatMap((t) => families.slice(0, 6).map((f, j) => {
          const a = techPos.get(t.id); const b = famPos.get(f.id);
          if (!a || !b) return null;
          return (
            <path
              key={`tf-${t.id}-${j}`}
              d={`M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`}
              stroke="oklch(0.45 0.10 145)"
              strokeOpacity={0.08}
              strokeWidth={0.6}
              fill="none"
            />
          );
        }))}

        {/* Supplier nodes */}
        {suppliers.map((s, i) => {
          const p = supPos.get(s.id)!;
          return (
            <motion.g key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <circle cx={p.x} cy={p.y} r={8} fill={STATUS_COLOR[s.status]} stroke="oklch(0.1 0 0)" strokeWidth={2}>
                <animate attributeName="r" values="8;10;8" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <text x={p.x - 14} y={p.y + 4} textAnchor="end" fill="oklch(0.85 0 0)" fontSize="11" fontFamily="system-ui">{s.name}</text>
            </motion.g>
          );
        })}
        {/* Tech nodes */}
        {techs.map((t, i) => {
          const p = techPos.get(t.id)!;
          return (
            <motion.g key={t.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <rect x={p.x - 30} y={p.y - 10} width={60} height={20} rx={4} fill="oklch(0.18 0 0)" stroke="oklch(0.78 0.22 145)" strokeWidth={1} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fill="oklch(0.95 0 0)" fontSize="11" fontFamily="system-ui" fontWeight="600">{t.name}</text>
            </motion.g>
          );
        })}
        {/* Family nodes */}
        {families.map((f, i) => {
          const p = famPos.get(f.id)!;
          return (
            <motion.g key={f.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
              <circle cx={p.x} cy={p.y} r={6} fill="oklch(0.62 0.20 220)" stroke="oklch(0.1 0 0)" strokeWidth={2} />
              <text x={p.x + 14} y={p.y + 4} fill="oklch(0.85 0 0)" fontSize="11" fontFamily="system-ui">{f.name}</text>
            </motion.g>
          );
        })}

        {/* Column labels */}
        <text x={supX} y={15} textAnchor="end" fill="oklch(0.65 0 0)" fontSize="10" fontFamily="monospace">SUPPLIERS</text>
        <text x={techX} y={15} textAnchor="middle" fill="oklch(0.65 0 0)" fontSize="10" fontFamily="monospace">MEMORY TECH</text>
        <text x={famX} y={15} fill="oklch(0.65 0 0)" fontSize="10" fontFamily="monospace">PROGRAMS</text>
      </svg>
    </div>
  );
}

function NodeColumn({ title, subtitle, nodes }: { title: string; subtitle: string; nodes: { primary: string; secondary: string; metric: string; color: string }[] }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="text-xs font-mono text-muted-foreground">{title.toUpperCase()}</div>
      <div className="text-sm font-semibold mb-3">{subtitle}</div>
      <div className="space-y-1.5 max-h-72 overflow-auto">
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: n.color }} />
            <div className="flex-1 min-w-0">
              <div className="truncate">{n.primary}</div>
              <div className="text-muted-foreground text-[10px] truncate">{n.secondary}</div>
            </div>
            {n.metric && <div className="font-mono tabular-nums text-muted-foreground">{n.metric}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
