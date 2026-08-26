// `npm run content:approve -- --topic accounting,eqv-ev [--dry-run] [--no-db] [--dir content]`
// Flips `generated` lessons/questions of the named topics to `approved` — in the content/ files
// and in the DB — but only those that pass the approval rules (assertApprovable /
// assertQuestionApprovable) and carry no `check_problems`. Records a content_reviews row
// (reviewer null, comment "auto-approved …"). Run only after `npm run eval -- --suite
// lessons,questions` passes (.claude/rules/content.md); list every approval in the loop retro.
import { config as loadEnv } from "dotenv";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { approvalProblems, validateLessonBody } from "../../src/lib/content/lesson-schema";
import { validateQuestion } from "../../src/lib/content/question-schema";
import { findSubtopic } from "../../src/lib/content/taxonomy";

loadEnv({ path: ".env.local" });

export type ApproveDecision = { file: string; kind: "lesson" | "question"; slug: string; topic: string; approve: boolean; reason: string };

/** Pure: decides, per file, whether it can be auto-approved. */
export function approvalDecisions(dir: string, topics: string[]): ApproveDecision[] {
  const out: ApproveDecision[] = [];
  const files = (sub: string) => { try { return readdirSync(path.join(dir, sub)).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(dir, sub, f)); } catch { return []; } };
  for (const file of files("lessons")) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as { slug: string; subtopic_slug: string; status: string; body: unknown; check_problems?: string[] };
    const st = findSubtopic(raw.subtopic_slug);
    const topic = st?.topic.slug ?? "?";
    if (!topics.includes(topic)) continue;
    const base = { file, kind: "lesson" as const, slug: raw.slug, topic };
    if (raw.status !== "generated") { out.push({ ...base, approve: false, reason: `status ${raw.status}` }); continue; }
    if (raw.check_problems?.length) { out.push({ ...base, approve: false, reason: `check_problems: ${raw.check_problems[0]}` }); continue; }
    const v = validateLessonBody(raw.body);
    if (!v.ok) { out.push({ ...base, approve: false, reason: v.errors[0] }); continue; }
    const problems = approvalProblems(v.value, { walkthrough: st?.subtopic.walkthrough });
    out.push(problems.length ? { ...base, approve: false, reason: problems[0] } : { ...base, approve: true, reason: "passes approval rules" });
  }
  for (const file of files("questions")) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as { slug: string; topic_slug: string; status: string; check_problems?: string[] };
    if (!topics.includes(raw.topic_slug)) continue;
    const base = { file, kind: "question" as const, slug: raw.slug, topic: raw.topic_slug };
    if (raw.status !== "generated") { out.push({ ...base, approve: false, reason: `status ${raw.status}` }); continue; }
    if (raw.check_problems?.length) { out.push({ ...base, approve: false, reason: `check_problems: ${raw.check_problems[0]}` }); continue; }
    const v = validateQuestion(raw);
    if (!v.ok) { out.push({ ...base, approve: false, reason: v.errors[0] }); continue; }
    if (v.value.kind === "calculation" && v.value.difficulty === 4 && !v.value.numbers) { out.push({ ...base, approve: false, reason: "difficulty-4 calculation needs numbers" }); continue; }
    out.push({ ...base, approve: true, reason: "passes approval rules" });
  }
  return out;
}

export async function applyApprovals(decisions: ApproveDecision[], db: SupabaseClient | null, opts: { dryRun?: boolean } = {}): Promise<number> {
  let n = 0;
  for (const d of decisions) {
    if (!d.approve) continue;
    n++;
    if (opts.dryRun) continue;
    const raw = JSON.parse(readFileSync(d.file, "utf8")) as Record<string, unknown>;
    raw.status = "approved";
    writeFileSync(d.file, JSON.stringify(raw, null, 2) + "\n");
    if (!db) continue;
    const table = d.kind === "lesson" ? "lessons" : "questions";
    const { data, error } = await db.from(table).update({ status: "approved" }).eq("slug", d.slug).select("id").maybeSingle();
    if (error) throw new Error(`${table} ${d.slug}: ${error.message}`);
    if (data) {
      const { error: rErr } = await db.from("content_reviews").insert({ target_type: d.kind, target_id: data.id, reviewer_id: null, decision: "approved", comment: "auto-approved by scripts/content/approve.ts after `npm run eval -- --suite lessons,questions` passed" });
      if (rErr) throw new Error(`content_reviews ${d.slug}: ${rErr.message}`);
    }
  }
  return n;
}

async function main(argv = process.argv.slice(2)) {
  const i = argv.indexOf("--topic");
  const topics = i >= 0 ? argv[i + 1].split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (!topics.length) { console.error("usage: npm run content:approve -- --topic accounting,eqv-ev [--dry-run] [--no-db] [--dir content]"); process.exit(1); }
  const di = argv.indexOf("--dir");
  const dir = path.resolve(di >= 0 ? argv[di + 1] : "content");
  const dryRun = argv.includes("--dry-run");
  const decisions = approvalDecisions(dir, topics);
  for (const d of decisions) console.log(`${d.approve ? "APPROVE" : "skip   "} ${d.kind.padEnd(8)} ${d.slug} — ${d.reason}`);
  const db = argv.includes("--no-db") ? null : (await import("../seed/env")).adminClient();
  const n = await applyApprovals(decisions, db, { dryRun });
  console.log(`approve: ${n} item(s) ${dryRun ? "would be" : ""} approved in ${topics.join(", ")} (${decisions.length - n} skipped)`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
