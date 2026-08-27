import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { ChatLayout } from "@/components/chat/chat-layout";
import "katex/dist/katex.min.css";

export const metadata: Metadata = { title: "Mentor — A* Apply", robots: { index: false, follow: false } };

export default async function MentorLayout({ children }: LayoutProps<"/home/mentor">) {
  await verifySession("/home/mentor");
  // Undo the app-shell padding so the chat runs edge to edge; only the message list scrolls.
  return (
    <div className="-my-8 flex min-h-0 flex-1 flex-col md:-mx-8">
      <ChatLayout>{children}</ChatLayout>
    </div>
  );
}
