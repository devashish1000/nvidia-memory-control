import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDashboardSnapshot } from "./analytics.functions";

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

function buildSystemPrompt(snap: unknown) {
  return `You are the AI Strategic Copilot for an enterprise Memory Supply Control Tower used by Senior Memory Planners at a leading AI accelerator company.

You speak in concise, executive language. You ground every recommendation in the LIVE PLANNING SNAPSHOT below. You never invent numbers — if a value isn't in the snapshot, say so.

When asked for a recommendation, structure your answer as:
1. Diagnosis (1–2 sentences citing concrete numbers)
2. Risk (revenue at risk, exposure window)
3. Recommended action (specific, executable in the planning system)
4. Confidence (low / medium / high) with one-line rationale

Keep answers under 200 words unless the user asks for depth.

LIVE PLANNING SNAPSHOT (JSON):
${JSON.stringify(snap)}`;
}

export const askCopilot = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      messages: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          })
        )
        .min(1)
        .max(20),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI gateway is not configured." };
    }
    const snap = await getDashboardSnapshot();

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(snap) },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) return { ok: false as const, error: "Rate limit reached. Please retry shortly." };
    if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Add credits in workspace settings." };
    if (!res.ok) return { ok: false as const, error: `Gateway error (${res.status}).` };

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    return { ok: true as const, content };
  });

export const generateBoardroomNarrative = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.LOVABLE_API_KEY;
  const snap = await getDashboardSnapshot();
  if (!apiKey) return { ok: false as const, error: "AI gateway is not configured.", snap };

  const prompt = `Using the live planning snapshot below, produce a boardroom narrative as STRICT JSON matching:
{ "slides": [ { "title": string, "kicker": string, "bullets": string[] (3 short bullets), "metric": { "label": string, "value": string } | null } ] }

Generate exactly 5 slides covering: 1) Executive Summary, 2) Demand & Revenue at Risk, 3) Supplier Capacity & Concentration, 4) Inventory & Coverage, 5) Recommended Actions next 30 days.
All numbers must come from the snapshot.

SNAPSHOT: ${JSON.stringify(snap)}`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You return only valid JSON. No prose, no markdown." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return { ok: false as const, error: `Gateway error (${res.status}).`, snap };
  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return { ok: true as const, slides: parsed.slides ?? [], snap };
  } catch {
    return { ok: false as const, error: "Could not parse AI response.", snap };
  }
});

export const generateWarRoomCommentary = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.LOVABLE_API_KEY;
  const snap = await getDashboardSnapshot();
  if (!apiKey) return { ok: false as const, error: "AI gateway is not configured.", snap };

  const prompt = `Live operations war room. Given the snapshot, produce STRICT JSON:
{ "headline": string (max 18 words), "alerts": [ { "severity": "critical"|"high"|"medium", "title": string, "detail": string } ] (3 to 5 items), "nextActions": string[] (3 items, action-oriented, present tense) }

SNAPSHOT: ${JSON.stringify(snap)}`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You return only valid JSON. No prose, no markdown." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return { ok: false as const, error: `Gateway error (${res.status}).`, snap };
  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      ok: true as const,
      headline: parsed.headline ?? "",
      alerts: parsed.alerts ?? [],
      nextActions: parsed.nextActions ?? [],
      snap,
    };
  } catch {
    return { ok: false as const, error: "Could not parse AI response.", snap };
  }
});
