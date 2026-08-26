// /admin/pulse — every weekly digest with its status, a preview, and approve/reject (Loop 08).
// The cron stores weeks as `generated`; nothing reaches /home/pulse until approved here.
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDigest, listDigests, weekLabel } from "@/lib/pulse/queries";
import { FIXTURE_DIGEST_VERSION } from "@/lib/pulse/generate";
import { DigestView } from "@/components/pulse/digest-view";
import { StatusAction } from "@/components/admin/status-action";
import { Badge } from "@/components/ui/badge";
import { setDigestStatus } from "./actions";

export default async function AdminPulsePage({ searchParams }: PageProps<"/admin/pulse">) {
  await verifyStaff();
  const sp = await searchParams;
  const db = createAdminClient();
  const digests = await listDigests(db, { limit: 104 });
  const selectedWeek = typeof sp.week === "string" ? sp.week : digests[0]?.week_start;
  const selected = selectedWeek ? await getDigest(db, selectedWeek) : null;
  return (
    <>
      <h1 className="text-2xl font-semibold" data-testid="admin-pulse-heading">Pulse</h1>
      <p className="text-sm text-muted">{digests.length} weeks. The cron (<span className="font-mono">GET /api/cron/pulse</span>, Mondays 06:00 UTC) stores each digest as <span className="font-mono">generated</span>; approve to publish it on /home/pulse. Generate one now with <span className="font-mono">npm run pulse:generate</span>.</p>
      {digests.length === 0 ? (
        <p className="text-sm text-muted" data-testid="admin-pulse-empty">No digests yet.</p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="admin-pulse-list">
          {digests.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm" data-testid="admin-pulse-row" data-week={d.week_start} data-status={d.status}>
              <a href={`/admin/pulse?week=${d.week_start}`} className="font-medium underline">{weekLabel(d.week_start)}</a>
              {d.status === "approved" ? <Badge tone="accent">approved</Badge> : <Badge tone="danger">{d.status} · unverified</Badge>}
              <span className="text-xs text-muted">{d.story_count} stories · {d.headlines[0]}</span>
              <span className="ml-auto flex gap-1">
                {d.status !== "approved" && <StatusAction action={setDigestStatus} fields={{ id: d.id, to: "approved" }} label="Approve" variant="primary" testId="digest-approve" />}
                {d.status !== "rejected" && <StatusAction action={setDigestStatus} fields={{ id: d.id, to: "rejected" }} label="Reject" variant="ghost" />}
                {d.status === "approved" && <StatusAction action={setDigestStatus} fields={{ id: d.id, to: "generated" }} label="Unpublish" />}
              </span>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Preview · {weekLabel(selected.week_start)} <span className="text-sm font-normal text-muted">({selected.status} · {selected.model ?? "?"} · {selected.prompt_version ?? "?"})</span></h2>
          <DigestView body={selected.body} synthetic={selected.prompt_version === FIXTURE_DIGEST_VERSION} />
        </section>
      )}
    </>
  );
}
