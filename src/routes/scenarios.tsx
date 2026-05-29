import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FlaskConical, Play, Zap, ChevronRight, Loader2 } from "lucide-react";
import { listScenarioTemplates, listScenarioSimulations, runScenario } from "@/lib/scenario.functions";
import { AppShell, PageHeader, EmptyState } from "@/components/AppShell";
import { fmtInt, fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario Simulator — Memory Control Tower" },
      { name: "description", content: "Run supply shock scenarios from a prebuilt library and visualize Day 0-Recovery executive decision timelines." },
    ],
  }),
  component: ScenariosPage,
});

function ScenariosPage() {
  const tplFn = useServerFn(listScenarioTemplates);
  const simsFn = useServerFn(listScenarioSimulations);
  const runFn = useServerFn(runScenario);
  const qc = useQueryClient();

  const templates = useQuery({ queryKey: ["scenario-templates"], queryFn: () => tplFn() });
  const sims = useQuery({ queryKey: ["scenario-sims"], queryFn: () => simsFn() });

  const [activeId, setActiveId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (vars: { tpl: any }) =>
      runFn({
        data: {
          name: vars.tpl.name,
          lever: vars.tpl.lever,
          magnitude: Number(vars.tpl.magnitude),
          scope: vars.tpl.scope ?? {},
          duration_weeks: vars.tpl.duration_weeks,
          template_id: vars.tpl.id,
        },
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["scenario-sims"] });
      setActiveId(res.id);
    },
  });

  const activeSim = (sims.data as any[] | undefined)?.find((s) => s.id === activeId)
    ?? (sims.data as any[] | undefined)?.[0];

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1500px]">
        <PageHeader
          kicker="SCENARIO SIMULATOR"
          title="Supply Shock Library"
          description="Eight prebuilt supply-shock templates. Each run snapshots live aggregates, applies the lever, and produces a Day 0 / 15 / 30 / 60 / 90 / Recovery executive decision timeline."
        />

        {!templates.data?.length ? (
          <EmptyState title="Initialize the dataset first" hint="Open Executive Dashboard and click Generate Synthetic Data." />
        ) : (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            <div className="space-y-3">
              {(templates.data as any[]).map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-xl p-4 group hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
                      <FlaskConical className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>
                      <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-muted-foreground">
                        <span className="rounded-full border border-border px-2 py-0.5">{t.lever}</span>
                        <span className="rounded-full border border-border px-2 py-0.5">{Math.round(Number(t.magnitude) * 100)}%</span>
                        <span className="rounded-full border border-border px-2 py-0.5">{t.duration_weeks}w</span>
                      </div>
                    </div>
                    <button
                      onClick={() => mutation.mutate({ tpl: t })}
                      disabled={mutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                    >
                      {mutation.isPending && mutation.variables?.tpl.id === t.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Run
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="glass-elevated rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">EXECUTIVE DECISION TIMELINE</div>
                    <div className="text-base font-semibold">
                      {activeSim ? activeSim.name : "Run a scenario to populate the timeline"}
                    </div>
                  </div>
                  {activeSim && (
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-muted-foreground">REVENUE @ RISK</div>
                      <div className="text-lg font-semibold text-warning tabular-nums">{fmtMoney(Number(activeSim.revenue_at_risk))}</div>
                    </div>
                  )}
                </div>

                {activeSim ? (
                  <>
                    <Timeline points={activeSim.timeline} />
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <Stat label="Shortage Δ" value={fmtInt(Number(activeSim.shortage_impact_units))} tone="warning" />
                      <Stat label="Risk Δ" value={`${Number(activeSim.risk_score_delta) >= 0 ? "+" : ""}${Math.round(Number(activeSim.risk_score_delta))}`} tone="destructive" />
                      <Stat label="Recovery" value={`${activeSim.recovery_weeks}w`} tone="info" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="text-[10px] font-mono text-muted-foreground mb-2">CAUSALITY CHAIN</div>
                      <ul className="text-xs space-y-1.5">
                        {(activeSim.causality_chain as string[] | undefined)?.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Click <span className="text-primary font-semibold">Run</span> on any scenario template to generate a live decision timeline.
                  </div>
                )}
              </div>

              {(sims.data as any[] | undefined) && sims.data!.length > 0 && (
                <div className="glass rounded-xl p-4">
                  <div className="text-xs font-mono text-muted-foreground mb-3">RECENT RUNS</div>
                  <div className="space-y-2">
                    {(sims.data as any[]).slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveId(s.id)}
                        className={`w-full text-left rounded-md px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          (activeSim?.id ?? "") === s.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary border border-transparent"
                        }`}
                      >
                        <div className="truncate">{s.name}</div>
                        <div className="font-mono text-muted-foreground shrink-0 ml-2">{fmtMoney(Number(s.revenue_at_risk))}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Timeline({ points }: { points: any[] }) {
  const sorted = [...points].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <div className="relative mt-6">
      <div className="absolute left-0 right-0 top-4 h-px bg-border" />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute left-0 top-4 h-px"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="grid grid-cols-6 gap-2 relative">
        <AnimatePresence>
          {sorted.map((p, i) => {
            const intensity = Math.min(1, Math.abs(p.metric_delta_pct ?? 0));
            const color = intensity > 0.6 ? "var(--destructive)" : intensity > 0.3 ? "var(--warning)" : "var(--primary)";
            return (
              <motion.div
                key={p.day_offset}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, type: "spring", stiffness: 180, damping: 22 }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-background relative z-10 shadow-lg"
                  style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                />
                <div className="mt-3 text-[10px] font-mono text-muted-foreground">{p.label}</div>
                <div className="mt-1 text-xs font-semibold text-center leading-tight">{p.headline}</div>
                <div className="mt-1 text-[10px] text-muted-foreground text-center leading-snug line-clamp-3">{p.narrative}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "warning" | "destructive" | "info" }) {
  const cls = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-info";
  return (
    <div className="rounded-xl bg-secondary/40 border border-border px-3 py-2">
      <div className="text-[10px] font-mono text-muted-foreground">{label.toUpperCase()}</div>
      <div className={`text-lg font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
