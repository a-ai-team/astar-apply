// POST /api/admin/generate — { kind: "lessons"|"questions", topics?: string[], slugs?: string[], all?: boolean, force?: boolean, dry_run?: boolean }
// Staff only. Estimates, gates on CONTENT_MAX_BATCH_USD, then records a dry run or submits a
// Message Batch and returns the generation_runs row. Poll/collect via /admin/generation or
// POST /api/admin/generate/[runId]/collect.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import { isStaff } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClient, hasAnthropicKey } from "@/lib/ai/client";
import { startRun } from "@/lib/content/generate/service";

export const maxDuration = 60;

const Body = z.object({
  kind: z.enum(["lessons", "questions"]),
  topics: z.array(z.string()).optional(),
  slugs: z.array(z.string()).optional(),
  all: z.boolean().optional(),
  force: z.boolean().optional(),
  dry_run: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isStaff(session.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request", issues: parsed.error.issues }, { status: 400 });
  const { kind, topics, slugs, all, force, dry_run } = parsed.data;
  if (!all && !topics?.length && !slugs?.length) return NextResponse.json({ error: "pick all, topics or slugs" }, { status: 400 });
  try {
    const r = await startRun(createAdminClient(), hasAnthropicKey() ? getClient() : null, { kind, filter: { topics, slugs, all, force }, dryRun: Boolean(dry_run), userId: session.userId });
    const status = r.run.status === "failed" ? 400 : 200;
    return NextResponse.json({ run: r.run, estimate: r.estimate, targets: r.targets, ...(status === 400 ? { error: `estimate $${r.estimate.usd.toFixed(2)} exceeds CONTENT_MAX_BATCH_USD` } : {}) }, { status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
