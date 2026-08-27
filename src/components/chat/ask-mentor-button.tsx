"use client";

// "Ask Mentor about this" (Loop 06). A link to /home/mentor/new carrying the item reference; the
// landing page resolves it (approved rows only), pins it as the thread context and auto-sends the
// opening message. Client component because it mounts inside QuestionCard / FlashcardSession.
import Link from "next/link";
import { cn } from "@/lib/cn";

export type AskMentorTarget =
  | { kind: "question"; questionId: string; attemptId?: string | null }
  | { kind: "lesson"; lessonId: string; blockIndex: number };

export function askMentorHref(t: AskMentorTarget): string {
  const q = new URLSearchParams();
  if (t.kind === "question") {
    q.set("question", t.questionId);
    if (t.attemptId) q.set("attempt", t.attemptId);
  } else {
    q.set("lesson", t.lessonId);
    q.set("block", String(t.blockIndex));
  }
  return `/home/mentor/new?${q.toString()}`;
}

export function AskMentorButton({ target, size = "sm", className, label = "Ask Mentor about this" }: { target: AskMentorTarget; size?: "sm" | "xs"; className?: string; label?: string }) {
  return (
    <Link
      href={askMentorHref(target)}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-surface text-muted hover:border-muted hover:text-fg",
        size === "sm" ? "px-2.5 py-1.5 text-sm" : "px-2 py-1 text-xs",
        className,
      )}
      data-testid="ask-mentor"
      data-target={t(target)}
    >
      <span aria-hidden className="text-accent">✦</span>
      {label}
    </Link>
  );
}

function t(target: AskMentorTarget): string {
  return target.kind === "question" ? `question:${target.questionId}` : `lesson:${target.lessonId}:${target.blockIndex}`;
}
