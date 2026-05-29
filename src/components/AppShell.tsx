import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, LayoutDashboard, TrendingUp, Factory, Boxes, ShoppingCart,
  AlertOctagon, FlaskConical, Cpu, Sparkles, Radio, Presentation, Shield, TestTube, FileText,
} from "lucide-react";
import { ReactNode } from "react";

const NAV = [
  { group: "Plan", items: [
    { to: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
    { to: "/forecast", label: "Demand Forecast", icon: TrendingUp },
    { to: "/capacity", label: "Supplier Capacity", icon: Factory },
    { to: "/inventory", label: "Inventory Coverage", icon: Boxes },
    { to: "/purchasing", label: "Purchase Engine", icon: ShoppingCart },
  ]},
  { group: "Risk & Sim", items: [
    { to: "/risk", label: "Risk Heatmap", icon: AlertOctagon },
    { to: "/scenarios", label: "Scenario Simulator", icon: FlaskConical },
    { to: "/twin", label: "Digital Twin", icon: Cpu },
  ]},
  { group: "Intelligence", items: [
    { to: "/copilot", label: "AI Copilot", icon: Sparkles, disabled: true },
    { to: "/war-room", label: "Executive War Room", icon: Radio, disabled: true },
    { to: "/boardroom", label: "Boardroom Mode", icon: Presentation, disabled: true },
  ]},
  { group: "Operations", items: [
    { to: "/data-quality", label: "Data Quality", icon: Shield, disabled: true },
    { to: "/tests", label: "Test Center", icon: TestTube, disabled: true },
    { to: "/case-study", label: "Case Study", icon: FileText },
  ]},
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-card/40 backdrop-blur px-4 py-6 sticky top-0 h-screen overflow-y-auto">
        <Link to="/" className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-wider text-muted-foreground">CONTROL TOWER</div>
            <div className="text-xs font-semibold">Memory Supply</div>
          </div>
        </Link>

        {NAV.map((group) => (
          <div key={group.group} className="mb-6">
            <div className="px-2 mb-2 text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
              {group.group}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const active = path === item.to;
                const Icon = item.icon;
                const cls = `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors ${
                  active ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`;
                if (item.disabled) {
                  return (
                    <div key={item.to} className={cls} title="Coming in a later phase">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto text-[9px] font-mono">SOON</span>
                    </div>
                  );
                }
                return (
                  <Link key={item.to} to={item.to} className={cls}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        <div className="mt-auto pt-6 px-2 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            LIVE · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ kicker, title, description }: { kicker: string; title: string; description?: string }) {
  return (
    <header className="mb-8">
      <div className="text-xs font-mono text-muted-foreground mb-2">{kicker}</div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>}
    </header>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="glass rounded-xl p-12 text-center">
      <div className="text-sm font-semibold mb-1">{title}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
