// GET /api/cron/pulse — Vercel Cron entry point (vercel.json: `0 6 * * 1`, Monday 06:00 UTC).
// Requires `Authorization: Bearer <CRON_SECRET>` (401 otherwise). Generates this week's Pulse digest
// (live: Opus 5 + web search; fixture when resolveChatMode() says no credit / CHAT_MODE=fixture) and
// upserts it as `generated` (PULSE_AUTO_PUBLISH=true → approved). An already-stored week is skipped
// unless `?force=1`; `?week=YYYY-MM-DD` (a Monday) targets another week; `?dry=1` skips the write.
import { NextResponse } from "next/server";
import { resolveChatMode } from "@/lib/chat/mode";
import { cronAuthorized } from "@/lib/pulse/cron";
import { generateDigest, storeDigest } from "@/lib/pulse/generate";
import { isWeekStart, weekStart } from "@/lib/pulse/schema";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const week = url.searchParams.get("week") ?? weekStart();
  if (!isWeekStart(week)) return NextResponse.json({ error: "week must be a Monday as YYYY-MM-DD" }, { status: 400 });
  const force = url.searchParams.get("force") === "1";
  const dry = url.searchParams.get("dry") === "1";
  const t0 = Date.now();
  try {
    const mode = (await resolveChatMode()) === "live" ? "live" : "fixture";
    const d = await generateDigest(week, mode);
    const summary = { week_start: week, mode, model: d.model, prompt_version: d.prompt_version, stories: d.body.stories.length, searches_used: d.research.searches_used, dropped: d.dropped, ms: Date.now() - t0 };
    if (dry) return NextResponse.json({ ...summary, stored: null });
    const stored = await storeDigest(createAdminClient(), week, d, { force });
    console.log(`pulse cron ${week}: ${stored.skipped ? `skipped (${stored.skipped})` : `stored ${stored.id} as ${stored.status}`} [${mode}]`);
    return NextResponse.json({ ...summary, stored });
  } catch (e) {
    console.error("pulse cron failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), week_start: week }, { status: 500 });
  }
}
