"use client";

import type { Citation } from "@/lib/chat/types";

export function CitationChip({ index, citation, onOpen }: { index: number; citation: Citation; onOpen: (c: Citation, i: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(citation, index)}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted hover:border-muted hover:text-fg"
      title={citation.quote}
      data-testid="citation-chip"
    >
      <span className="font-mono text-accent">[{index}]</span>
      <span className="truncate">{citation.label}</span>
    </button>
  );
}
