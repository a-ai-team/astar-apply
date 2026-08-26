// Questions suite (CONTRACTS.md): schema 100 % over content/questions/**, difficulty mix within
// ±15 % of 25/30/30/15 (gated once ≥ 40 questions exist — below that it is reported, not gated),
// zero 8-gram overlap with the hidden 400Q set. No model calls.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { difficultyShares } from "../../../src/lib/content/generate/checks";
import { jsonText, overlapCount } from "../../../src/lib/content/overlap";
import { validateQuestion, type Question } from "../../../src/lib/content/question-schema";
import { loadReference } from "../overlap";
import { THRESHOLDS } from "../thresholds";
import type { SuiteResult } from "../index";

export function loadQuestionFiles(root = path.resolve("content", "questions")): unknown[] {
  let files: string[] = [];
  try { files = readdirSync(root).filter((f) => f.endsWith(".json")).sort(); } catch { return []; }
  return files.map((f) => JSON.parse(readFileSync(path.join(root, f), "utf8")));
}

export async function run({ limit }: { limit: number | null }): Promise<SuiteResult> {
  const t = THRESHOLDS.questions;
  const thresholds = { schema_rate: t.schema_rate, mix_max_abs_diff: t.mix_max_abs_diff, overlap_hits: t.overlap_hits };
  const raws = loadQuestionFiles().slice(0, limit ?? undefined);
  const notes: string[] = [];
  const items: unknown[] = [];
  if (!raws.length) return { suite: "questions", passed: false, metrics: { n: 0 }, thresholds, items, notes: ["no questions under content/questions"] };
  const ref = loadReference();
  if (!ref) notes.push("HIDDEN SET MISSING — overlap not checked (run scripts/eval/extract-400q.ts)");
  const valid: Question[] = [];
  let overlapHits = 0;
  let d4NeedsNumbers = 0;
  for (const raw of raws) {
    const v = validateQuestion(raw);
    if (!v.ok) { items.push({ slug: (raw as { slug?: string }).slug, schema: false, errors: v.errors }); console.log(`  schema ${(raw as { slug?: string }).slug}: ${v.errors[0]}`); continue; }
    valid.push(v.value);
    if (v.value.kind === "calculation" && v.value.difficulty === 4 && !v.value.numbers) d4NeedsNumbers++;
    let hits = 0;
    if (ref) { hits = overlapCount(jsonText(v.value), ref); overlapHits += hits; if (hits) console.log(`  overlap ${v.value.slug}: ${hits} hit(s)`); }
    items.push({ slug: v.value.slug, schema: true, difficulty: v.value.difficulty, kind: v.value.kind, overlap_hits: ref ? hits : null });
  }
  const schemaRate = valid.length / raws.length;
  const mix = difficultyShares(valid);
  const mixGated = valid.length >= t.mix_min_n;
  if (!mixGated) notes.push(`difficulty mix reported but not gated: ${valid.length} < ${t.mix_min_n} questions`);
  const passed = schemaRate >= t.schema_rate && overlapHits <= t.overlap_hits && (!mixGated || mix.max_abs_diff <= t.mix_max_abs_diff);
  return {
    suite: "questions",
    passed,
    metrics: { n: raws.length, schema_rate: schemaRate, d4_calc_without_numbers: d4NeedsNumbers, mix_1: mix.shares[0], mix_2: mix.shares[1], mix_3: mix.shares[2], mix_4: mix.shares[3], mix_max_abs_diff: mix.max_abs_diff, mix_gated: mixGated, overlap_hits: ref ? overlapHits : null, overlap_checked: Boolean(ref) },
    thresholds,
    items,
    notes,
  };
}
