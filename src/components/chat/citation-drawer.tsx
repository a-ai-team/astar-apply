"use client";

import { Dialog } from "@/components/ui";
import type { Citation } from "@/lib/chat/types";

export function CitationDrawer({ open, citation, index, onClose }: { open: boolean; citation: Citation | null; index: number; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} className="[&>h2]:font-display [&>h2]:text-[1.35rem] [&>h2]:font-medium [&>h2]:tracking-[-0.01em]" title={citation ? `${index}. ${citation.label}` : "Citation"}>
      {citation && (
        <div className="flex flex-col gap-3" data-testid="citation-drawer">
          <blockquote className="border-l border-accent pl-4 text-sm leading-relaxed text-fg">{citation.quote}</blockquote>
          <p className="text-xs text-muted">
            {citation.kind === "corpus" ? "From the mentor corpus" : citation.kind === "lesson" ? "From a Technicals lesson" : "From the question bank"} · chunk <span className="font-mono">{citation.chunk_id.slice(0, 8)}</span>
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
