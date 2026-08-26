// /home/pulse/[week] — one week's approved digest by its Monday (YYYY-MM-DD). Non-Mondays and
// unapproved weeks 404 (RLS hides them from the cookie client).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getDigest, weekLabel } from "@/lib/pulse/queries";
import { isWeekStart } from "@/lib/pulse/schema";
import { FIXTURE_DIGEST_VERSION } from "@/lib/pulse/generate";
import { DigestView } from "@/components/pulse/digest-view";

export const metadata: Metadata = { title: "Pulse — A* Apply", robots: { index: false, follow: false } };

export default async function PulseWeekPage({ params }: PageProps<"/home/pulse/[week]">) {
  const { week } = await params;
  await verifySession(`/home/pulse/${week}`);
  if (!isWeekStart(week)) notFound();
  const db = await createClient();
  const digest = await getDigest(db, week);
  if (!digest) notFound();
  return (
    <>
      <div>
        <Link href="/home/pulse" className="text-sm text-muted hover:text-fg">← Pulse</Link>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="pulse-heading">{weekLabel(digest.week_start)}</h1>
        <p className="mt-1 text-sm text-muted" data-testid="pulse-week">{digest.body.stories.length} stories</p>
      </div>
      <DigestView body={digest.body} synthetic={digest.prompt_version === FIXTURE_DIGEST_VERSION} />
    </>
  );
}
