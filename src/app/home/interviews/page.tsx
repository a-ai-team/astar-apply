// /home/interviews — the hub (Loop 07): topic drill picker, full mock, history. Reads with the
// cookie client (RLS → own interviews, approved questions). Starting is a form action that
// creates the session server-side and redirects to the runner.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { drillTopics, listInterviews } from "@/lib/interviews/queries";
import { MOCK_TOPICS } from "@/lib/interviews/select";
import { DRILL_SECONDS, DRILL_SIZE, MOCK_SECONDS, MOCK_SIZE } from "@/lib/interviews/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { startInterview } from "./actions";

export const metadata: Metadata = { title: "Mock interviews — A* Apply", robots: { index: false, follow: false } };

const STATUS: Record<string, { label: string; tone: "neutral" | "accent" | "danger" }> = {
  in_progress: { label: "In progress", tone: "accent" },
  completed: { label: "Completed", tone: "neutral" },
  abandoned: { label: "Abandoned", tone: "danger" },
};

export default async function InterviewsPage({ searchParams }: PageProps<"/home/interviews">) {
  await verifySession("/home/interviews");
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const db = await createClient();
  const [topics, history] = await Promise.all([drillTopics(db), listInterviews(db)]);
  const poolTotal = topics.filter((t) => MOCK_TOPICS.includes(t.slug)).reduce((s, t) => s + t.count, 0);
  const mockCount = Math.min(MOCK_SIZE, poolTotal);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="interviews-heading">Mock interviews</h1>
        <p className="mt-1 text-sm text-muted">Answer under a timer, get graded against the model answer, then a debrief with what to reread. Type your answer, or say it out loud and type the gist — the grader marks content, not prose.</p>
      </div>
      {error && <p className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" data-testid="interviews-error">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="drill-card">
          <CardTitle>Topic drill</CardTitle>
          <CardDescription>Up to {DRILL_SIZE} questions from one topic, {DRILL_SECONDS} s each, difficulties 1–3. About 8 minutes.</CardDescription>
          {topics.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No approved questions yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {topics.map((t) => (
                <li key={t.slug}>
                  <form action={startInterview} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                    <input type="hidden" name="mode" value="drill" />
                    <input type="hidden" name="topic" value={t.slug} />
                    <span className="text-sm">
                      {t.title} <span className="text-xs text-muted">· {Math.min(t.count, DRILL_SIZE)} of {t.count} question{t.count === 1 ? "" : "s"}{t.count < DRILL_SIZE ? " (small pool)" : ""}</span>
                    </span>
                    <Button type="submit" size="sm" variant="secondary" data-testid={`start-drill-${t.slug}`}>Start drill</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card data-testid="mock-card">
          <CardTitle>Full mock</CardTitle>
          <CardDescription>Up to {MOCK_SIZE} questions across the technical topics, {MOCK_SECONDS} s each, difficulties 1–4. The timer submits for you when it runs out.</CardDescription>
          <p className="mt-4 text-sm" data-testid="mock-pool-note">
            {poolTotal === 0 ? "No approved questions yet." : poolTotal < MOCK_SIZE ? `Only ${poolTotal} approved questions exist right now, so this mock has ${mockCount} questions across ${topics.filter((t) => MOCK_TOPICS.includes(t.slug)).length} topic${topics.length === 1 ? "" : "s"}. It grows as content is approved.` : `${MOCK_SIZE} questions, stratified across ${topics.filter((t) => MOCK_TOPICS.includes(t.slug)).length} topics.`}
          </p>
          <form action={startInterview} className="mt-4">
            <input type="hidden" name="mode" value="mock" />
            <Button type="submit" disabled={poolTotal === 0} data-testid="start-mock">Start full mock</Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/home/interviews/firms" data-testid="firms-card">
          <Card className="h-full hover:border-accent">
            <CardTitle>Firm question banks</CardTitle>
            <CardDescription>What each bank tends to ask, by stage and programme, with a dossier and process timeline. Practise any question as a one-question drill.</CardDescription>
          </Card>
        </Link>
        <Link href="/home/pulse" data-testid="pulse-card">
          <Card className="h-full hover:border-accent">
            <CardTitle>Pulse</CardTitle>
            <CardDescription>The week&apos;s market stories with interview framing: the 30-second take, three talking points, and the questions they could prompt.</CardDescription>
          </Card>
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold">History</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted" data-testid="history-empty">No interviews yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2" data-testid="history-list">
            {history.map((h) => {
              const s = STATUS[h.status] ?? STATUS.in_progress;
              const href = h.status === "completed" ? `/home/interviews/${h.id}/report` : `/home/interviews/${h.id}`;
              return (
                <li key={h.id}>
                  <Link href={href} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm hover:border-accent" data-testid="history-item" data-status={h.status}>
                    <span className="font-medium">{h.mode === "drill" ? `Drill · ${h.topic?.title ?? "topic"}` : "Full mock"}</span>
                    <span className="text-muted">{h.count} Q</span>
                    <Badge tone={s.tone}>{s.label}</Badge>
                    {h.overall_score != null && <span className="ml-auto tabular-nums">{Number(h.overall_score).toFixed(1)} / 10</span>}
                    <span className="text-xs text-muted">{new Date(h.started_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
