"use client";

import { Dialog } from "@/components/ui";
import type { Citation } from "@/lib/chat/types";

export function CitationDrawer({ open, citation, index, onClose }: { open: boolean; citation: Citation | null; index: number; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={citation ? `[${index}] ${citation.label}` : "Citation"}>
      {citation && (
        <div className="flex flex-col gap-3" data-testid="citation-drawer">
          <blockquote className="border-l-2 border-accent pl-3 text-sm leading-relaxed text-fg">{citation.quote}</blockquote>
          <p className="text-xs text-muted">
            From the mentor corpus · chunk <span className="font-mono">{citation.chunk_id.slice(0, 8)}</span>
          </p>
        </div>
      )}
    </Dialog>
  );
}
