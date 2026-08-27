"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

const MAX_ROWS = 6;

export function Composer({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  function grow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
    el.style.height = `${Math.min(el.scrollHeight, line * MAX_ROWS)}px`;
  }
  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (ref.current) { ref.current.style.height = "auto"; ref.current.focus(); }
  }
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) submit(e);
  }
  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[760px] rounded-2xl border border-border bg-surface/95 px-5 py-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,.8)] backdrop-blur" data-testid="composer">
      <div className="flex items-end gap-4">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => { setValue(e.target.value); grow(e.target); }}
          onKeyDown={onKey}
          rows={1}
          maxLength={4000}
          placeholder="Ask Tesleem anything…"
          className="max-h-[calc(1.6em*6)] min-h-[1.6em] flex-1 resize-none bg-transparent py-1 text-[0.95rem] leading-[1.6] text-fg outline-none placeholder:text-muted"
          data-testid="composer-input"
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:hover:brightness-100"
          data-testid="composer-send"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>
          <span className="sr-only">Send</span>
        </button>
      </div>
      <p className="mt-3 hidden text-[9px] uppercase tracking-[0.18em] text-muted sm:block">Enter to send · Shift + Enter for a new line</p>
    </form>
  );
}
