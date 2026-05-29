import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Activity, Boxes, ShieldAlert, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Memory Supply Control Tower — AI Planning Command Center" },
      { name: "description", content: "Executive command center for semiconductor memory supply planning. Forecast demand, manage supplier risk, simulate disruptions, and act with AI guidance." },
      { property: "og:title", content: "Memory Supply Control Tower" },
      { property: "og:description", content: "AI-powered semiconductor memory planning command center." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.08] pointer-events-none" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

      <header className="relative z-10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="font-mono text-sm tracking-wider text-muted-foreground">
            MEMORY · CONTROL TOWER
          </div>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          v1.0 · Synthetic Demo
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-8 pt-16 pb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-8">
          <Sparkles className="w-3 h-3" /> AI Planning Intelligence · Executive Command Center
        </div>

        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl">
          The supply control tower for{" "}
          <span className="text-gradient-primary">AI-era memory planning</span>.
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Forecast HBM and GDDR demand across AI accelerator programs, monitor supplier
          capacity in real time, simulate shocks before they happen, and ship executive
          decisions backed by an AI strategic copilot.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition-colors glow-primary"
          >
            Enter Demo Command Center
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/case-study"
            className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-6 py-3.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            View Case Study
          </Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-4">
          {[
            { icon: Activity, title: "Planning Intelligence Score", body: "Composite KPI across shortage risk, inventory health, supplier concentration, forecast confidence, and purchase readiness." },
            { icon: Boxes, title: "Supply Shock Library", body: "Prebuilt scenarios — supplier outages, yield events, hyperscaler surges, geopolitical restrictions — one click to model." },
            { icon: ShieldAlert, title: "Executive Decision Timeline", body: "Every simulation generates Day 0/15/30/60/90 impact + recovery estimate, with AI-written executive narrative." },
          ].map((c) => (
            <div key={c.title} className="glass rounded-xl p-6">
              <c.icon className="w-5 h-5 text-primary mb-4" />
              <div className="font-semibold mb-2">{c.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border px-8 py-6 text-xs text-muted-foreground">
        Demo uses synthetic semiconductor planning data for portfolio demonstration purposes.
        No proprietary NVIDIA or supplier information is used.
      </footer>
    </div>
  );
}
