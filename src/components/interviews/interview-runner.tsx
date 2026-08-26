"use client";

// InterviewRunner (Loop 07): one question at a time — countdown from the server-stamped shown_at,
// textarea (or VoiceCapture behind NEXT_PUBLIC_VOICE_MOCK), submit → grade reveal (score, hit /
// missed, feedback, mentor tip, Ask Mentor carrying {question_id, attempt_id}) → next. In mock
// mode the timer submits whatever is typed when it reaches zero. State lives in this component;
// a reload re-derives it from the DB (the page re-serves the first unanswered turn).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { finishInterview, submitTurn, type SubmitTurnResult } from "@/app/home/interviews/actions";
import type { Grade } from "@/lib/interviews/types";
import type { SpeechMetrics } from "@/lib/interviews/speech-metrics";
import { AskMentorButton } from "@/components/chat/ask-mentor-button";
import { Markdown } from "@/components/lesson/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoiceCapture } from "./voice-capture";

export type RunnerTurn = { ordinal: number; questionId: string; question: string; difficulty: number; topicTitle: string; shownAt: string | null; answered: boolean; score: number | null; grade: Grade | null; attemptId: string | null };

type Graded = { score: number; grade: Grade; attemptId: string | null; late: boolean; durationS: number; gradedBy: string };

