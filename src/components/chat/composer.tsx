"use client";

// Floating composer card: transparent auto-growing textarea (1 → 6 rows) with a round gold send
// button — the one place in the chat that spends gold on a control.
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

const MAX_ROWS = 6;

export function Composer({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow: reset to one row, then take scrollHeight up to MAX_ROWS lines.
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const max = line * MAX_ROWS;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, []);
  useEffect(() => { fit(); }, [value, fit]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    ref.current?.focus();
  }
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) submit(e);
  }
  const canSend = !disabled && value.trim().length > 0;

  return (
    <form
      onSubmit={submit}
      className="mx-auto mb-5 w-full max-w-[760px] rounded-2xl border border-border bg-surface/95 px-5 py-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,.8)] backdrop-blur transition-colors focus-within:border-muted/60"
      data-testid="composer"
    >
      <div className="flex items-end gap-3">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          maxLength={4000}
          placeholder="Ask Tesleem anything…"
          className="min-h-[1.6rem] flex-1 resize-none bg-transparent py-1 text-[0.95rem] leading-[1.6] text-fg placeholder:text-muted/80 focus:outline-none"
          data-testid="composer-input"
          autoFocus
        />
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition",
            "hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:hover:brightness-100",
          )}
          data-testid="composer-send"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 13V3" /><path d="M3.5 7.5 8 3l4.5 4.5" />
          </svg>
          <span className="sr-only">Send</span>
        </button>
      </div>
      <p className="mt-2 hidden text-[9px] uppercase tracking-[0.16em] text-muted/70 md:block" aria-hidden>
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}
