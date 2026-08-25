// /home/path — weeks 1–10 of the default learning path with their lessons.
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getPath } from "@/lib/content/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { DEFAULT_PATH } from "@/lib/content/taxonomy";

export default async function PathPage() {
  await verifySession("/home/path");
  const db = await createClient();
  const data = await getPath(db);
  if (!data) return <p className="text-sm text-muted">No learning path seeded yet (`npm run seed -- 03`).</p>;
  const weeks = Array.from({ length: data.path.weeks }, (_, i) => i + 1);
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="path-heading">{data.path.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{data.path.description}</p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="week-grid">
        {weeks.map((w) => {
          const items = data.items.filter((i) => i.week === w);
          const ready = items.filter((i) => i.lesson).length;
          const title = DEFAULT_PATH.weeks.find((x) => x.week === w)?.title ?? `Week ${w}`;
          return (
            <li key={w}>
              <Link href={`/home/path/${w}`} data-testid="week-card">
                <Card className="h-full hover:border-muted">
                  <p className="text-xs uppercase tracking-wide text-muted">Week {w}</p>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{items.length} days · {ready} lesson{ready === 1 ? "" : "s"} ready</CardDescription>
                </Card>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
