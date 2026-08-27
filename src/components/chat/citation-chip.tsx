"use client";

// Citation chip. Corpus citations open the quote drawer; curriculum citations (lesson block /
// bank question, Loop 06) are links that deep-link to `#block-<n>` on the lesson page or to the
// practice question — the chip text is the same "Technicals › …" title the model saw.
// Hairline pill: transparent ground, gold mono numeral, muted label; the border warms on hover.
import Link from "next/link";
import type { Citation } from "@/lib/chat/types";

const CLASS = "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-[0.75rem] leading-none text-muted transition-colors hover:border-accent/60 hover:text-fg focus-visible:border-accent/60 focus-visible:outline-none";

function Numeral({ index }: { index: number }) {
  return <span className="font-mono text-[0.7rem] tabular-nums text-accent">{index}</span>;
}

function Glyph({ kind }: { kind: "lesson" | "question" }) {
  const common = { width: 12, height: 12, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, className: "shrink-0 opacity-80" };
  return kind === "lesson" ? (
    <svg {...common}><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2H7a1.5 1.5 0 0 1 1 .4A1.5 1.5 0 0 1 9 2h3.5A1.5 1.5 0 0 1 14 3.5V13a1 1 0 0 1-1 1H9.5a1.5 1.5 0 0 0-1.5.6A1.5 1.5 0 0 0 6.5 14H3a1 1 0 0 1-1-1V3.5Z" /><path d="M8 2.4V14.6" /></svg>
  ) : (
    <svg {...common}><circle cx="8" cy="8" r="6.25" /><path d="M6.2 6.3a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.7-.8 1.2v.3" /><circle cx="8" cy="11.4" r=".5" fill="currentColor" stroke="none" /></svg>
  );
}

export function CitationChip({ index, citation, onOpen }: { index: number; citation: Citation; onOpen: (c: Citation, i: number) => void }) {
  if (citation.kind !== "corpus" && citation.href) {
    return (
      <Link href={citation.href} className={CLASS} title={citation.quote} data-testid="citation-chip" data-kind={citation.kind} data-href={citation.href}>
        <Numeral index={index} />
        <Glyph kind={citation.kind === "lesson" ? "lesson" : "question"} />
        <span className="truncate">{citation.label.replace(/^Technicals › /, "")}</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(citation, index)} className={CLASS} title={citation.quote} data-testid="citation-chip" data-kind="corpus">
      <Numeral index={index} />
      <span className="truncate">{citation.label}</span>
    </button>
  );
}
