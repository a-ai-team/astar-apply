"use client";

import { Dialog } from "@/components/ui";
import type { Citation } from "@/lib/chat/types";

export function CitationDrawer({ open, citation, index, onClose }: { open: boolean; citation: Citation | null; index: number; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} className="rounded-2xl">
      {citation && (
        <div className="flex flex-col gap-4" data-testid="citation-drawer">
          <h2 className="flex items-baseline gap-3 font-display text-[1.5rem] font-medium leading-tight tracking-[-0.01em] text-fg">
            <span className="font-mono text-[0.8rem] text-accent">{index}</span>
            <span className="[text-wrap:balance]">{citation.label}</span>
          </h2>
          <blockquote className="border-l border-accent pl-4 text-[0.95rem] leading-[1.7] text-fg">{citation.quote}</blockquote>
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-muted">
            {citation.kind === "corpus" ? "From the mentor corpus" : citation.kind === "lesson" ? "From a Technicals lesson" : "From the question bank"} · <span className="font-mono normal-case tracking-normal">{citation.chunk_id.slice(0, 8)}</span>
            {citation.href && (
              <>
                {" · "}
                <a href={citation.href} className="text-accent hover:underline">open</a>
              </>
            )}
          </p>
        </div>
      )}
    </Dialog>
  );
}
