// POST /api/chat/feedback — { messageId, vote: 1|-1, comment? } → upsert into chat_feedback
// (unique per message + user). Only messages inside the caller's own threads are accepted.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { messageOwnedBy, upsertFeedback } from "@/lib/chat/store";

const Body = z.object({
  messageId: z.string().uuid(),
  vote: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().trim().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request", issues: parsed.error.issues }, { status: 400 });
  const db = createAdminClient();
  const { messageId, vote, comment } = parsed.data;
  if (!(await messageOwnedBy(db, session.userId, messageId))) return NextResponse.json({ error: "message not found" }, { status: 404 });
  await upsertFeedback(db, session.userId, messageId, vote, comment ?? null);
  return NextResponse.json({ ok: true, messageId, vote });
}
