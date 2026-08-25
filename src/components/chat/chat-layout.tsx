import type { ReactNode } from "react";
import { ThreadList, type ThreadSummary } from "./thread-list";

export function ChatLayout({ threads, children }: { threads: ThreadSummary[]; children: ReactNode }) {
  return (
    <div className="-my-8 flex min-h-0 flex-1 flex-col gap-0 md:-mx-8 md:flex-row" data-testid="chat-layout">
      <ThreadList threads={threads} />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</section>
    </div>
  );
}
