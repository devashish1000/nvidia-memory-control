import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TestTube, CheckCircle2, XCircle, Loader2, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { runAllTests, getLatestTestRun } from "@/lib/quality.functions";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Test Center — Memory Control Tower" },
      { name: "description", content: "Unit tests for planning calculations and data integrity, persisted with every run." },
    ],
  }),
  component: TestCenter,
});

type Result = { suite: string; name: string; passed: boolean; detail: string };

function TestCenter() {
  const latestFn = useServerFn(getLatestTestRun);
  const runFn = useServerFn(runAllTests);
  const latest = useQuery({ queryKey: ["latest-test-run"], queryFn: () => latestFn() });

  const mut = useMutation({
    mutationFn: () => runFn(),
    onSuccess: () => latest.refetch(),
  });

  const run = mut.data ?? latest.data;
  const results: Result[] = (run?.results as Result[]) ?? [];
  const passed = run?.passed ?? 0;
  const failed = run?.failed ?? 0;
  const total = results.length;

  const bySuite = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.suite] ??= []).push(r);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="px-10 py-8">
        <div className="flex items-end justify-between mb-8">
          <PageHeader
            kicker="OPERATIONS / TEST CENTER"
            title="Test Center"
            description="Unit tests for every planning formula plus live data-integrity assertions. Results persist to the database."
          />
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
          >
            {mut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run all tests
          </button>
        </div>

        {!run ? (
          <div className="glass rounded-xl p-12 text-center text-sm text-muted-foreground">
            No test runs yet. Click <span className="text-primary">Run all tests</span> to execute the suite.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <Tile label="Total Tests" value={`${total}`} icon={TestTube} />
              <Tile label="Passed" value={`${passed}`} tone="pass" icon={CheckCircle2} />
              <Tile label="Failed" value={`${failed}`} tone={failed ? "fail" : "muted"} icon={XCircle} />
              <Tile label="Pass Rate" value={`${total ? Math.round((passed / total) * 100) : 0}%`} tone={failed ? "warn" : "pass"} icon={CheckCircle2} />
            </div>

            <div className="space-y-6">
              {Object.entries(bySuite).map(([suite, rs]) => {
                const sPass = rs.filter((r) => r.passed).length;
                return (
                  <div key={suite} className="glass rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-mono tracking-wider uppercase text-muted-foreground">{suite}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{sPass} / {rs.length} PASS</div>
                    </div>
                    <div className="space-y-1.5">
                      {rs.map((r, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 border ${
                            r.passed ? "border-primary/20 bg-primary/5" : "border-destructive/30 bg-destructive/10"
                          }`}
                        >
                          {r.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{r.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{r.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Tile({
  label, value, tone, icon: Icon,
}: {
  label: string; value: string; tone?: "pass" | "fail" | "warn" | "muted"; icon: React.ComponentType<{ className?: string }>;
}) {
  const accent =
    tone === "pass" ? "text-primary"
    : tone === "fail" ? "text-destructive"
    : tone === "warn" ? "text-yellow-400"
    : tone === "muted" ? "text-muted-foreground"
    : "text-foreground";
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        <div className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{label}</div>
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${accent}`}>{value}</div>
    </div>
  );
}
