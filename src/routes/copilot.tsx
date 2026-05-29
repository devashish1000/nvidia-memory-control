import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, User, Bot } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { askCopilot } from "@/lib/copilot.functions";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "AI Strategic Copilot — Memory Control Tower" },
      { name: "description", content: "Conversational AI grounded in live planning data for memory supply decisions." },
    ],
  }),
  component: Copilot,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What is driving our revenue at risk this quarter?",
  "Which suppliers should we de-risk first?",
  "Recommend a purchase plan for HBM3e.",
  "What happens if TSMC CoWoS capacity drops 30%?",
];

function Copilot() {
  const ask = useServerFn(askCopilot);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I'm your Strategic Copilot. I'm grounded in your live Planning Intelligence snapshot — demand, capacity, inventory, suppliers, risks. Ask me anything operational or strategic.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mut = useMutation({
    mutationFn: async (next: Msg[]) => ask({ data: { messages: next } }),
    onSuccess: (res) => {
      const reply = res.ok ? res.content : `⚠️ ${res.error}`;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mut.isPending]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || mut.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    mut.mutate(next.filter((m) => m.role === "user" || m.role === "assistant"));
  };

  return (
    <AppShell>
      <div className="px-10 py-8 max-w-5xl mx-auto h-screen flex flex-col">
        <PageHeader
          kicker="INTELLIGENCE / COPILOT"
          title="AI Strategic Copilot"
          description="Conversational reasoning over your live supply chain. Every answer is grounded in the current planning snapshot."
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[78%] whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary/15 border border-primary/30 text-foreground"
                    : "glass border border-border/60 text-foreground"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-md bg-secondary grid place-items-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          {mut.isPending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              </div>
              <div className="glass rounded-xl px-4 py-3 text-xs text-muted-foreground">Reasoning over live snapshot…</div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-xs glass rounded-lg px-3 py-2.5 border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-3 h-3 text-primary" />
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 glass rounded-xl border border-border/60 p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about shortages, suppliers, scenarios, purchase plans…"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            disabled={mut.isPending}
          />
          <button
            type="submit"
            disabled={mut.isPending || !input.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-2 disabled:opacity-40"
          >
            {mut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send
          </button>
        </form>
      </div>
    </AppShell>
  );
}
