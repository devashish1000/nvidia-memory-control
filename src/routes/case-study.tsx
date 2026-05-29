import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/case-study")({
  head: () => ({
    meta: [
      { title: "Case Study — Memory Supply Control Tower" },
      { name: "description", content: "Architecture, planning logic, scenario engine, and business impact behind the AI Memory Supply Control Tower." },
    ],
  }),
  component: CaseStudy,
});

function CaseStudy() {
  return (
    <div className="min-h-screen max-w-3xl mx-auto px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-12">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="text-xs font-mono text-primary mb-3">CASE STUDY</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-8">AI Memory Supply Control Tower</h1>

      <div className="prose prose-invert max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">Business Problem</h2>
          <p className="text-muted-foreground leading-relaxed">
            AI accelerator programs depend on a small set of advanced memory and packaging suppliers.
            A single yield event, factory outage, or geopolitical restriction can wipe out a quarter of
            revenue. Planners need a command center that ties demand, capacity, inventory, risk, and
            scenario simulation into one decision surface.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Architecture</h2>
          <ul className="text-muted-foreground space-y-2 leading-relaxed">
            <li>· TanStack Start (React 19, SSR) with TanStack Query for data orchestration</li>
            <li>· Lovable Cloud (Supabase) — Postgres schema with RLS, public-read planning data</li>
            <li>· Server functions (createServerFn) for seed, scenarios, AI grounding</li>
            <li>· Lovable AI Gateway (Gemini 2.5 Flash) for the Strategic Copilot</li>
            <li>· Framer Motion for spring-based, executive-grade microinteractions</li>
            <li>· Tailwind v4 + glassmorphism, NVIDIA-inspired dark command-center palette</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Planning Logic</h2>
          <p className="text-muted-foreground leading-relaxed">
            All KPIs derive from pure-TS formulas: projected shortage, weeks of supply, purchase
            recommendation, supplier concentration, weighted risk score, and revenue at risk. The
            Planning Intelligence Score blends these into a single 0–100 composite weighted across
            shortage exposure, inventory health, supplier diversification, forecast confidence, and
            purchase readiness.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Scenario Engine</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Supply Shock Library ships 8 prebuilt templates — supplier outage, yield degradation,
            hyperscaler surge, AI launch spike, logistics disruption, geopolitical restriction,
            packaging constraint, substrate shortage. Each simulation produces an Executive Decision
            Timeline (Day 0/15/30/60/90 + recovery) with AI-generated narrative and a rule-based
            fallback for resilience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Business Impact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Designed for a Senior Memory Planner workflow: faster shortage identification, executive-ready
            disruption simulations, and AI-assisted recommendation generation. Built to feel like the
            software that planning organizations supporting AI infrastructure actually use.
          </p>
        </section>
      </div>

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
        Demo uses synthetic semiconductor planning data for portfolio demonstration purposes.
        No proprietary NVIDIA or supplier information is used.
      </footer>
    </div>
  );
}
