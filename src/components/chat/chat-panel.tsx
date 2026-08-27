"use client";

// The conversation: message list + composer. Sends POST /api/chat, parses the SSE stream and
// renders deltas/citations as they arrive; after `done` a brand-new thread navigates to its URL.
// Loop 06: `context` (question / lesson block) rides along on the first request and is pinned as a
// chip in the header; `autoSend` fires the opening message once (the "Ask Mentor" flow).
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSseParser } from "@/lib/chat/sse";
import type { ChatEvent, Citation, Rung, ThreadContext } from "@/lib/chat/types";
import { CitationDrawer } from "./citation-drawer";
import { Composer } from "./composer";
import { MessageBubble } from "./message-bubble";

export type UiMessage = { id: string | null; role: "user" | "assistant"; text: string; citations: Citation[]; rung?: Rung; pending: boolean };

export type ContextChip = { label: string; href: string };

export function ChatPanel({ threadId, title, initialMessages, initialFeedback, context, contextChip, autoSend }: {
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
      if (newThread) {
        liveThread.current = newThread;
        router.replace(`/home/mentor/${newThread}`);
      }
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

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="chat-panel">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-base font-semibold" data-testid="chat-title">{title ?? "Mentor"}</h1>
          {contextChip && (
            <Link href={contextChip.href} className="inline-flex max-w-xs items-center gap-1 truncate rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-fg hover:border-accent" title={contextChip.label} data-testid="thread-context">
              <span className="text-accent">↩</span>
              <span className="truncate">{contextChip.label}</span>
            </Link>
          )}
        </div>
        <span className="hidden text-xs text-muted sm:inline">Answers cite the mentor corpus and the Technicals curriculum</span>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 md:px-6" data-testid="messages">
        {messages.length === 0 && (
          <div className="m-auto flex max-w-lg flex-col items-center gap-5 text-sm text-muted sm:flex-row sm:items-center sm:gap-6" data-testid="mentor-intro">
            <Image src="/mentors/tesleem.jpg" alt="Tesleem Fowora" width={144} height={144} priority className="h-32 w-32 shrink-0 rounded-full object-cover ring-2 ring-border sm:h-36 sm:w-36" />
            <div className="text-center sm:text-left">
              <p className="text-xl font-semibold text-fg">Tesleem Fowora</p>
              <p className="mt-1 text-sm font-medium text-fg/80">President, LSESU Business &amp; Investment Group · Private Equity Summer Analyst, HarbourVest</p>
              <p className="mt-1 text-xs text-muted">Spring weeks at Evercore, Perella Weinberg and Rothschild &amp; Co · LSE</p>
              <p className="mt-3">Ask someone who has actually done the process — spring weeks, CVs, &ldquo;why banking&rdquo;, EV vs equity value, DCFs. Every answer cites Tesleem&rsquo;s own notes when they cover it.</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={m.id ?? `m${i}`} {...m} vote={m.id ? initialFeedback[m.id] ?? null : null} onOpenCitation={(citation, index) => setDrawer({ citation, index })} />
        ))}
        {error && <p className="text-sm text-danger" role="alert" data-testid="chat-error">{error}</p>}
        <div ref={bottom} />
      </div>
      <Composer disabled={busy} onSend={send} />
      <CitationDrawer open={Boolean(drawer)} citation={drawer?.citation ?? null} index={drawer?.index ?? 0} onClose={() => setDrawer(null)} />
    </div>
  );
}
