"use client";

// Citation chip. Corpus citations open the quote drawer; curriculum citations (lesson block /
// bank question, Loop 06) are links that deep-link to `#block-<n>` on the lesson page or to the
// practice question — the chip text is the same "Technicals › …" title the model saw.
import Link from "next/link";
import type { Citation } from "@/lib/chat/types";

const CLASS = "inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted hover:border-muted hover:text-fg";

export function CitationChip({ index, citation, onOpen }: { index: number; citation: Citation; onOpen: (c: Citation, i: number) => void }) {
  if (citation.kind !== "corpus" && citation.href) {
    return (
      <Link href={citation.href} className={CLASS} title={citation.quote} data-testid="citation-chip" data-kind={citation.kind} data-href={citation.href}>
        <span className="font-mono text-accent">[{index}]</span>
        <span aria-hidden>{citation.kind === "lesson" ? "📖" : "❓"}</span>
        <span className="truncate">{citation.label.replace(/^Technicals › /, "")}</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(citation, index)} className={CLASS} title={citation.quote} data-testid="citation-chip" data-kind="corpus">
      <span className="font-mono text-accent">[{index}]</span>
      <span className="truncate">{citation.label}</span>
    </button>
  );
}
