"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

function Thumb({ down }: { down?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={down ? { transform: "rotate(180deg)" } : undefined}>
      <path d="M5 7v7H2.5V7zM5 7l2.8-5c1 0 1.7.8 1.7 1.8V6h3.3c.9 0 1.6.8 1.4 1.7l-.9 5.1c-.1.7-.7 1.2-1.4 1.2H5" />
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
  const base = "flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:text-fg";
  return (
    <div className="flex items-center gap-1" data-testid="feedback">
      <button type="button" aria-label="Thumbs up" aria-pressed={vote === 1} className={cn(base, vote === 1 && "text-accent hover:text-accent")} onClick={() => send(1)} disabled={busy} data-testid="thumbs-up"><Thumb /></button>
      <button type="button" aria-label="Thumbs down" aria-pressed={vote === -1} className={cn(base, vote === -1 && "text-danger hover:text-danger")} onClick={() => send(-1)} disabled={busy} data-testid="thumbs-down"><Thumb down /></button>
    </div>
  );
}
