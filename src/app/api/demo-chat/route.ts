// POST /api/demo-chat — the landing-page "Ask a mentor who got in" demo. Unauthenticated,
// corpus-only rung (mentor material only, never the curriculum), no persistence, capped at
// DEMO_CHAT_DAILY_CAP per hashed IP per UTC day. Always the fixture composer unless
// DEMO_CHAT_MODE=live (no Anthropic spend by default — Loop 10 hard fact 2). Returns JSON, not SSE.
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveChatMode } from "@/lib/chat/mode";
import { rewriteQuery } from "@/lib/chat/rewrite";
import { retrieve } from "@/lib/chat/retrieve";
import { answerFixture, answerLive } from "@/lib/chat/answer";
import { loadMentorNames } from "@/lib/chat/pipeline";
import { bumpDemoUsage, clientIp, demoCap, hashIp, overCap } from "@/lib/demo/usage";
import type { ChatMode } from "@/lib/chat/types";

export const maxDuration = 30;

const Body = z.object({ message: z.string().trim().min(3).max(500) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ask a question between 3 and 500 characters." }, { status: 400 });
  const cap = demoCap();
  const ipHash = hashIp(clientIp(req.headers));
  const db = createAdminClient();
  const count = await bumpDemoUsage(ipHash, db);
  if (overCap(count, cap)) {
    return NextResponse.json({ error: `That's ${cap} demo questions for today — create a free account to keep going.`, cap, remaining: 0 }, { status: 429 });
  }
  const mode: ChatMode = process.env.DEMO_CHAT_MODE === "live" ? await resolveChatMode() : "fixture";
  const message = parsed.data.message;
  const rewrite = await rewriteQuery(message, [], mode);
  const mentorNames = await loadMentorNames(db);
  const { chunks } = await retrieve(db, rewrite, { mode, mentorNames, sources: ["corpus"], topN: 4 });
  const answer = mode === "live" ? answerLive : answerFixture;
  const gen = answer({ question: message, history: [], chunks, rung: chunks.length ? "corpus" : "prior", context: null });
  let r = await gen.next();
  while (!r.done) r = await gen.next();
  const content = r.value.content;
  return NextResponse.json({
    text: content.text,
    rung: content.rung,
    citations: content.citations.slice(0, 3).map((c) => ({ label: c.label, quote: c.quote.slice(0, 160) })),
    remaining: Math.max(0, cap - count),
    mode,
  });
}