export function InterviewRunner({ interviewId, mode, secondsPerQuestion, turns, initialOrdinal, serverNow, voiceEnabled }: { interviewId: string; mode: "drill" | "mock"; secondsPerQuestion: number; turns: RunnerTurn[]; initialOrdinal: number | null; serverNow: string; voiceEnabled: boolean }) {
  const router = useRouter();
  // Offset between the server clock and this browser, so the countdown follows the clock of record.
  const skew = useRef(Date.now() - new Date(serverNow).getTime());
  const [ordinal, setOrdinal] = useState<number | null>(initialOrdinal);
  const [shownAt, setShownAt] = useState<string | null>(turns.find((t) => t.ordinal === initialOrdinal)?.shownAt ?? null);
  const [answer, setAnswer] = useState("");
  const [voiceMetrics, setVoiceMetrics] = useState<SpeechMetrics | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(secondsPerQuestion);
  const [pending, startTransition] = useTransition();
  const [finishing, setFinishing] = useState(false);
  const submittedRef = useRef(false);

  const turn = ordinal == null ? null : turns.find((t) => t.ordinal === ordinal) ?? null;
  const answeredCount = turns.filter((t) => t.answered).length + (graded ? 1 : 0);
  const done = turns.length > 0 && (ordinal == null || (graded != null && ordinal >= turns.length - 1));

  const submit = useCallback(
    (auto = false) => {
      if (!turn || submittedRef.current) return;
      submittedRef.current = true;
      setError(null);
      startTransition(async () => {
        const res: SubmitTurnResult = await submitTurn({ interviewId, ordinal: turn.ordinal, answerText: answer, metrics: voiceMetrics ? { ...voiceMetrics, voice: true } : null });
        if (!res.ok) {
          setError(res.error);
          submittedRef.current = false;
          return;
        }
        setGraded({ score: res.score, grade: res.grade, attemptId: res.attemptId, late: res.late || auto, durationS: res.durationS, gradedBy: res.gradedBy });
        if (res.next) setShownAt(res.next.shownAt);
      });
    },
    [turn, interviewId, answer, voiceMetrics],
  );

  // Countdown from the server-stamped shown_at. Mocks auto-submit at zero.
  useEffect(() => {
    if (!turn || graded || !shownAt) return;
    const tick = () => {
      const elapsed = (Date.now() - skew.current - new Date(shownAt).getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(secondsPerQuestion - elapsed));
      setLeft(remaining);
      if (remaining === 0 && mode === "mock") submit(true);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [turn, graded, shownAt, secondsPerQuestion, mode, submit]);

  function next() {
    if (!turn) return;
    const n = turns.find((t) => t.ordinal === turn.ordinal + 1);
    setGraded(null);
    setAnswer("");
    setVoiceMetrics(null);
    submittedRef.current = false;
    if (n) {
      setOrdinal(n.ordinal);
      setLeft(secondsPerQuestion);
    } else finish();
  }

  function finish() {
    setFinishing(true);
    startTransition(async () => {
      const res = await finishInterview(interviewId);
      if (!res.ok) {
        setError(res.error);
        setFinishing(false);
        return;
      }
      router.push(`/home/interviews/${interviewId}/report`);
    });
  }

  if (!turns.length) return <p className="text-sm text-muted">This interview has no questions.</p>;
  if (!turn) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5" data-testid="runner-finish">
        <p className="text-sm">All {turns.length} questions answered.</p>
        <Button type="button" className="mt-3" onClick={finish} disabled={pending || finishing} data-testid="finish-interview">{finishing ? "Building your report…" : "See your report"}</Button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    );
  }

  const urgent = left <= 10 && !graded;
  return (
    <div className="flex flex-col gap-5" data-testid="interview-runner">
      <div className="flex items-center gap-3 text-sm text-muted" data-testid="runner-progress">
        <span>Question <span data-testid="runner-position">{turn.ordinal + 1}</span> of {turns.length}</span>
        <div className="h-1.5 flex-1 rounded-full bg-border"><div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${Math.round((answeredCount / turns.length) * 100)}%` }} /></div>
        <Badge>{turn.topicTitle} · D{turn.difficulty}</Badge>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-lg font-medium" data-testid="runner-question">{turn.question}</p>
          <span className={`shrink-0 font-mono text-3xl tabular-nums ${urgent ? "text-danger" : ""}`} data-testid="runner-timer" aria-live="polite">{graded ? "—" : `${left}s`}</span>
        </div>
        {!graded ? (
          <>
            <textarea
              className="mt-4 min-h-40 w-full rounded-md border border-border bg-bg p-3 text-sm focus:border-accent focus:outline-none"
              placeholder="Headline first, then the reasons, then one implication."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={pending}
              data-testid="runner-answer"
            />
            {voiceEnabled && <VoiceCapture disabled={pending} onTranscript={(t) => setAnswer((a) => (a ? `${a} ${t}` : t))} onMetrics={setVoiceMetrics} />}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => submit(false)} disabled={pending} data-testid="runner-submit">{pending ? "Grading…" : "Submit answer"}</Button>
              {pending && <span className="text-xs text-muted" data-testid="runner-grading">Grading against the model answer…</span>}
              {error && <span className="text-sm text-danger" data-testid="runner-error">{error}</span>}
            </div>
          </>
        ) : (
          <GradeReveal graded={graded} questionId={turn.questionId} onNext={next} isLast={turn.ordinal >= turns.length - 1} pending={pending || finishing} />
        )}
      </section>
      {done && <p className="text-xs text-muted">Almost there — the report is next.</p>}
      <Link href="/home/interviews" className="text-xs text-muted hover:text-fg">Back to mock interviews</Link>
    </div>
  );
}

function GradeReveal({ graded, questionId, onNext, isLast, pending }: { graded: Graded; questionId: string; onNext: () => void; isLast: boolean; pending: boolean }) {
  const g = graded.grade;
  return (
    <div className="mt-4 flex flex-col gap-4" data-testid="grade-reveal">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-semibold tabular-nums" data-testid="turn-score">{graded.score}<span className="text-base text-muted"> / 10</span></span>
        <Badge>Accuracy {g.accuracy}/4</Badge>
        <Badge>Structure {g.structure}/3</Badge>
        <Badge>Depth {g.depth}/3</Badge>
        {graded.late && <Badge tone="danger">Over time</Badge>}
        <span className="ml-auto text-xs text-muted">{Math.round(graded.durationS)}s · graded by {graded.gradedBy.startsWith("fixture") ? "offline rubric" : "Opus 5"}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Hit</h3>
          <ul className="mt-1 list-disc pl-5 text-sm" data-testid="grade-hit">{g.hit.length ? g.hit.map((h) => <li key={h}>{h}</li>) : <li className="list-none text-muted">Nothing landed.</li>}</ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Missed</h3>
          <ul className="mt-1 list-disc pl-5 text-sm" data-testid="grade-missed">{g.missed.length ? g.missed.map((h) => <li key={h}>{h}</li>) : <li className="list-none text-muted">Nothing — full coverage.</li>}</ul>
        </div>
      </div>
      <div className="rounded-md border border-border p-3 text-sm" data-testid="grade-feedback"><Markdown md={g.feedback_md} /></div>
      <p className="text-sm text-muted" data-testid="grade-tip"><span className="font-semibold text-fg">Interviewer would push on:</span> {g.mentor_tip_md}</p>
      <div className="flex flex-wrap items-center gap-3">
        <AskMentorButton target={{ kind: "question", questionId, attemptId: graded.attemptId }} />
        <Button type="button" className="ml-auto" onClick={onNext} disabled={pending} data-testid="runner-next">{isLast ? (pending ? "Building your report…" : "Finish → report") : "Next question →"}</Button>
      </div>
    </div>
  );
}
