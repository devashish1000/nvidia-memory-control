import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { getDataQualityReport } from "@/lib/quality.functions";

export const Route = createFileRoute("/data-quality")({
  head: () => ({
    meta: [
      { title: "Data Quality Center — Memory Control Tower" },
      { name: "description", content: "Automated validation of completeness, validity, consistency, and operational hygiene." },
    ],
  }),
  component: DataQuality,
});

const STATUS_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const STATUS_STYLE: Record<string, string> = {
  pass: "bg-primary/10 border-primary/30 text-primary",
  warn: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  fail: "bg-destructive/10 border-destructive/30 text-destructive",
};

function DataQuality() {
  const fn = useServerFn(getDataQualityReport);
  const q = useQuery({ queryKey: ["dq-report"], queryFn: () => fn() });

  const data = q.data;
  const byDomain = data
    ? data.checks.reduce<Record<string, typeof data.checks>>((acc, c) => {
        (acc[c.domain] ??= []).push(c);
        return acc;
      }, {})
    : {};

  return (
    <AppShell>
      <div className="px-10 py-8">
        <div className="flex items-end justify-between mb-8">
          <PageHeader
            kicker="OPERATIONS / DATA QUALITY"
            title="Data Quality Center"
            description="Validates the planning dataset across completeness, validity, consistency, and operational hygiene."
          />
          <button
            onClick={() => q.refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border hover:bg-secondary text-xs"
          >
            <RefreshCw className="w-3 h-3" /> Re-run checks
          </button>
        </div>

        {!data ? (
          <div className="glass rounded-xl p-12 text-center text-sm text-muted-foreground">Loading data quality report…</div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <Tile label="Quality Score" value={`${data.score}`} sub="/ 100" tone="primary" icon={Shield} />
              <Tile label="Passed" value={`${data.passed}`} sub={`of ${data.total}`} tone="pass" icon={CheckCircle2} />
              <Tile label="Warnings" value={`${data.warned}`} tone="warn" icon={AlertTriangle} />
              <Tile label="Failed" value={`${data.failed}`} tone="fail" icon={XCircle} />
            </div>

            <div className="space-y-6">
              {Object.entries(byDomain).map(([domain, checks]) => (
                <div key={domain} className="glass rounded-xl p-5">
                  <div className="text-xs font-mono tracking-wider uppercase text-muted-foreground mb-4">{domain}</div>
                  <div className="space-y-2">
                    {checks.map((c, i) => {
                      const Icon = STATUS_ICON[c.status];
                      return (
                        <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${STATUS_STYLE[c.status]}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground">{c.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{c.detail}</div>
                          </div>
                          <div className="text-xs font-mono">
                            {c.count === 0 ? "OK" : `${c.count} issue${c.count > 1 ? "s" : ""}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Tile({
  label, value, sub, tone, icon: Icon,
}: {
  label: string; value: string; sub?: string; tone: "primary" | "pass" | "warn" | "fail"; icon: React.ComponentType<{ className?: string }>;
}) {
  const accent =
    tone === "primary" ? "text-primary"
    : tone === "pass" ? "text-primary"
    : tone === "warn" ? "text-yellow-400"
    : "text-destructive";
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        <div className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{label}</div>
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${accent}`}>{value}</div>
      {sub && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
