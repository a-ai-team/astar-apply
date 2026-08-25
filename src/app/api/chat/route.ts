// POST /api/chat — { threadId?, message } → SSE stream of ChatEvents (retrieval | delta | citation
// | done | error). Verifies the session, enforces CHAT_DAILY_CAP via increment_usage(), persists
// both messages. Node runtime; bridges the Anthropic SDK stream via an async generator.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatDailyCap, resolveChatMode } from "@/lib/chat/mode";
import { loadMentorNames, runPipeline } from "@/lib/chat/pipeline";
import { sseResponse } from "@/lib/chat/sse";
import { createThread, getThread, incrementUsage, insertAssistantMessage, insertUserMessage, loadHistory } from "@/lib/chat/store";
import type { ChatEvent } from "@/lib/chat/types";

export const maxDuration = 60;

const Body = z.object({
  threadId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request", issues: parsed.error.issues }, { status: 400 });
  const { threadId, message } = parsed.data;
  const db = createAdminClient();

  const thread = threadId ? await getThread(db, session.userId, threadId) : null;
  if (threadId && !thread) return NextResponse.json({ error: "thread not found" }, { status: 404 });

  const cap = chatDailyCap();
  const count = await incrementUsage(db, session.userId, { messages: 1 });
  if (count > cap) {
    await incrementUsage(db, session.userId, { messages: -1 });
    return NextResponse.json({ error: "daily cap reached", cap }, { status: 429, headers: { "Retry-After": String(secondsUntilMidnightUtc()) } });
  }

  const mode = await resolveChatMode();
  const events = (async function* (): AsyncGenerator<ChatEvent> {
    const t = thread ?? (await createThread(db, session.userId, message));
    const history = await loadHistory(db, t.id);
    await insertUserMessage(db, t.id, message);
    const mentorNames = await loadMentorNames(db);
    const gen = runPipeline({ db, message, history, mode, mentorNames });
    let r = await gen.next();
    while (!r.done) {
      const ev = r.value;
      if (ev.type === "done") {
        const messageId = await insertAssistantMessage(db, t.id, ev);
        if (ev.content.usage) await incrementUsage(db, session.userId, { input_tokens: ev.content.usage.input_tokens, output_tokens: ev.content.usage.output_tokens });
        yield { ...ev, messageId, threadId: t.id };
      } else {
        yield ev;
      }
      r = await gen.next();
    }
  })();
  return sseResponse(events, { onError: (e) => console.error("chat: stream failed", e) });
}

function secondsUntilMidnightUtc(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.floor((next - now.getTime()) / 1000));
}
