import type { ReactNode } from "react";

// Thread list / "Threads + New" header removed for now — the chat panel takes the full width.
// Threads are still persisted server-side and `/home/mentor/[threadId]` stays routable (unlinked).
export function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-my-8 flex min-h-0 flex-1 flex-col md:-mx-8" data-testid="chat-layout">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</section>
    </div>
  );
}
