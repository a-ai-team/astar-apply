// /home/path/[week]/pack — the week on paper (Loop 20): cover and plan, every lesson laid out
// open, the chapter cheat sheet when the week closes one, a practice set, then its answers.
// This page *is* the PDF: `npm run packs:build` prints it to A4 and /home/path/[week]/pdf serves
// the file. `?print=1` opens the print dialog on arrival (the fallback when no PDF is stored yet).
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getWeekPack, type PackQuestion } from "@/lib/content/packs";
import { DEFAULT_PATH } from "@/lib/content/taxonomy";
import { DIFFICULTY_LABELS } from "@/lib/practice/queries";
import { Markdown } from "@/components/lesson/markdown";
import { PrintLesson } from "@/components/lesson/print-lesson";
import { CheatSheetBody } from "@/components/lesson/cheatsheet-body";
import { PrintButton } from "@/components/path/print-button";

export async function generateMetadata({ params }: PageProps<"/home/path/[week]/pack">): Promise<Metadata> {
  const { week } = await params;
  const plan = DEFAULT_PATH.weeks.find((w) => w.week === Number(week));
  return { title: plan ? `Week ${plan.week}: ${plan.title} — A* Apply` : "Week pack — A* Apply", robots: { index: false, follow: false } };
}

const eyebrow = "text-xs font-semibold uppercase tracking-wide text-muted";

function PracticeQuestion({ q, n, answer }: { q: PackQuestion; n: number; answer: boolean }) {
  return (
    <li className="flex gap-3" data-testid={answer ? "pack-answer" : "pack-question"} data-pack-keep={answer ? undefined : ""}>
      <span className="w-6 shrink-0 font-mono text-sm text-muted">{n}.</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{q.question}</p>
        {answer ? (
          <>
            <div className="mt-2 text-sm"><Markdown md={q.body.model_answer_md} /></div>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted">{q.body.key_points.map((k) => <li key={k}>{k}</li>)}</ul>
          </>
        ) : (
          <p className="mt-0.5 text-xs text-muted">{q.topic_title} · {DIFFICULTY_LABELS[q.difficulty]}</p>
        )}
      </div>
    </li>
  );
}

