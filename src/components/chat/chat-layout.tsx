import type { ReactNode } from "react";

// Thread list / "Threads + New" header removed for now — the chat panel takes the full width.
// Threads are still persisted server-side and `/home/mentor/[threadId]` stays routable (unlinked).
// The negative margins that undo the app-shell padding live on the `.mentor-theme` wrapper in
// src/app/home/mentor/layout.tsx so the navy ground bleeds edge to edge.
export function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="chat-layout">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</section>
    </div>
  );
}
