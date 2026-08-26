// `npm run pulse:generate -- [--week YYYY-MM-DD] [--dry-run] [--force] [--fixture]` — generates the
// weekly Pulse digest (Opus 5 + web_search_20260209 research pass → structured digest pass) and
// upserts it into pulse_digests as `generated` (PULSE_AUTO_PUBLISH=true → approved). Always writes
// the digest to .eval/pulse-<week>.json. --dry-run skips the DB write. Without API credit (or with
// --fixture) it prints `NO API CREDIT — fixture digest` and uses the recorded/synthetic fixture.
import { config as loadEnv } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isCredentialFailure, probeApi } from "../../src/lib/ai/probe";
import { generateDigest, storeDigest } from "../../src/lib/pulse/generate";
import { isWeekStart, weekStart } from "../../src/lib/pulse/schema";
import { adminClient } from "../seed/env";

loadEnv({ path: ".env.local" });

async function main() {
  const args = process.argv.slice(2);
  const week = args.includes("--week") ? args[args.indexOf("--week") + 1] : weekStart();
  if (!isWeekStart(week)) throw new Error(`--week must be a Monday as YYYY-MM-DD (got ${week})`);
  const dry = args.includes("--dry-run");
  const force = args.includes("--force");
  let mode: "live" | "fixture" = args.includes("--fixture") ? "fixture" : "live";
  if (mode === "live") {
    const probe = await probeApi();
    if (!probe.ok) {
      if (!isCredentialFailure(probe)) console.warn(`pulse: API probe failed (${probe.reason}: ${probe.message})`);
      console.log(probe.reason === "billing" || probe.reason === "no-key" ? "NO API CREDIT — fixture digest" : `API UNAVAILABLE (${probe.reason}) — fixture digest`);
      mode = "fixture";
    }
  } else {
    console.log("FIXTURE MODE — fixture digest");
  }
  const t0 = Date.now();
  const d = await generateDigest(week, mode);
  const outDir = path.join(process.cwd(), ".eval");
  mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `pulse-${week}.json`);
  writeFileSync(out, `${JSON.stringify({ week_start: week, mode, model: d.model, prompt_version: d.prompt_version, searches_used: d.research.searches_used, results: d.research.results, dropped: d.dropped, body: d.body }, null, 2)}\n`);
  const sourced = d.body.stories.filter((s) => s.sources.length > 0).length;
  console.log(`pulse ${week}: ${d.body.stories.length} stories (${sourced} sourced), ${d.research.searches_used} searches, ${d.dropped.length} dropped, ${((Date.now() - t0) / 1000).toFixed(1)} s → ${path.relative(process.cwd(), out)}`);
  if (dry) {
    console.log("dry run — not stored");
    return;
  }
  const stored = await storeDigest(adminClient(), week, d, { force });
  console.log(stored.skipped ? `pulse ${week}: not stored — ${stored.skipped}` : `pulse ${week}: stored ${stored.id} as ${stored.status}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
