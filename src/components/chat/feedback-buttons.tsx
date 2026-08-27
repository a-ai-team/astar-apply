"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

function Thumb({ down }: { down?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn(down && "rotate-180")}>
      <path d="M5 7.5v6H2.5a.5.5 0 0 1-.5-.5V8a.5.5 0 0 1 .5-.5H5Z" />
      <path d="M5 7.5 8 2.3a1.4 1.4 0 0 1 2.6.9L10 6.5h2.8a1.2 1.2 0 0 1 1.2 1.4l-.9 4.6a1.2 1.2 0 0 1-1.2 1H5" />
    </svg>
  );
}

export function FeedbackButtons({ messageId, initial }: { messageId: string; initial: 1 | -1 | null }) {
  const [vote, setVote] = useState<1 | -1 | null>(initial);
  const [busy, setBusy] = useState(false);
  async function send(v: 1 | -1) {
    if (busy) return;
    setBusy(true);
    const prev = vote;
    setVote(v);
    try {
      const res = await fetch("/api/chat/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, vote: v }) });
      if (!res.ok) setVote(prev);
    } catch {
      setVote(prev);
    } finally {
      setBusy(false);
    }
  }
  const base = "flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted transition hover:border-border hover:text-fg focus-visible:border-border focus-visible:outline-none disabled:opacity-60";
  return (
    <div className="flex items-center gap-1" data-testid="feedback">
      <button type="button" aria-label="Thumbs up" aria-pressed={vote === 1} className={cn(base, vote === 1 && "text-accent hover:text-accent")} onClick={() => send(1)} disabled={busy} data-testid="thumbs-up"><Thumb /></button>
      <button type="button" aria-label="Thumbs down" aria-pressed={vote === -1} className={cn(base, vote === -1 && "text-danger hover:text-danger")} onClick={() => send(-1)} disabled={busy} data-testid="thumbs-down"><Thumb down /></button>
    </div>
  );
}
