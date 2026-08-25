// /home/path/[week] — the five days of one week; lessons that exist link through, the rest show
// their planned label (Loop 04 fills them; Loop 05 adds progress).
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getPath } from "@/lib/content/queries";
import { DEFAULT_PATH } from "@/lib/content/taxonomy";
import { Badge } from "@/components/ui/badge";

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
        <h1 className="mt-2 text-2xl font-semibold" data-testid="week-heading">Week {n}: {plan?.title ?? ""}</h1>
      </div>
      <ol className="flex flex-col gap-3" data-testid="day-list">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4" data-testid="day-row">
            <span className="w-14 shrink-0 text-xs uppercase tracking-wide text-muted">Day {it.day}</span>
            {it.lesson && plan ? (
              <Link href={`/home/technicals/${plan.topic_slug}/${it.lesson.slug}`} className="text-sm underline-offset-2 hover:underline" data-testid="day-lesson-link">
                {it.lesson.title} <span className="text-xs text-muted">· {it.lesson.reading_minutes} min</span>
              </Link>
            ) : (
              <span className="text-sm">{it.label}</span>
            )}
            <span className="ml-auto">{it.lesson ? <Badge tone="accent">Ready</Badge> : it.day === 5 ? <Badge>Review</Badge> : <Badge>Coming soon</Badge>}</span>
          </li>
        ))}
      </ol>
      <div className="flex justify-between text-sm">
        {n > 1 ? <Link href={`/home/path/${n - 1}`} className="text-muted hover:text-fg">← Week {n - 1}</Link> : <span />}
        {n < data.path.weeks ? <Link href={`/home/path/${n + 1}`} className="text-muted hover:text-fg">Week {n + 1} →</Link> : <span />}
      </div>
    </>
  );
}
