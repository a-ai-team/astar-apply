"use client";

// DemoChat (Loop 10): the landing-page taste of the mentor chatbot. POSTs to /api/demo-chat
// (unauthenticated, corpus-only, 3/day per IP) and shows the answer with up to three mentor
// citations. Nothing is persisted; the "Ask more" link goes to sign-up.
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics/client";

type Reply = { text: string; rung: string; citations: { label: string; quote: string }[]; remaining: number; mode: string };

export const DEMO_SUGGESTIONS = [
  "How do I answer 'walk me through a DCF' in under a minute?",
  "What do spring-week interviews actually ask?",
  "How should I explain a £10m depreciation increase across the three statements?",
];

export function DemoChat() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setPending(true); setError(null); setReply(null); setAsked(q);
    track("chat_message", { surface: "landing_demo", length: q.length });
    try {
      const res = await fetch("/api/demo-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }) });
      const data = (await res.json()) as Partial<Reply> & { error?: string };
      if (!res.ok) setError(data.error ?? "Something went wrong — try again.");
      else setReply(data as Reply);
    } catch {
      setError("Network error — try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-6" data-testid="demo-chat">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); void ask(question); }} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="demo-question" className="sr-only">Ask the mentor</label>
        <input
          id="demo-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about IB applications, interviews or technicals…"
          className="h-11 flex-1 rounded-md border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
          maxLength={500}
          data-testid="demo-input"
        />
        <button type="submit" disabled={pending || question.trim().length < 3} className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-accent-fg disabled:opacity-50" data-testid="demo-submit">
          {pending ? "Thinking…" : "Ask"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => { setQuestion(s); void ask(s); }} className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-fg" data-testid="demo-suggestion">
            {s}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" data-testid="demo-error">{error} {error.includes("account") && <Link href="/login?next=/home" className="underline">Create one</Link>}</p>}
      {reply && (
        <div className="mt-4 flex flex-col gap-3" data-testid="demo-answer" data-rung={reply.rung}>
          <p className="text-xs text-muted">You asked: <span className="text-fg">{asked}</span></p>
          <div className="whitespace-pre-wrap rounded-md border border-border bg-bg p-4 text-sm leading-relaxed" data-testid="demo-answer-text">{reply.text}</div>
          {reply.citations.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-muted" data-testid="demo-citations">
              {reply.citations.map((c, i) => <li key={i}><span className="text-fg">{c.label}</span> — “{c.quote}”</li>)}
            </ul>
          )}
          <p className="text-xs text-muted">
            {reply.remaining > 0 ? `${reply.remaining} more demo question${reply.remaining === 1 ? "" : "s"} today.` : "That was your last demo question today."}{" "}
            <Link href="/login?next=/home/mentor" className="underline underline-offset-2 hover:text-fg" data-testid="demo-signup">Create a free account</Link> for the full mentor, with follow-ups and lesson links.
          </p>
        </div>
      )}
    </div>
  );
}
