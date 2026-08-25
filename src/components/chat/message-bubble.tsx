"use client";

import { cn } from "@/lib/cn";
import type { Citation, Rung } from "@/lib/chat/types";
import { CitationChip } from "./citation-chip";
import { FeedbackButtons } from "./feedback-buttons";

export type BubbleProps = {
  id: string | null;
  role: "user" | "assistant";
  text: string;
  citations: Citation[];
  rung?: Rung;
  pending?: boolean;
  vote: 1 | -1 | null;
  onOpenCitation: (c: Citation, i: number) => void;
};

export function MessageBubble({ id, role, text, citations, rung, pending, vote, onOpenCitation }: BubbleProps) {
  const mine = role === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")} data-testid={mine ? "user-bubble" : "assistant-bubble"} data-pending={pending ? "1" : undefined}>
      <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed", mine ? "bg-accent text-accent-fg" : "border border-border bg-surface text-fg")}>
        {!mine && rung && rung !== "corpus" && (
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted" data-testid="rung">
            {rung === "prior" ? "Standard answer — not from the mentor corpus" : "From the curriculum"}
          </p>
        )}
        <div className="whitespace-pre-wrap" data-testid="bubble-text">
          {text}
          {pending && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-muted align-middle" aria-label="Typing" />}
        </div>
        {!mine && citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="citations">
            {citations.map((c, i) => (
              <CitationChip key={c.chunk_id} index={i + 1} citation={c} onOpen={onOpenCitation} />
            ))}
          </div>
        )}
        {!mine && id && !pending && (
          <div className="mt-2 flex justify-end">
            <FeedbackButtons messageId={id} initial={vote} />
          </div>
        )}
      </div>
    </div>
  );
}
