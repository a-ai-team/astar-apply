// /admin/feedback — staff review of thumbs-down (default) or all votes, with the question, the
// answer, its citations and the retrieved chunks so the mentor can see what the bot was shown.
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { MessageContent, RetrievalRecord } from "@/lib/chat/types";
import Link from "next/link";

type Row = {
  id: string; vote: number; comment: string | null; created_at: string; user_id: string;
  chat_messages: { id: string; thread_id: string; content: MessageContent; retrieval: RetrievalRecord | null; model: string | null; prompt_version: string | null; created_at: string } | null;
};

export default async function FeedbackPage({ searchParams }: PageProps<"/admin/feedback">) {
  await verifyStaff();
  const { vote } = await searchParams;
  const filter = vote === "all" ? "all" : vote === "up" ? "up" : "down";
  const db = createAdminClient();
  let q = db
    .from("chat_feedback")
    .select("id, vote, comment, created_at, user_id, chat_messages(id, thread_id, content, retrieval, model, prompt_version, created_at)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter !== "all") q = q.eq("vote", filter === "up" ? 1 : -1);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as Row[];
  const messageIds = rows.map((r) => r.chat_messages?.id).filter((x): x is string => Boolean(x));
  const questions = new Map<string, string>();
  if (messageIds.length) {
    // The user turn immediately before each rated assistant message.
    const threadIds = [...new Set(rows.map((r) => r.chat_messages?.thread_id).filter((x): x is string => Boolean(x)))];
    const { data: msgs } = await db.from("chat_messages").select("id, thread_id, role, content, created_at").in("thread_id", threadIds).order("created_at", { ascending: true });
    const byThread = new Map<string, { id: string; role: string; text: string; created_at: string }[]>();
    for (const m of (msgs ?? []) as { id: string; thread_id: string; role: string; content: { text?: string }; created_at: string }[]) {
      const list = byThread.get(m.thread_id) ?? [];
      list.push({ id: m.id, role: m.role, text: m.content?.text ?? "", created_at: m.created_at });
      byThread.set(m.thread_id, list);
    }
    for (const r of rows) {
      const m = r.chat_messages;
      if (!m) continue;
      const list = byThread.get(m.thread_id) ?? [];
      const idx = list.findIndex((x) => x.id === m.id);
      const prev = [...list.slice(0, idx)].reverse().find((x) => x.role === "user");
      if (prev) questions.set(m.id, prev.text);
    }
  }
  const profiles = new Map<string, string>();
  {
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: ps } = await db.from("profiles").select("id, display_name").in("id", ids);
      for (const p of ps ?? []) profiles.set(p.id, p.display_name ?? p.id.slice(0, 8));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold" data-testid="feedback-heading">Chat feedback</h1>
        <nav className="flex gap-1 text-sm">
          {(["down", "up", "all"] as const).map((f) => (
            <Link key={f} href={`/admin/feedback?vote=${f}`} className={cn("rounded-md px-3 py-1.5", filter === f ? "bg-surface text-fg" : "text-muted hover:text-fg")}>
              {f === "down" ? "👎 Thumbs down" : f === "up" ? "👍 Thumbs up" : "All"}
            </Link>
          ))}
        </nav>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted" data-testid="feedback-empty">No feedback yet.</p>}
      <ul className="flex flex-col gap-4">
        {rows.map((r) => {
          const m = r.chat_messages;
          return (
            <li key={r.id} className="rounded-lg border border-border bg-surface p-4" data-testid="feedback-row">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge tone={r.vote > 0 ? "accent" : "neutral"}>{r.vote > 0 ? "👍" : "👎"}</Badge>
                <span>{profiles.get(r.user_id) ?? r.user_id.slice(0, 8)}</span>
                <span>· {new Date(r.created_at).toLocaleString("en-GB")}</span>
                {m?.model && <span>· {m.model}</span>}
                {m?.prompt_version && <span>· {m.prompt_version}</span>}
                {m?.content?.rung && <span>· rung {m.content.rung}</span>}
                {m && <Link href={`/home/mentor/${m.thread_id}`} className="ml-auto hover:text-fg">open thread →</Link>}
              </div>
              {r.comment && <p className="mt-2 text-sm italic text-fg">“{r.comment}”</p>}
              {m && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Question</p>
                    <p className="mt-1 text-sm">{questions.get(m.id) ?? <span className="text-muted">(not found)</span>}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Answer</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm" data-testid="feedback-answer">{m.content.text}</p>
                    {m.content.citations?.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
                        {m.content.citations.map((c, i) => (
                          <li key={c.chunk_id}>[{i + 1}] {c.label} — “{c.quote.slice(0, 120)}{c.quote.length > 120 ? "…" : ""}”</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Retrieval</p>
                    {m.retrieval ? (
                      <div className="mt-1 text-xs text-muted">
                        <p>intent <span className="text-fg">{m.retrieval.intent}</span> · queries {m.retrieval.queries.map((q) => `“${q}”`).join(", ")}</p>
                        <p className="mt-1">{m.retrieval.provider.embeddings} · rerank {m.retrieval.provider.rerank} · mode {m.retrieval.provider.mode}</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-4" data-testid="feedback-chunks">
                          {m.retrieval.candidates.map((c) => (
                            <li key={c.id} className={cn(m.retrieval!.reranked.some((x) => x.id === c.id) ? "text-fg" : "")}>
                              <Link href={`/admin/corpus?chunk=${c.id}`} className="hover:underline">{c.label}</Link>
                              <span className="ml-1">({c.score.toFixed(4)}{c.signals.fts_rank ? ` · fts ${c.signals.fts_rank.toFixed(2)}` : ""}{c.signals.similarity ? ` · cos ${c.signals.similarity.toFixed(2)}` : ""})</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted">No retrieval record.</p>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
