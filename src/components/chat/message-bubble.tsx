"use client";

import { cn } from "@/lib/cn";
import type { Citation, Rung } from "@/lib/chat/types";
import { Markdown } from "@/components/lesson/markdown";
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
  if (role === "user") {
    return (
      <div className="flex justify-end" data-testid="user-bubble">
        <div className="max-w-[70%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-border bg-surface px-4 py-3 text-[0.95rem] leading-[1.7] text-fg" data-testid="bubble-text">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="group flex justify-start" data-testid="assistant-bubble" data-pending={pending ? "1" : undefined}>
      <div className="min-w-0 max-w-full border-l border-accent/50 pl-5">
        {rung && rung !== "corpus" && (
          <p className="mb-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted" data-testid="rung">
            {rung === "prior" ? "Standard answer — not from the mentor corpus" : "From the curriculum"}
          </p>
        )}
        <div className="text-fg" data-testid="bubble-text">
          {text ? <Markdown md={text} className="prose-chat" /> : null}
          {pending && <span className="ml-0.5 inline-block h-[1.05em] w-px animate-caret bg-accent align-[-0.2em]" aria-label="Typing" />}
        </div>
        {citations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" data-testid="citations">
            {citations.map((c, i) => (
              <CitationChip key={c.chunk_id} index={i + 1} citation={c} onOpen={onOpenCitation} />
            ))}
          </div>
        )}
        {id && !pending && (
          <div className={cn("mt-3 flex justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 has-[[aria-pressed=true]]:opacity-100")}>
            <FeedbackButtons messageId={id} initial={vote} />
          </div>
        )}
      </div>
    </div>
  );
}
