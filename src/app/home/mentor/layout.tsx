import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { ChatLayout } from "@/components/chat/chat-layout";

export const metadata: Metadata = { title: "Mentor — A* Apply", robots: { index: false, follow: false } };

export default async function MentorLayout({ children }: LayoutProps<"/home/mentor">) {
  await verifySession("/home/mentor");
  return <ChatLayout>{children}</ChatLayout>;
}
