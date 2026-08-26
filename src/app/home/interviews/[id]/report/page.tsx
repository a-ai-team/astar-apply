// /home/interviews/[id]/report — ScoreCard, per-question accordion, focus areas → lessons/decks
// (Loop 07). Own rows only via RLS; an unfinished interview goes back to the runner.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getInterview, getInterviewQuestions, getTurns } from "@/lib/interviews/queries";
import { deliveryScore } from "@/lib/interviews/speech-metrics";
import { AskMentorButton } from "@/components/chat/ask-mentor-button";
import { Markdown } from "@/components/lesson/markdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Interview report — A* Apply", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mean(xs: number[]): number | null {
  return xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null;
}

export default async function InterviewReportPage({ params }: PageProps<"/home/interviews/[id]/report">) {
  const session = await verifySession("/home/interviews");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const db = await createClient();
  const interview = await getInterview(db, id);
  // Own interviews only — staff RLS read access does not make someone else's mock a page (TODO(james): admin view in a later loop).
  if (!interview || interview.user_id !== session.userId) notFound();
  if (interview.status === "in_progress") redirect(`/home/interviews/${id}`);
  const [turns, questions] = await Promise.all([getTurns(db, id), getInterviewQuestions(db, interview.question_ids)]);
  const graded = turns.filter((t) => t.grade && t.score != null);
  const axis = (k: "accuracy" | "structure" | "depth") => mean(graded.map((t) => t.grade![k]));
  const withMetrics = graded.filter((t) => t.transcript_meta && t.transcript_meta.wpm != null);
  const delivery = withMetrics.length ? mean(withMetrics.map((t) => deliveryScore({ words: (t.answer_text ?? "").trim().split(/\s+/).filter(Boolean).length, wpm: t.transcript_meta!.wpm, filler_count: t.transcript_meta!.filler_count }).score)) : null;
  const report = interview.report;
  const lessonSlugs = report?.focus_areas.map((f) => f.lesson_slug) ?? [];
  const { data: lessonRows } = lessonSlugs.length ? await db.from("lessons").select("slug, title, subtopic:subtopics!inner(topic:topics!inner(slug))").in("slug", lessonSlugs) : { data: [] };
  const lessons = new Map((lessonRows ?? []).map((l) => [l.slug as string, { title: l.title as string, topic: (l.subtopic as unknown as { topic: { slug: string } }).topic.slug }]));
  const title = interview.mode === "drill" ? `Drill · ${[...questions.values()][0]?.topic_title ?? "topic"}` : "Full mock";
  const overall = interview.overall_score == null ? null : Number(interview.overall_score);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="report-heading">{title} — report</h1>
          <p className="mt-1 text-sm text-muted">{graded.length} of {turns.length} answered · {interview.status === "abandoned" ? "abandoned" : "completed"} {interview.completed_at ? new Date(interview.completed_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
        </div>
        <Link href="/home/interviews" className="text-sm text-muted hover:text-fg">← Mock interviews</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-testid="score-card">
        <Card className="lg:col-span-2 flex items-center gap-4">
          <span className="text-5xl font-semibold tabular-nums" data-testid="overall-score">{overall == null ? "—" : overall.toFixed(1)}</span>
          <div>
            <CardTitle>Content / 10</CardTitle>
            <CardDescription>Mean of {graded.length} graded answer{graded.length === 1 ? "" : "s"}</CardDescription>
          </div>
        </Card>
        <Card><CardTitle>Accuracy</CardTitle><p className="mt-2 text-2xl font-semibold tabular-nums">{axis("accuracy") ?? "—"}<span className="text-sm text-muted"> / 4</span></p></Card>
        <Card><CardTitle>Structure</CardTitle><p className="mt-2 text-2xl font-semibold tabular-nums">{axis("structure") ?? "—"}<span className="text-sm text-muted"> / 3</span></p></Card>
        <Card><CardTitle>Depth</CardTitle><p className="mt-2 text-2xl font-semibold tabular-nums">{axis("depth") ?? "—"}<span className="text-sm text-muted"> / 3</span></p></Card>
        {delivery != null && (
          <Card className="sm:col-span-2 lg:col-span-5 flex items-center gap-4" data-testid="delivery-score">
            <span className="text-3xl font-semibold tabular-nums">{Math.round(delivery)}</span>
            <div>
              <CardTitle>Delivery / 100</CardTitle>
              <CardDescription>Pace {Math.round(withMetrics.reduce((s, t) => s + (t.transcript_meta!.wpm ?? 0), 0) / withMetrics.length)} wpm on average · {withMetrics.reduce((s, t) => s + t.transcript_meta!.filler_count, 0)} fillers over {withMetrics.length} answer{withMetrics.length === 1 ? "" : "s"}</CardDescription>
            </div>
          </Card>
        )}
      </div>

      {report && (
        <section className="grid gap-4 md:grid-cols-3" data-testid="report-body">
          <Card className="md:col-span-3">
            <CardTitle>Debrief</CardTitle>
            <div className="mt-2 text-sm" data-testid="report-summary"><Markdown md={report.summary_md} /></div>
          </Card>
          {report.focus_areas.map((f, i) => {
            const lesson = lessons.get(f.lesson_slug);
            const lessonHref = lesson ? `/home/technicals/${lesson.topic}/${f.lesson_slug}` : `/home/technicals/${f.topic}`;
            return (
              <Card key={i} data-testid="focus-area">
                <div className="flex items-center gap-2"><Badge tone="accent">Focus {i + 1}</Badge><span className="text-xs text-muted">{f.topic}{f.subtopic && f.subtopic !== f.topic ? ` › ${f.subtopic}` : ""}</span></div>
                <p className="mt-2 text-sm">{f.reason}</p>
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <Link href={lessonHref} className="underline-offset-2 hover:underline" data-testid="focus-lesson">Reread: {lesson?.title ?? f.lesson_slug}</Link>
                  <Link href={`/home/flashcards/${f.deck}`} className="underline-offset-2 hover:underline" data-testid="focus-deck">Review the {f.deck} deck</Link>
                  <Link href={`/home/practice?topic=${f.topic}`} className="text-muted underline-offset-2 hover:underline">Practise {f.topic} questions</Link>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Per question</h2>
        <div className="mt-3 flex flex-col gap-2" data-testid="turn-list">
          {turns.map((t) => {
            const q = questions.get(t.question_id);
            const g = t.grade;
            return (
              <details key={t.id} className="rounded-lg border border-border bg-surface" data-testid="turn-item">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="text-muted">{t.ordinal + 1}.</span>
                  <span className="flex-1 font-medium">{q?.question ?? "(question unavailable)"}</span>
                  {t.score != null ? <span className="tabular-nums" data-testid="turn-item-score">{Number(t.score)} / 10</span> : <Badge>Unanswered</Badge>}
                  {t.transcript_meta?.late && <Badge tone="danger">Over time</Badge>}
                </summary>
                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm">
                  <div><span className="text-xs font-semibold uppercase tracking-wide text-muted">Your answer</span><p className="mt-1 whitespace-pre-wrap">{t.answer_text || <em className="text-muted">No answer given.</em>}</p></div>
                  {g && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><span className="text-xs font-semibold uppercase tracking-wide text-muted">Hit</span><ul className="mt-1 list-disc pl-5">{g.hit.map((h) => <li key={h}>{h}</li>)}</ul></div>
                        <div><span className="text-xs font-semibold uppercase tracking-wide text-muted">Missed</span><ul className="mt-1 list-disc pl-5">{g.missed.map((h) => <li key={h}>{h}</li>)}</ul></div>
                      </div>
                      <div className="rounded-md border border-border p-3"><Markdown md={g.feedback_md} /></div>
                      <p className="text-muted"><span className="font-semibold text-fg">Interviewer would push on:</span> {g.mentor_tip_md}</p>
                    </>
                  )}
                  {q && (
                    <div><span className="text-xs font-semibold uppercase tracking-wide text-muted">Model answer</span><div className="mt-1"><Markdown md={q.model_answer_md} /></div></div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {q && <AskMentorButton target={{ kind: "question", questionId: q.id, attemptId: t.attempt_id }} />}
                    {q && <Link href={`/home/practice/${q.slug}`} className="text-xs text-muted hover:text-fg">Open in the bank</Link>}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </>
  );
}
