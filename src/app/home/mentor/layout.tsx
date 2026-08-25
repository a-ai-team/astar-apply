import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { listThreads } from "@/lib/chat/store";
import { ChatLayout } from "@/components/chat/chat-layout";

export const metadata: Metadata = { title: "Mentor — A* Apply", robots: { index: false, follow: false } };

export default async function MentorLayout({ children }: LayoutProps<"/home/mentor">) {
  const session = await verifySession("/home/mentor");
  const threads = await listThreads(createAdminClient(), session.userId);
  return <ChatLayout threads={threads.map((t) => ({ id: t.id, title: t.title, last_message_at: t.last_message_at }))}>{children}</ChatLayout>;
}