export default async function WeekPackPage({ params, searchParams }: PageProps<"/home/path/[week]/pack">) {
  await verifySession("/home/path");
  const [{ week }, sp] = await Promise.all([params, searchParams]);
  const n = Number(week);
  if (!Number.isInteger(n)) notFound();
  const db = await createClient();
  const pack = await getWeekPack(db, n);
  if (!pack) notFound();
  const { plan, days, cheatsheet, practice } = pack;
  const lessons = days.filter((d) => d.lesson);
  const minutes = lessons.reduce((m, d) => m + (d.lesson?.reading_minutes ?? 0), 0);
  const mock = practice.kind === "mock";

  return (
    <article className="mx-auto w-full max-w-3xl" data-pack data-testid="week-pack">
      <div className="mb-8 flex flex-wrap items-center gap-3 print:hidden" data-print-hide>
        <Link href={`/home/path/${n}`} className="mr-auto text-sm text-muted hover:text-fg">← Week {n}</Link>
        <PrintButton auto={sp.print === "1"} />
        {/* A plain anchor: the route answers with a file, not a page. */}
        <a href={`/home/path/${n}/pdf`} className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-fg hover:brightness-110" data-testid="pack-download">Download PDF</a>
      </div>

      <header data-testid="pack-cover">
        <Image src="/wordmark.png" alt="A* Apply" width={140} height={68} className="h-auto w-32 print:brightness-0" />
        <p className={`mt-8 ${eyebrow}`}>{DEFAULT_PATH.title} · Week {n} of {DEFAULT_PATH.weeks.length}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold" data-testid="pack-heading">{plan.title}</h1>
        {lessons.length > 0 && <p className="mt-2 text-sm text-muted">{lessons.length} lesson{lessons.length === 1 ? "" : "s"} · about {minutes} minutes of reading · {practice.questions.length} {mock ? "mock" : "core"} questions with answers</p>}

        <h2 className={`mt-8 ${eyebrow}`}>The week</h2>
        <table className="mt-2 w-full text-sm" data-testid="pack-plan">
          <tbody>
            {days.map((d) => (
              <tr key={d.day} className="border-t border-border align-top">
                <td className="w-16 py-2 pr-3 text-xs uppercase tracking-wide text-muted">Day {d.day}</td>
                <td className="py-2 pr-3">{d.lesson?.title ?? d.label}{d.lesson && d.cheatsheet ? " + cheat sheet" : ""}</td>
                <td className="py-2 text-right text-muted">{d.lesson ? `${d.lesson.reading_minutes} min` : d.lesson_slug ? "On the site soon" : d.cheatsheet ? "Cheat sheet" : /mock/i.test(d.label) ? "Mock" : /^review/i.test(d.label) ? "Review" : "Drill"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className={`mt-8 ${eyebrow}`}>How to use this pack</h2>
        <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm">
          <li>One lesson a day. Wherever a dashed rule says <em>check</em>, cover what sits under it and answer out loud first.</li>
          <li>Write the fill-in numbers in pen; the blanks are answered directly beneath each table.</li>
          {mock
            ? <li>Sit the mock in one go: 15 questions, about two minutes each, spoken out loud. Mark yourself against the answers at the back.</li>
            : <li>The core questions are the ones asked of everyone — if you can answer all of them out loud, the week is done. Answers are at the back, on their own pages.</li>}
          <li>The interactive models, industry lenses, flashcards and timed mocks live on the site — the pack is the part that works on paper.</li>
        </ul>
      </header>

      {lessons.map((d) => (
        <section key={d.day} className="mt-16 print:mt-0" data-pack-break data-testid="pack-lesson">
          <p className={eyebrow}>Week {n} · Day {d.day} · {d.lesson!.reading_minutes} min</p>
          <h1 className="mt-1 text-3xl font-semibold">{d.lesson!.title}</h1>
          <div className="mt-8"><PrintLesson body={d.lesson!.body} /></div>
        </section>
      ))}

      {cheatsheet && (
        <section className="mt-16 print:mt-0" data-pack-break data-testid="pack-cheatsheet">
          <p className={eyebrow}>Week {n} · Day 5</p>
          <h1 className="mt-1 text-3xl font-semibold">{cheatsheet.topic_title} — cheat sheet</h1>
          <CheatSheetBody sheet={cheatsheet.sheet} />
        </section>
      )}

      {practice.questions.length > 0 && (
        <>
          <section className="mt-16 print:mt-0" data-pack-break data-testid="pack-practice">
            <p className={eyebrow}>Week {n} · {mock ? "Full mock" : "Core questions"}</p>
            <h1 className="mt-1 text-3xl font-semibold">{mock ? "Full mock: every chapter, timed" : "The questions you must be able to answer"}</h1>
            <p className="mt-2 text-sm text-muted">{mock ? "About two minutes a question, out loud, no notes. Thirty minutes in total." : "Every core question for this week, in lesson order. Answer each one out loud before you turn to the answers; the stretch questions for elite-boutique and later rounds are on the site."}</p>
            <ol className="mt-6 grid gap-5">{practice.questions.map((q, i) => <PracticeQuestion key={q.slug} q={q} n={i + 1} answer={false} />)}</ol>
          </section>
          <section className="mt-16 print:mt-0" data-pack-break data-testid="pack-answers">
            <p className={eyebrow}>Week {n} · Answers</p>
            <h1 className="mt-1 text-3xl font-semibold">Model answers</h1>
            <ol className="mt-6 grid gap-8">{practice.questions.map((q, i) => <PracticeQuestion key={q.slug} q={q} n={i + 1} answer />)}</ol>
          </section>
        </>
      )}
    </article>
  );
}
