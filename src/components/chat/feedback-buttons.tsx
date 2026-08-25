"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

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
  const base = "rounded px-1.5 py-0.5 text-sm transition hover:bg-surface";
  return (
    <div className="flex items-center gap-1 text-muted" data-testid="feedback">
      <button type="button" aria-label="Thumbs up" aria-pressed={vote === 1} className={cn(base, vote === 1 && "text-accent")} onClick={() => send(1)} disabled={busy} data-testid="thumbs-up">👍</button>
      <button type="button" aria-label="Thumbs down" aria-pressed={vote === -1} className={cn(base, vote === -1 && "text-danger")} onClick={() => send(-1)} disabled={busy} data-testid="thumbs-down">👎</button>
    </div>
  );
}
