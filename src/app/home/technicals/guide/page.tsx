// /home/technicals/guide — the complete technicals guide (Loop 21): every chapter's one-line
// takeaways, its cheat sheet and the rapid-fire questions with short answers, on one page. Approved
// content only (src/lib/content/guide.ts). This page *is* the PDF: `npm run packs:build -- --guide`
// prints it and /home/technicals/guide/pdf serves the file.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getGuide, type GuideLesson } from "@/lib/content/guide";
import { Markdown } from "@/components/lesson/markdown";
import { CheatSheetBody } from "@/components/lesson/cheatsheet-body";
import { PrintButton } from "@/components/path/print-button";

export const metadata: Metadata = { title: "The complete technicals guide — A* Apply", robots: { index: false, follow: false } };

const eyebrow = "text-xs font-semibold uppercase tracking-wide text-muted";

function Takeaways({ lessons, topicSlug }: { lessons: GuideLesson[]; topicSlug: string }) {
  return (
    <ol className="mt-3 grid gap-3" data-testid="guide-takeaways">
      {lessons.map((l) => (
        <li key={l.slug} className="border-l-2 border-border pl-3">
          <Link href={`/home/technicals/${topicSlug}/${l.slug}`} className="text-sm font-medium hover:underline print:no-underline">{l.title}</Link>
          {l.one_liner && <div className="mt-0.5 text-sm text-muted"><Markdown md={l.one_liner} /></div>}
        </li>
      ))}
    </ol>
  );
}

export default async function GuidePage({ searchParams }: PageProps<"/home/technicals/guide">) {
  await verifySession("/home/technicals");
  const sp = await searchParams;
  const db = await createClient();
  const { chapters, extras } = await getGuide(db);
  const lessonCount = chapters.reduce((n, c) => n + c.lessons.length, 0) + extras.length;
  const rapidCount = chapters.reduce((n, c) => n + c.rapid.length, 0);

  return (
    <article className="mx-auto w-full max-w-3xl" data-pack data-testid="guide">
      <div className="mb-8 flex flex-wrap items-center gap-3 print:hidden" data-print-hide>
        <Link href="/home/technicals" className="mr-auto text-sm text-muted hover:text-fg">← Technicals</Link>
        <PrintButton auto={sp.print === "1"} />
        {/* A plain anchor: the route answers with a file, not a page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
        <a href="/home/technicals/guide/pdf" className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-fg hover:brightness-110" data-testid="guide-download">Download PDF</a>
      </div>

      <header data-testid="guide-cover">
        <Image src="/wordmark.png" alt="A* Apply" width={140} height={68} className="h-auto w-32 print:brightness-0" />
        <p className={`mt-8 ${eyebrow}`}>Technicals</p>
        <h1 className="mt-1 font-display text-4xl font-semibold" data-testid="guide-heading">The complete technicals guide</h1>
        <p className="mt-2 text-sm text-muted">Everything a generalist investment-banking technical interview tests, chapter by chapter: {lessonCount} lesson takeaways, every formula, the answers to learn and the traps to avoid, and {rapidCount} rapid-fire questions with short answers.</p>

        <h2 className={`mt-8 ${eyebrow}`}>How to use it</h2>
        <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm">
          <li>Read it the week before an assessment centre, not instead of the lessons. Every line links back to the lesson that teaches it.</li>
          <li>Cover each rapid-fire answer and say yours out loud first. If you hesitate, open the lesson.</li>
          <li>Formulas are the ones you should write from memory; the &ldquo;you may hear&rdquo; boxes name ideas you only need to recognise.</li>
        </ul>

        <h2 className={`mt-8 ${eyebrow}`}>Contents</h2>
        <ol className="mt-2 grid gap-1 text-sm" data-testid="guide-contents">
          {chapters.map((c, i) => (
            <li key={c.topic.slug}><a href={`#${c.topic.slug}`} className="hover:underline">{i + 1}. {c.topic.title}</a> <span className="text-muted">· {c.lessons.length} lessons · {c.rapid.length} rapid-fire</span></li>
          ))}
          {extras.length > 0 && <li><a href="#brain-teasers" className="hover:underline">{chapters.length + 1}. Brain teasers and quick maths</a></li>}
        </ol>
      </header>

      {chapters.map((c, i) => (
        <section key={c.topic.slug} id={c.topic.slug} className="mt-16 scroll-mt-24 print:mt-0" data-pack-break data-testid="guide-chapter">
          <p className={eyebrow}>Chapter {i + 1}</p>
          <h1 className="mt-1 text-3xl font-semibold">{c.topic.title}</h1>
          <p className="mt-1 text-sm text-muted">{c.topic.summary}</p>

          <h2 className={`mt-8 ${eyebrow}`}>The takeaways, lesson by lesson</h2>
          <Takeaways lessons={c.lessons} topicSlug={c.topic.slug} />

          {c.sheet && <CheatSheetBody sheet={c.sheet} />}

          {c.rapid.length > 0 && (
            <>
              <h2 className={`mt-10 ${eyebrow}`}>Rapid fire</h2>
              <ol className="mt-3 grid gap-4" data-testid="guide-rapid">
                {c.rapid.map((q, n) => (
                  <li key={q.slug} className="flex gap-3" data-pack-keep>
                    <span className="w-6 shrink-0 font-mono text-sm text-muted">{n + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{q.question}</p>
                      <div className="mt-1 text-sm text-muted"><Markdown md={q.answer} /></div>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      ))}

      {extras.length > 0 && (
        <section id="brain-teasers" className="mt-16 scroll-mt-24 print:mt-0" data-pack-break data-testid="guide-extras">
          <p className={eyebrow}>Chapter {chapters.length + 1}</p>
          <h1 className="mt-1 text-3xl font-semibold">Brain teasers and quick maths</h1>
          <Takeaways lessons={extras} topicSlug="fit-behavioural" />
        </section>
      )}
    </article>
  );
}
