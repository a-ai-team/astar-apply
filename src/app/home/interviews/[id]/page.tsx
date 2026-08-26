// /home/interviews/[id] — the runner (Loop 07). Own rows only (RLS on the cookie client; a
// stranger's id → 404 here, 403 from the actions). Completed → report; abandoned → notice.
// The first unanswered turn is served (shown_at stamped, server clock) before the client mounts.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getInterview, getInterviewQuestions, getTurns } from "@/lib/interviews/queries";
import { InterviewRunner, type RunnerTurn } from "@/components/interviews/interview-runner";
import { Button } from "@/components/ui/button";
import { abandonInterview } from "../actions";

export const metadata: Metadata = { title: "Mock interview — A* Apply", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InterviewRunnerPage({ params }: PageProps<"/home/interviews/[id]">) {
  const session = await verifySession("/home/interviews");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const db = await createClient();
  const interview = await getInterview(db, id);
  // Own interviews only — staff RLS read access does not make someone else's mock a page (TODO(james): admin view in a later loop).
  if (!interview || interview.user_id !== session.userId) notFound();
  if (interview.status === "completed") redirect(`/home/interviews/${id}/report`);
  const [turns, questions] = await Promise.all([getTurns(db, id), getInterviewQuestions(db, interview.question_ids)]);
  const runnerTurns: RunnerTurn[] = turns.flatMap((t) => {
    const q = questions.get(t.question_id);
    if (!q) return [];
    return [{ ordinal: t.ordinal, questionId: q.id, question: q.question, difficulty: q.difficulty, topicTitle: q.topic_title, shownAt: t.shown_at, answered: Boolean(t.answered_at), score: t.score == null ? null : Number(t.score), grade: t.grade, attemptId: t.attempt_id }];
  });
  const current = runnerTurns.find((t) => !t.answered) ?? null;
  if (interview.status === "in_progress" && current && !current.shownAt) {
    const now = new Date().toISOString();
    await db.from("interview_turns").update({ shown_at: now }).eq("interview_id", id).eq("ordinal", current.ordinal).is("shown_at", null);
    current.shownAt = now;
  }
  const abandoned = interview.status === "abandoned";
  const title = interview.mode === "drill" ? `Drill · ${runnerTurns[0]?.topicTitle ?? "topic"}` : "Full mock";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="runner-heading">{title}</h1>
          <p className="mt-1 text-sm text-muted">{runnerTurns.length} question{runnerTurns.length === 1 ? "" : "s"} · {interview.seconds_per_question} s each{interview.mode === "mock" ? " · the timer submits for you" : ""}</p>
        </div>
        {!abandoned && (
          <form action={abandonInterview}>
            <input type="hidden" name="interviewId" value={id} />
            <Button type="submit" variant="ghost" size="sm" data-testid="abandon-interview">Abandon</Button>
          </form>
        )}
      </div>
      {abandoned ? (
        <div className="rounded-lg border border-border bg-surface p-5" data-testid="interview-abandoned">
          <p className="text-sm">This interview was abandoned. Its graded answers are kept in your history.</p>
          <Link href="/home/interviews" className="mt-3 inline-block text-sm underline-offset-2 hover:underline">Back to mock interviews</Link>
        </div>
      ) : (
        <InterviewRunner interviewId={id} mode={interview.mode} secondsPerQuestion={interview.seconds_per_question} turns={runnerTurns} initialOrdinal={current?.ordinal ?? null} serverNow={new Date().toISOString()} voiceEnabled={process.env.NEXT_PUBLIC_VOICE_MOCK === "on"} />
      )}
    </>
  );
}
