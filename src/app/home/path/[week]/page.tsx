// /home/path/[week] — the five days of one week; lessons that exist link through, the rest show
// their planned label (Loop 04 fills them; Loop 05 adds progress). Loop 20: drill, review and mock
// days link to where that work happens, and the week downloads as a PDF pack.
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getPath } from "@/lib/content/queries";
import { DEFAULT_PATH } from "@/lib/content/taxonomy";
import { Badge } from "@/components/ui/badge";

/** Where a lesson-less day's work happens: the mock studio, the flashcard deck or the chapter's bank. */
function drillHref(label: string, topic: string, hasLessons: boolean): string {
  if (/mock/i.test(label)) return "/home/interviews";
  if (/^review/i.test(label)) return "/home/flashcards";
  return hasLessons ? `/home/practice?topic=${topic}` : "/home/practice";
}

export default async function WeekPage({ params }: PageProps<"/home/path/[week]">) {
  await verifySession("/home/path");
  const { week } = await params;
  const n = Number(week);
  const db = await createClient();
  const data = await getPath(db);
  if (!data || !Number.isInteger(n) || n < 1 || n > data.path.weeks) notFound();
  const plan = DEFAULT_PATH.weeks.find((w) => w.week === n);
  const items = data.items.filter((i) => i.week === n);
  return (
    <>
      <div>
        <Link href="/home/path" className="text-sm text-muted hover:text-fg">← 10-week path</Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="mr-auto text-2xl font-semibold" data-testid="week-heading">Week {n}: {plan?.title ?? ""}</h1>
          <Link href={`/home/path/${n}/pack`} className="text-sm text-muted underline-offset-2 hover:text-fg hover:underline" data-testid="week-pack-link">Print view</Link>
          {/* A plain anchor: the route answers with a file, not a page. */}
          <a href={`/home/path/${n}/pdf`} className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-fg hover:brightness-110" data-testid="week-pdf-link">Download PDF</a>
        </div>
      </div>
      <ol className="flex flex-col gap-3" data-testid="day-list">
        {items.map((it) => {
          // Cheat-sheet days are label-only in the DB (`lesson_id` null); the sheet's topic
          // lives in DEFAULT_PATH, so the link is resolved from the plan rather than a row.
          const planDay = plan?.days.find((d) => d.day === it.day);
          const cheatsheet = planDay?.cheatsheet;
          return (
            <li key={it.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4" data-testid="day-row">
              <span className="w-14 shrink-0 text-xs uppercase tracking-wide text-muted">Day {it.day}</span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {it.lesson ? (
                  <Link href={`/home/technicals/${it.lesson.topic_slug}/${it.lesson.slug}`} className="text-sm underline-offset-2 hover:underline" data-testid="day-lesson-link">
                    {it.lesson.title} <span className="text-xs text-muted">· {it.lesson.reading_minutes} min</span>
                  </Link>
                ) : !cheatsheet && planDay && !planDay.lesson_slug ? (
                  <Link href={drillHref(it.label, plan!.topic_slug, items.some((x) => x.lesson))} className="text-sm underline-offset-2 hover:underline" data-testid="day-drill-link">{it.label}</Link>
                ) : !cheatsheet ? (
                  <span className="text-sm">{it.label}</span>
                ) : null}
                {cheatsheet ? (
                  <Link href={`/home/technicals/${cheatsheet}/cheatsheet`} className="text-sm underline-offset-2 hover:underline" data-testid="path-cheatsheet-link">
                    {it.lesson ? "Cheat sheet" : it.label}
                  </Link>
                ) : null}
              </span>
              <span className="ml-auto">{it.lesson ? <Badge tone="accent">Ready</Badge> : cheatsheet ? <Badge tone="accent">Cheat sheet</Badge> : planDay?.lesson_slug ? <Badge>Coming soon</Badge> : it.day === 5 ? <Badge>Review</Badge> : <Badge>Drill</Badge>}</span>
            </li>
          );
        })}
      </ol>
      <div className="flex justify-between text-sm">
        {n > 1 ? <Link href={`/home/path/${n - 1}`} className="text-muted hover:text-fg">← Week {n - 1}</Link> : <span />}
        {n < data.path.weeks ? <Link href={`/home/path/${n + 1}`} className="text-muted hover:text-fg">Week {n + 1} →</Link> : <span />}
      </div>
    </>
  );
}
