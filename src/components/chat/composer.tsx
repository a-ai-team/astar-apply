"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { track } from "@/lib/analytics/client";

export function Composer({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    track("chat_message", { length: text.length });
    setValue("");
    ref.current?.focus();
  }
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) submit(e);
  }
  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-border bg-bg p-3 md:p-4" data-testid="composer">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        rows={2}
        maxLength={4000}
        placeholder="Ask the mentor anything — applications, interviews, technicals…"
        className="min-h-[2.5rem] flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:outline-2 focus:outline-offset-1 focus:outline-accent"
        data-testid="composer-input"
        autoFocus
      />
      <Button type="submit" disabled={disabled || !value.trim()} data-testid="composer-send">
        Send
      </Button>
    </form>
  );
}
