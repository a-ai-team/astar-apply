import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { feedbackForThread, getThread, listMessages } from "@/lib/chat/store";
import { ChatPanel, type UiMessage } from "@/components/chat/chat-panel";

export default async function ThreadPage({ params }: PageProps<"/home/mentor/[threadId]">) {
  const session = await verifySession("/home/mentor");
  const { threadId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(threadId)) notFound();
  const db = createAdminClient();
  const thread = await getThread(db, session.userId, threadId);
  if (!thread) notFound();
  const [messages, feedback] = await Promise.all([listMessages(db, threadId), feedbackForThread(db, session.userId, threadId)]);
  const initial: UiMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.content.text ?? "",
    citations: "citations" in m.content ? m.content.citations : [],
    rung: "rung" in m.content ? m.content.rung : undefined,
    pending: false,
  }));
  return <ChatPanel threadId={threadId} title={thread.title} initialMessages={initial} initialFeedback={Object.fromEntries(feedback)} />;
}
