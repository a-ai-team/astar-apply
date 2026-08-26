// Lessons suite (CONTRACTS.md): schema 100 % over content/lessons/**, zero 8-gram overlap with the
// hidden 400Q set (HIDDEN SET MISSING → warning), readability ≥ 4/5 judged by Opus 5 on a 15-lesson
// sample (NO API CREDIT → readability skipped and reported, suite passes on schema + overlap only).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isCredentialFailure, probeApi } from "../../dev/api-probe";
import { approvalProblems, validateLessonBody } from "../../../src/lib/content/lesson-schema";
import { jsonText, overlapCount } from "../../../src/lib/content/overlap";
import { findSubtopic } from "../../../src/lib/content/taxonomy";
import { loadReference } from "../overlap";
import { judgeReadability } from "../readability";
import { THRESHOLDS } from "../thresholds";
import type { SuiteResult } from "../index";

type LessonFile = { slug: string; subtopic_slug: string; title: string; status: string; body: unknown; check_problems?: string[] };

export function loadLessonFiles(root = path.resolve("content", "lessons")): LessonFile[] {
  let files: string[] = [];
  try { files = readdirSync(root).filter((f) => f.endsWith(".json")).sort(); } catch { return []; }
  return files.map((f) => JSON.parse(readFileSync(path.join(root, f), "utf8")) as LessonFile);
}

function lessonProse(body: unknown): string {
  return jsonText(body);
}

export async function run({ limit }: { limit: number | null }): Promise<SuiteResult> {
  const t = THRESHOLDS.lessons;
  const thresholds = { schema_rate: t.schema_rate, overlap_hits: t.overlap_hits, readability: t.readability };
  const lessons = loadLessonFiles().slice(0, limit ?? undefined);
  const notes: string[] = [];
  const items: unknown[] = [];
  if (!lessons.length) return { suite: "lessons", passed: false, metrics: { n: 0 }, thresholds, items, notes: ["no lessons under content/lessons — run the batch + content:collect first"] };

  let schemaOk = 0;
  let approvable = 0;
  const ref = loadReference();
  if (!ref) notes.push("HIDDEN SET MISSING — overlap not checked (run scripts/eval/extract-400q.ts)");
  let overlapHits = 0;
  const valid: { slug: string; title: string; text: string }[] = [];
  for (const l of lessons) {
    const v = validateLessonBody(l.body);
    const item: Record<string, unknown> = { slug: l.slug, status: l.status, schema: v.ok };
    if (v.ok) {
      schemaOk++;
      const problems = approvalProblems(v.value, { walkthrough: findSubtopic(l.subtopic_slug)?.subtopic.walkthrough });
      item.approval_problems = problems;
      if (!problems.length) approvable++;
      const text = lessonProse(v.value);
      if (ref) { const hits = overlapCount(text, ref); item.overlap_hits = hits; overlapHits += hits; if (hits) console.log(`  overlap ${l.slug}: ${hits} hit(s)`); }
      valid.push({ slug: l.slug, title: l.title, text });
    } else { item.errors = v.errors; console.log(`  schema ${l.slug}: ${v.errors[0]}`); }
    items.push(item);
  }
  const schemaRate = schemaOk / lessons.length;

  // Readability: deterministic 15-lesson sample (every k-th) so reruns judge the same lessons.
  const sampleSize = Math.min(15, valid.length);
  const step = Math.max(1, Math.floor(valid.length / sampleSize));
  const sample = valid.filter((_, i) => i % step === 0).slice(0, sampleSize);
  let readability: number | null = null;
  let skipped: string | undefined;
  const probe = await probeApi();
  if (!probe.ok) {
    skipped = `${probe.reason === "billing" ? "NO API CREDIT" : probe.reason === "no-key" ? "NO API KEY" : `API ${probe.reason.toUpperCase()}`} — readability not judged`;
    console.warn(`  ${skipped} (${probe.message.slice(0, 100)})`);
    if (!isCredentialFailure(probe)) throw new Error(probe.message);
  } else {
    let sum = 0;
    for (const s of sample) {
      const r = await judgeReadability({ title: s.title, text: s.text });
      sum += r.readability;
      items.push({ slug: s.slug, readability: r.readability, notes: r.notes });
      if (r.readability < t.readability) console.log(`  readability ${s.slug}: ${r.readability} — ${r.notes}`);
    }
    readability = sample.length ? sum / sample.length : null;
  }

  const passed = schemaRate >= t.schema_rate && overlapHits <= t.overlap_hits && (readability === null ? Boolean(skipped) : readability >= t.readability);
  return {
    suite: "lessons",
    passed,
    skipped,
    metrics: { n: lessons.length, schema_rate: schemaRate, approvable, overlap_hits: ref ? overlapHits : null, overlap_checked: Boolean(ref), readability, readability_sample: probe.ok ? sample.length : 0 },
    thresholds,
    items,
    notes,
  };
}
