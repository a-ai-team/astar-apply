// /home/pulse — this week's (latest approved) market digest with interview framing, plus the
// archive (Loop 08). Cookie client: RLS serves approved digests only, so a freshly generated week
// stays invisible until a mentor approves it in /admin/pulse.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { latestDigest, listDigests, weekLabel } from "@/lib/pulse/queries";
import { FIXTURE_DIGEST_VERSION } from "@/lib/pulse/generate";
import { DigestView } from "@/components/pulse/digest-view";

export const metadata: Metadata = { title: "Pulse — A* Apply", robots: { index: false, follow: false } };

export default async function PulsePage() {
  await verifySession("/home/pulse");
  const db = await createClient();
  const [latest, archive] = await Promise.all([latestDigest(db), listDigests(db, { limit: 26 })]);
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="pulse-heading">Pulse</h1>
        <p className="mt-1 text-sm text-muted">The week&apos;s market stories, framed the way an interviewer would raise them: what happened, why a bank cares, what you could say, and the questions it might prompt. Written weekly, reviewed by a mentor before it appears here.</p>
      </div>
      {!latest ? (
        <p className="text-sm text-muted" data-testid="pulse-empty">No digest published yet — the first one appears once a mentor has approved it.</p>
      ) : (
        <>
          <p className="text-sm text-muted" data-testid="pulse-week">{weekLabel(latest.week_start)} · {latest.body.stories.length} stories</p>
          <DigestView body={latest.body} synthetic={latest.prompt_version === FIXTURE_DIGEST_VERSION} />
        </>
      )}
      {archive.length > 1 && (
        <section>
          <h2 className="text-lg font-semibold">Earlier weeks</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm" data-testid="pulse-archive">
            {archive.filter((d) => d.week_start !== latest?.week_start).map((d) => (
              <li key={d.id}><Link href={`/home/pulse/${d.week_start}`} className="underline" data-testid="pulse-archive-item">{weekLabel(d.week_start)}</Link> <span className="text-muted">· {d.headlines[0]}{d.story_count > 1 ? ` and ${d.story_count - 1} more` : ""}</span></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
