"use client";

// The conversation: message list + composer. Sends POST /api/chat, parses the SSE stream and
// renders deltas/citations as they arrive; after `done` a brand-new thread's id is kept in memory
// (`liveThread`) so follow-ups append to the same server thread — we stay on /home/mentor rather
// than navigating to /home/mentor/[threadId] (thread history hidden for now — James, 2026-08-27).
// Loop 06: `context` (question / lesson block) rides along on the first request and is pinned as a
// chip above the messages (`title` is accepted but no longer shown — the app header is enough); `autoSend` fires the opening message once (the "Ask Mentor" flow).
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSseParser } from "@/lib/chat/sse";
import type { ChatEvent, Citation, Rung, ThreadContext } from "@/lib/chat/types";
import { cn } from "@/lib/cn";
import { BrainHalo } from "./brain-halo";
import { CitationDrawer } from "./citation-drawer";
import { Composer } from "./composer";
import { MessageBubble } from "./message-bubble";

export type UiMessage = { id: string | null; role: "user" | "assistant"; text: string; citations: Citation[]; rung?: Rung; pending: boolean };

export type ContextChip = { label: string; href: string };

export function ChatPanel({ threadId, initialMessages, initialFeedback, context, contextChip, autoSend }: {
  threadId: string | null; title?: string; initialMessages: UiMessage[]; initialFeedback: Record<string, 1 | -1>;
  context?: ThreadContext | null; contextChip?: ContextChip | null; autoSend?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<{ citation: Citation; index: number } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const liveThread = useRef<string | null>(threadId);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const send = useCallback(async (text: string) => {
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { id: null, role: "user", text, citations: [], pending: false }, { id: null, role: "assistant", text: "", citations: [], pending: true }]);
    const patch = (fn: (a: UiMessage) => UiMessage) => setMessages((m) => { const copy = [...m]; const last = copy.length - 1; copy[last] = fn(copy[last]); return copy; });
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: liveThread.current ?? undefined, message: text, context: liveThread.current ? undefined : context ?? undefined }) });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        const msg = res.status === 429 ? "You've hit today's message cap — come back tomorrow." : (body.error ?? `Request failed (${res.status})`);
        setMessages((m) => m.slice(0, -1));
        setError(msg);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const feed = createSseParser();
      let newThread: string | null = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const ev of feed(decoder.decode(value, { stream: true })) as ChatEvent[]) {
          if (ev.type === "delta") patch((a) => ({ ...a, text: a.text + ev.text }));
          else if (ev.type === "citation") patch((a) => (a.citations.some((c) => c.chunk_id === ev.citation.chunk_id) ? a : { ...a, citations: [...a.citations, ev.citation] }));
          else if (ev.type === "retrieval") patch((a) => ({ ...a, rung: ev.rung }));
          else if (ev.type === "done") {
            patch(() => ({ id: ev.messageId, role: "assistant", text: ev.content.text, citations: ev.content.citations, rung: ev.content.rung, pending: false }));
            if (!liveThread.current && ev.threadId) newThread = ev.threadId;
          } else if (ev.type === "error") {
            patch((a) => ({ ...a, pending: false, text: a.text || "Something went wrong — please try again." }));
            setError(ev.message);
          }
        }
      }
      if (newThread) liveThread.current = newThread;
      router.refresh();
    } catch (e) {
      patch((a) => ({ ...a, pending: false }));
      setError(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  }, [router, context]);

  // "Ask Mentor about this": send the opening message once, then behave like any thread.
  const fired = useRef(false);
  useEffect(() => {
    if (!autoSend || fired.current || initialMessages.length) return;
    fired.current = true;
    void send(autoSend);
  }, [autoSend, initialMessages.length, send]);

  const busyHalo: "idle" | "thinking" = busy ? "thinking" : "idle";

  return (
    <div className="flex h-[calc(100dvh-var(--shell-header-h))] min-h-0 flex-col" data-testid="chat-panel">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 md:px-6" data-testid="messages">
        {messages.length > 0 && (
          <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-bg px-4 md:-mx-6 md:px-6">
            <div className="mx-auto flex w-full max-w-[760px] items-center gap-3 py-1">
              <div className="relative h-[72px] w-[72px] shrink-0">
                <BrainHalo size={72} state={busyHalo} className="absolute inset-0" />
                <Image src="/mentors/tesleem.jpg" alt="Tesleem Fowora" width={80} height={80} className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover ring-1 ring-accent/40" />
              </div>
              <p className="font-display text-[1.05rem] font-medium tracking-[-0.01em] text-fg">Tesleem Fowora</p>
              {contextChip && <ContextPill chip={contextChip} className="ml-auto" />}
            </div>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center pb-[12vh] pt-6 text-center" data-testid="mentor-intro">
            {contextChip && <ContextPill chip={contextChip} className="mb-8" />}
            <div className="relative h-[360px] w-[360px] max-w-full">
              <BrainHalo size={360} state={busyHalo} className="absolute inset-0" />
              <Image src="/mentors/tesleem.jpg" alt="Tesleem Fowora" width={144} height={144} priority className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover ring-1 ring-accent/40 shadow-[0_0_48px_-8px_rgba(212,181,113,0.35)]" />
            </div>
            <h1 className="-mt-14 font-display text-[2.25rem] font-medium leading-none tracking-[-0.015em] text-fg [text-wrap:balance]">Tesleem Fowora</h1>
            <p className="mt-4 max-w-md text-[0.8rem] uppercase tracking-[0.18em] text-muted [text-wrap:balance]">President, LSESU Business &amp; Investment Group&nbsp;· Private Equity Summer Analyst, HarbourVest</p>
          </div>
        )}
        {messages.length > 0 && (
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 py-8">
            {messages.map((m, i) => (
              <div key={m.id ?? `m${i}`} className="animate-msg-in">
                <MessageBubble {...m} vote={m.id ? initialFeedback[m.id] ?? null : null} onOpenCitation={(citation, index) => setDrawer({ citation, index })} />
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="mx-auto w-full max-w-[760px] pb-4">
            <p className="border-l border-danger/70 pl-4 text-[0.8rem] leading-relaxed text-muted" role="alert" data-testid="chat-error">{error}</p>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="shrink-0 px-4 pb-5 pt-2 md:px-6">
        <Composer disabled={busy} onSend={send} />
      </div>
      <CitationDrawer open={Boolean(drawer)} citation={drawer?.citation ?? null} index={drawer?.index ?? 0} onClose={() => setDrawer(null)} />
    </div>
  );
}

// Loop 06 context ("Ask Mentor about this"): a hairline pill linking back to the question / block.
function ContextPill({ chip, className }: { chip: ContextChip; className?: string }) {
  return (
    <Link href={chip.href} className={cn("inline-flex max-w-xs items-center gap-2 truncate rounded-full border border-border px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted transition hover:border-accent/60 hover:text-fg", className)} title={chip.label} data-testid="thread-context">
      <span className="text-accent" aria-hidden>↩</span>
      <span className="truncate normal-case tracking-normal">{chip.label}</span>
    </Link>
  );
}
