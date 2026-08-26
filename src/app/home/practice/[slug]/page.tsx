// /home/practice/[slug] — one question: QuestionCard (timer → reveal → follow-ups → self-grade →
// next). Filter search params are carried so "Next" walks the same set. Draft questions are
// hidden by RLS → 404.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { QuestionBodySchemaLoose } from "@/lib/practice/question-body";
import { attemptsForQuestion, bankHref, DIFFICULTY_LABELS, getQuestion, nextQuestionSlug, parseBankFilter } from "@/lib/practice/queries";
import { QuestionCard, GRADE_LABELS, type SelfGrade } from "@/components/practice/question-card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: PageProps<"/home/practice/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug.replace(/-/g, " ")} — Practice — A* Apply`, robots: { index: false, follow: false } };
}

export default async function QuestionPage({ params, searchParams }: PageProps<"/home/practice/[slug]">) {
  await verifySession("/home/practice");
  const { slug } = await params;
  const f = parseBankFilter(await searchParams);
  const db = await createClient();
  const q = await getQuestion(db, slug);
  if (!q) notFound();
  const body = QuestionBodySchemaLoose.safeParse(q.body);
  if (!body.success) notFound();
  const [next, history] = await Promise.all([nextQuestionSlug(db, q, f), attemptsForQuestion(db, q.id)]);
  const qs = bankHref(f, { page: undefined }).replace("/home/practice", "");
  return (
    <>
      <div>
        <Link href={bankHref(f)} className="text-sm text-muted hover:text-fg" data-testid="back-to-bank">← Practice</Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="accent">D{q.difficulty} · {DIFFICULTY_LABELS[q.difficulty]}</Badge>
          <Badge>{q.kind}</Badge>
          <Link href={`/home/technicals/${q.topic.slug}`}><Badge>{q.topic.title}</Badge></Link>
          {q.subtopic && <span className="text-xs text-muted">{q.subtopic.title}</span>}
        </div>
        <h1 className="mt-3 text-2xl font-semibold" data-testid="question-text">{q.question}</h1>
        {history.length > 0 && (
          <p className="mt-2 text-xs text-muted" data-testid="attempt-history">
            Last attempts: {history.map((a) => (a.self_grade ? GRADE_LABELS[a.self_grade as SelfGrade] : "AI")).join(" · ")}
          </p>
        )}
      </div>
      <QuestionCard questionId={q.id} difficulty={q.difficulty} body={body.data} nextHref={next ? `/home/practice/${next}${qs}` : null} backHref={bankHref(f)} />
    </>
  );
}
