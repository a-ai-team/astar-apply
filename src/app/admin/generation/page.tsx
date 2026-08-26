// /admin/generation — generation_runs (dry runs, submitted batches, collected results) with
// refresh/collect controls, plus a form to start a run. The CLI (`npm run content:generate`)
// writes the same rows, so runs started from either place show up here.
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAnthropicKey } from "@/lib/ai/client";
import { CURRICULUM } from "@/lib/content/taxonomy";
import { maxBatchUsd } from "@/lib/content/generate/cost";
import type { GenerationRun } from "@/lib/content/generate/load";
import { Badge } from "@/components/ui/badge";
import { RunButtons, StartRunForm } from "@/components/review/generation-controls";

export const maxDuration = 300;

export default async function GenerationPage() {
  await verifyStaff();
  const db = createAdminClient();
  const { data, error } = await db.from("generation_runs").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  const runs = (data ?? []) as GenerationRun[];
  const hasKey = hasAnthropicKey();
  const tone = (s: string) => (s === "collected" ? "accent" : s === "failed" || s === "canceled" ? "danger" : "neutral");
  return (
    <>
      <h1 className="text-2xl font-semibold" data-testid="generation-heading">Generation runs</h1>
      <p className="text-sm text-muted">{runs.length} run{runs.length === 1 ? "" : "s"} · cap ${maxBatchUsd()} per batch · Batches API (custom_id = <span className="font-mono">lesson:&lt;slug&gt;</span> / <span className="font-mono">questions:&lt;subtopic&gt;:&lt;kind&gt;</span>).</p>
      <StartRunForm topics={CURRICULUM.map((t) => ({ slug: t.slug, title: t.title }))} hasKey={hasKey} />
      {runs.length === 0 && <p className="text-sm text-muted">No runs yet — start a dry run above or <span className="font-mono">npm run content:generate -- lessons --all --dry-run</span>.</p>}
      <ul className="flex flex-col gap-2" data-testid="generation-list">
        {runs.map((r) => {
          const est = r.params.estimate as { usd?: number; method?: string } | undefined;
          const topics = (r.params.filter as { topics?: string[]; all?: boolean } | undefined);
          return (
            <li key={r.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3" data-testid="generation-row">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge tone={tone(r.status)}>{r.status}</Badge>
                <span className="font-medium">{r.kind}</span>
                <span className="text-xs text-muted">{topics?.all ? "all topics" : (topics?.topics ?? []).join(", ") || "—"} · {r.requested} request(s) · {r.succeeded} ok / {r.failed} failed · ${Number(r.cost_usd).toFixed(2)}{est?.method ? ` (${r.status === "collected" ? "actual" : `estimate, ${est.method}`})` : ""}</span>
                <span className="ml-auto text-xs text-muted">{new Date(r.created_at).toLocaleString("en-GB")}{r.batch_id ? ` · ${r.batch_id}` : ""}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="font-mono">{r.id}</span>
                {r.params.aborted ? <span className="text-danger">aborted: {String(r.params.aborted)}</span> : null}
                <RunButtons id={r.id} status={r.status} hasKey={hasKey} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
