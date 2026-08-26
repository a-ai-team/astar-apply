// /home/mentor/new?question=<uuid>&attempt=<uuid> | ?lesson=<uuid>&block=<n> — "Ask Mentor about
// this" landing (Loop 06). Resolves the item through the cookie client (RLS → approved rows only,
// the caller's own attempt), then mounts ChatPanel with the thread context and a first message
// that quotes the item; the panel sends it automatically and navigates to the new thread.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { firstMessageFor, loadThreadContext, parseThreadContext } from "@/lib/chat/context";
import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata: Metadata = { title: "Ask Mentor — A* Apply", robots: { index: false, follow: false } };

export default async function NewThreadPage({ searchParams }: PageProps<"/home/mentor/new">) {
  const session = await verifySession("/home/mentor");
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? undefined;
  const block = Number(one("block"));
  const context = parseThreadContext({ question_id: one("question"), lesson_id: one("lesson"), attempt_id: one("attempt"), block_index: Number.isInteger(block) ? block : undefined });
  if (!context) notFound();
  const bundle = await loadThreadContext(await createClient(), context, session.userId);
  if (!bundle) notFound();
  return <ChatPanel threadId={null} initialMessages={[]} initialFeedback={{}} context={context} contextChip={{ label: bundle.label, href: bundle.href }} autoSend={firstMessageFor(bundle)} />;
}
