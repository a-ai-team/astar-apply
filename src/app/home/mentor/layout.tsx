import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { verifySession } from "@/lib/dal";
import { ChatLayout } from "@/components/chat/chat-layout";
import "katex/dist/katex.min.css";

// Display serif for the mentor chat only (exposed as --font-display, see globals.css `.mentor-theme`).
const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"], display: "swap" });

export const metadata: Metadata = { title: "Mentor — A* Apply", robots: { index: false, follow: false } };

export default async function MentorLayout({ children }: LayoutProps<"/home/mentor">) {
  await verifySession("/home/mentor");
  return (
    <div className={`mentor-theme ${display.variable} -my-8 flex min-h-0 flex-1 flex-col md:-mx-8`}>
      <ChatLayout>{children}</ChatLayout>
    </div>
  );
}
