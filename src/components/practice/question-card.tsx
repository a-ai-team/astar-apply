"use client";

// Question bank attempt flow: think timer → reveal → follow-ups → self-grade → next.
// Follow-ups are not separate attempts (Loop 05 default). Loop 07 mounts AskMentorButton /
// AI grading below the self-grade row (see `data-testid="question-grade"`).
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { QuestionBody } from "@/lib/content/question-schema";
import { recordAttempt } from "@/app/home/practice/actions";
import { Markdown } from "@/components/lesson/markdown";
import { Reveal } from "@/components/lesson/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type SelfGrade = 1 | 2 | 3;
export const GRADE_LABELS: Record<SelfGrade, string> = { 1: "Missed it", 2: "Partly", 3: "Nailed it" };

/** Seconds a candidate should think before answering — by difficulty ladder. */
export function thinkSeconds(difficulty: number): number {
  return { 1: 30, 2: 45, 3: 60, 4: 90 }[difficulty] ?? 45;
}

export function QuestionCard({ questionId, difficulty, body, nextHref, backHref }: { questionId: string; difficulty: number; body: QuestionBody; nextHref: string | null; backHref: string }) {
  const total = thinkSeconds(difficulty);
  const [elapsed, setElapsed] = useState(0); // seconds since the card mounted, frozen once graded
  const [revealed, setRevealed] = useState(false);
  const [grade, setGrade] = useState<SelfGrade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const left = Math.max(0, total - elapsed);

  useEffect(() => {
    if (grade != null) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [grade]);

  function submit(g: SelfGrade) {
    setError(null);
    startTransition(async () => {
      const res = await recordAttempt({ questionId, selfGrade: g });
      if (res.ok) setGrade(g);
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6" data-testid="question-card">
      {!revealed ? (
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Say your answer out loud, then reveal.</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-3xl tabular-nums" data-testid="think-timer" aria-live="polite">
              {left}s
            </span>
            <span className="text-xs text-muted">{left === 0 ? "Time — reveal when ready." : `of ${total}s thinking time`}</span>
          </div>
          <Button type="button" className="mt-4" onClick={() => setRevealed(true)} data-testid="reveal-answer">
            Reveal answer
          </Button>
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-surface p-5" data-testid="model-answer">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Model answer</h2>
            <Markdown md={body.model_answer_md} className="mt-2" />
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">Key points</h3>
            <ul className="mt-1 list-disc pl-5 text-sm" data-testid="key-points">
              {body.key_points.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
            <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm">
              <span className="font-semibold">Weak answers</span> {body.weak_answer_note}
            </p>
          </section>

          <section className="flex flex-col gap-3" data-testid="follow-ups">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Follow-ups an interviewer would ask</h2>
            {body.follow_ups.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-4">
                <p className="font-medium">{f.question}</p>
                <div className="mt-2">
                  <Reveal label="Show answer" hideLabel="Hide answer" testId={`follow-up-${i}`}>
                    <Markdown md={f.answer_md} />
                  </Reveal>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-border bg-surface p-5" data-testid="question-grade">
            {grade == null ? (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">How did you do?</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {([1, 2, 3] as SelfGrade[]).map((g) => (
                    <Button key={g} type="button" variant={g === 3 ? "primary" : "secondary"} disabled={pending} onClick={() => submit(g)} data-testid={`self-grade-${g}`}>
                      {GRADE_LABELS[g]}
                    </Button>
                  ))}
                </div>
                {error && <p className="mt-2 text-sm text-danger">{error}</p>}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3" data-testid="attempt-recorded">
                <Badge tone="accent">Recorded: {GRADE_LABELS[grade]}</Badge>
                <span className="text-xs text-muted">{elapsed}s on this question</span>
                <div className="ml-auto flex gap-2">
                  <Link href={backHref} className="text-sm text-muted hover:text-fg">Back to bank</Link>
                  {nextHref ? (
                    <Link href={nextHref} data-testid="next-question">
                      <Button type="button" size="sm">Next question →</Button>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted">End of this set.</span>
                  )}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
