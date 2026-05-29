import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Loader2, X, Presentation } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { generateBoardroomNarrative } from "@/lib/copilot.functions";

export const Route = createFileRoute("/boardroom")({
  head: () => ({
    meta: [
      { title: "Boardroom Mode — Memory Control Tower" },
      { name: "description", content: "Full-screen AI-narrated boardroom presentation of the supply plan." },
    ],
  }),
  component: Boardroom,
});

type Slide = { title: string; kicker: string; bullets: string[]; metric: { label: string; value: string } | null };

function Boardroom() {
  const fn = useServerFn(generateBoardroomNarrative);
  const q = useQuery({ queryKey: ["boardroom-narrative"], queryFn: () => fn() });
  const [present, setPresent] = useState(false);
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);

  const slides: Slide[] = q.data?.ok ? (q.data.slides as Slide[]) : [];

  useEffect(() => {
    if (!present || !auto || !slides.length) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % slides.length), 7000);
    return () => clearTimeout(t);
  }, [present, auto, idx, slides.length]);

  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "Escape") setPresent(false);
      if (e.key === " ") setAuto((a) => !a);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, slides.length]);

  if (present && slides.length) {
    const s = slides[idx];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-mono text-muted-foreground z-10">
          <span>{idx + 1} / {slides.length}</span>
          <button onClick={() => setAuto((a) => !a)} className="p-1.5 rounded-md border border-border hover:bg-secondary">
            {auto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setPresent(false)} className="p-1.5 rounded-md border border-border hover:bg-secondary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5 }}
            className="flex-1 grid place-items-center px-24"
          >
            <div className="max-w-5xl w-full">
              <div className="text-[11px] font-mono tracking-[0.3em] text-primary mb-6">{s.kicker}</div>
              <h2 className="text-6xl font-semibold tracking-tight leading-tight mb-10">{s.title}</h2>
              {s.metric && (
                <div className="mb-10 inline-block">
                  <div className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase mb-2">{s.metric.label}</div>
                  <div className="text-7xl font-semibold text-primary tracking-tight">{s.metric.value}</div>
                </div>
              )}
              <ul className="space-y-4">
                {s.bullets.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                    className="flex gap-4 text-xl text-muted-foreground"
                  >
                    <span className="text-primary font-mono">0{i + 1}</span>
                    <span className="text-foreground/90">{b}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} className="p-2 rounded-md border border-border hover:bg-secondary disabled:opacity-30" disabled={idx === 0}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1 px-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-1.5 bg-muted"}`} />
            ))}
          </div>
          <button onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))} className="p-2 rounded-md border border-border hover:bg-secondary disabled:opacity-30" disabled={idx === slides.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="px-10 py-8">
        <PageHeader
          kicker="INTELLIGENCE / BOARDROOM"
          title="Boardroom Mode"
          description="AI-generated, full-screen narrative of the supply plan. Built from your live data — ready to project."
        />

        {q.isLoading ? (
          <div className="glass rounded-xl p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Composing boardroom narrative…
          </div>
        ) : !q.data?.ok ? (
          <div className="glass rounded-xl p-12 text-center text-sm text-muted-foreground">
            {q.data && "error" in q.data ? q.data.error : "Narrative unavailable."}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-mono text-muted-foreground">{slides.length} SLIDES · AI-GENERATED FROM LIVE SNAPSHOT</div>
              <button
                onClick={() => { setIdx(0); setPresent(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium"
              >
                <Presentation className="w-3.5 h-3.5" /> Present
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setIdx(i); setPresent(true); }}
                  className="glass rounded-xl p-5 text-left hover:border-primary/40 border border-border/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-mono tracking-wider text-primary">{s.kicker}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                  </div>
                  <div className="text-lg font-semibold tracking-tight mb-3">{s.title}</div>
                  {s.metric && (
                    <div className="mb-3">
                      <div className="text-[9px] font-mono text-muted-foreground uppercase">{s.metric.label}</div>
                      <div className="text-2xl font-semibold text-primary">{s.metric.value}</div>
                    </div>
                  )}
                  <ul className="space-y-1.5">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-primary">·</span> {b}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
