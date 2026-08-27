// thread history hidden for now — James, 2026-08-27 (routable but unlinked)
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { feedbackForThread, getThread, listMessages } from "@/lib/chat/store";
import { loadThreadContext } from "@/lib/chat/context";
import { ChatPanel, type UiMessage } from "@/components/chat/chat-panel";

export default async function ThreadPage({ params }: PageProps<"/home/mentor/[threadId]">) {
  const session = await verifySession("/home/mentor");
  const { threadId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(threadId)) notFound();
  const db = createAdminClient();
  const thread = await getThread(db, session.userId, threadId);
  if (!thread) notFound();
  const [messages, feedback, bundle] = await Promise.all([
    listMessages(db, threadId),
    feedbackForThread(db, session.userId, threadId),
    loadThreadContext(db, thread.context, session.userId).catch(() => null),
  ]);
  const initial: UiMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.content.text ?? "",
    citations: "citations" in m.content ? m.content.citations : [],
    rung: "rung" in m.content ? m.content.rung : undefined,
    pending: false,
  }));
  return <ChatPanel threadId={threadId} title={thread.title} initialMessages={initial} initialFeedback={Object.fromEntries(feedback)} context={thread.context} contextChip={bundle ? { label: bundle.label, href: bundle.href } : null} />;
}
