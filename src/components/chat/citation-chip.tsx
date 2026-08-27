"use client";

// Citation chip. Corpus citations open the quote drawer; curriculum citations (lesson block /
// bank question, Loop 06) are links that deep-link to `#block-<n>` on the lesson page or to the
// practice question — the chip text is the same "Technicals › …" title the model saw.
import Link from "next/link";
import type { Citation } from "@/lib/chat/types";

const CLASS = "inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-transparent px-3 py-1 text-xs text-muted transition hover:border-accent/60 hover:text-fg";

function Glyph({ kind }: { kind: "lesson" | "question" }) {
  const common = { width: 12, height: 12, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  return kind === "lesson" ? (
    <svg {...common}><path d="M2 3.5h4.5A1.5 1.5 0 0 1 8 5v9a1.5 1.5 0 0 0-1.5-1.5H2zM14 3.5H9.5A1.5 1.5 0 0 0 8 5v9a1.5 1.5 0 0 1 1.5-1.5H14z" /></svg>
  ) : (
    <svg {...common}><path d="M5.5 6a2.5 2.5 0 1 1 3.6 2.24C8.4 8.6 8 9.1 8 9.8v.4" /><circle cx="8" cy="13" r="0.5" fill="currentColor" /></svg>
  );
}

export function CitationChip({ index, citation, onOpen }: { index: number; citation: Citation; onOpen: (c: Citation, i: number) => void }) {
  const numeral = <span className="font-mono text-[0.7rem] text-accent">{index}</span>;
  if (citation.kind !== "corpus" && citation.href) {
    return (
      <Link href={citation.href} className={CLASS} title={citation.quote} data-testid="citation-chip" data-kind={citation.kind} data-href={citation.href}>
        {numeral}
        <Glyph kind={citation.kind === "lesson" ? "lesson" : "question"} />
        <span className="truncate">{citation.label.replace(/^Technicals › /, "")}</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(citation, index)} className={CLASS} title={citation.quote} data-testid="citation-chip" data-kind="corpus">
      {numeral}
      <span className="truncate">{citation.label}</span>
    </button>
  );
}
