// /home/progress — rings (lessons, cards mastered, questions attempted), day streak, weak topics,
// per-topic table. Everything is read under RLS, so it is the caller's own progress.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getProgress } from "@/lib/practice/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Progress — A* Apply", robots: { index: false, follow: false } };

function Ring({ value, total, label, testId }: { value: number; total: number; label: string; testId: string }) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4" data-testid={testId}>
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fill="var(--fg)" fontSize="13" fontWeight="600">{Math.round(pct * 100)}%</text>
      </svg>
      <div>
        <p className="text-lg font-semibold tabular-nums"><span data-testid={`${testId}-value`}>{value}</span> <span className="text-sm text-muted">/ {total}</span></p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export default async function ProgressPage() {
  const session = await verifySession("/home/progress");
  const db = await createClient();
  const p = await getProgress(db, session.userId);
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="progress-heading">Progress</h1>
        <p className="mt-1 text-sm text-muted">Streaks count any day you attempt a question, review a card or complete a lesson.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4">
          <span className="text-4xl font-semibold tabular-nums" data-testid="streak-days">{p.streak}</span>
          <div>
            <CardTitle>Day streak</CardTitle>
            <CardDescription>{p.activeDays.length} active day{p.activeDays.length === 1 ? "" : "s"} total</CardDescription>
          </div>
        </Card>
        <Card><Ring value={p.stats.lessons_completed} total={p.totals.lessons} label="Lessons completed" testId="ring-lessons" /></Card>
        <Card><Ring value={p.stats.cards_mastered} total={p.totals.cards} label="Cards mastered" testId="ring-cards" /></Card>
        <Card><Ring value={p.stats.questions_attempted} total={p.totals.questions} label="Questions attempted" testId="ring-questions" /></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Reviews</CardTitle>
          <p className="mt-2 text-2xl font-semibold tabular-nums" data-testid="reviews-total">{p.stats.reviews_total}</p>
          <CardDescription>{p.stats.cards_due} card{p.stats.cards_due === 1 ? "" : "s"} due now · <Link href="/home/flashcards" className="underline-offset-2 hover:underline">review</Link></CardDescription>
        </Card>
        <Card>
          <CardTitle>Attempts</CardTitle>
          <p className="mt-2 text-2xl font-semibold tabular-nums" data-testid="attempts-total">{p.stats.attempts_total}</p>
          <CardDescription>{p.stats.questions_attempted} distinct question{p.stats.questions_attempted === 1 ? "" : "s"} · <Link href="/home/practice" className="underline-offset-2 hover:underline">practise</Link></CardDescription>
        </Card>
        <Card data-testid="weak-topics">
          <CardTitle>Focus next</CardTitle>
          {p.weak.length === 0 ? (
            <CardDescription>No weak spots yet — attempt a few questions and the dashboard will point you somewhere.</CardDescription>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {p.weak.map((t) => (
                <li key={t.topic.slug} className="flex items-center justify-between gap-2">
                  <Link href={`/home/practice?topic=${t.topic.slug}`} className="underline-offset-2 hover:underline">{t.topic.title}</Link>
                  <span className="text-xs text-muted">{t.avgGrade != null ? `avg ${t.avgGrade.toFixed(1)}/3` : `${t.mastered}/${t.cards} mastered`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" data-testid="topic-progress">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2">Topic</th>
              <th className="px-4 py-2">Lessons</th>
              <th className="px-4 py-2">Questions attempted</th>
              <th className="px-4 py-2">Avg self-grade</th>
              <th className="px-4 py-2">Cards mastered</th>
            </tr>
          </thead>
          <tbody>
            {p.perTopic.map((t) => (
              <tr key={t.topic.slug} className="border-t border-border" data-testid="topic-progress-row">
                <td className="px-4 py-2 font-medium">{t.topic.title}</td>
                <td className="px-4 py-2 tabular-nums">{t.lessonsDone} / {t.lessons}</td>
                <td className="px-4 py-2 tabular-nums">{t.attempted} / {t.questions}</td>
                <td className="px-4 py-2">{t.avgGrade != null ? <Badge tone={t.avgGrade >= 2.5 ? "accent" : "danger"}>{t.avgGrade.toFixed(1)}</Badge> : <span className="text-muted">—</span>}</td>
                <td className="px-4 py-2 tabular-nums">{t.mastered} / {t.cards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
