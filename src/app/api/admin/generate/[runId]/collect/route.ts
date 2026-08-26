// POST /api/admin/generate/[runId]/collect — staff only. Fetches the run's batch results, runs the
// automatic checks and upserts lessons/questions (as generated/draft) into the DB. The content/
// JSON files are written by `npm run content:collect -- --run <id>` locally (read-only FS here).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { isStaff } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClient, hasAnthropicKey } from "@/lib/ai/client";
import { getRun } from "@/lib/content/generate/load";
import { collectRun } from "@/lib/content/generate/service";

export const maxDuration = 300;

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/generate/[runId]/collect">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isStaff(session.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { runId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(runId)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  if (!hasAnthropicKey()) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  const db = createAdminClient();
  const run = await getRun(db, runId);
  if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });
  try {
    const r = await collectRun(db, getClient(), run);
    return NextResponse.json({ run: r.run, summary: r.summary, loaded: r.loaded, note: "content/ files: run `npm run content:collect -- --run " + run.id + "` locally" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: /not ended/.test(message) ? 409 : 500 });
  }
}
