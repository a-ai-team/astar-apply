// Seed 08 — 14 firm dossiers from fixtures/firms/*.json (upsert on slug), their hand-written
// questions from fixtures/firms/questions/<slug>.json (upsert on firm_id+question), and the clearly
// synthetic fixtures/pulse/sample-week.json digest. Everything lands `generated` (student-invisible)
// except the sample digest, which is `approved` so /home/pulse renders. Re-running never downgrades a
// row a human has approved: content columns are refreshed, `status` is left alone on existing rows.
import { readFileSync } from "node:fs";
import path from "node:path";
import { adminClient } from "./env";
import { loadFirmFixtures, loadQuestionFixture } from "../firms/fixtures";
import { validateDigest } from "../../src/lib/pulse/schema";

export async function seedFirms() {
  const db = adminClient();
  const firms = loadFirmFixtures();
  const { data: existingFirms, error: eErr } = await db.from("firms").select("id, slug, status");
  if (eErr) throw eErr;
  const byslug = new Map((existingFirms ?? []).map((f) => [f.slug as string, f]));
  let questionsTotal = 0;
  for (const f of firms) {
    const prev = byslug.get(f.slug);
    const row = { slug: f.slug, name: f.name, type: f.type, founded: f.founded, hq: f.hq, headcount: f.headcount, scale_note: f.scale_note, divisions: f.divisions, values: f.values, process: f.process, sources: f.sources, ...(prev ? {} : { status: "generated" as const }) };
    const { data: firm, error } = await db.from("firms").upsert(row, { onConflict: "slug" }).select("id, status").single();
    if (error) throw error;
    const qs = loadQuestionFixture(f.slug);
    if (!qs) {
      console.log(`seed 08: ${f.name} (${firm.status}) — no question fixture yet`);
      continue;
    }
    const { data: existingQs } = await db.from("firm_questions").select("question").eq("firm_id", firm.id);
    const have = new Set((existingQs ?? []).map((q) => q.question as string));
    const rows = qs.map((q) => ({ firm_id: firm.id, category: q.category, division: q.division, question: q.question, stage: q.stage, programme: q.programme, frequency: q.frequency, recency_year: q.recency_year, guidance_md: q.guidance_md, sources: q.sources, generated_by: `fixture:firms/questions/${f.slug}.json`, ...(have.has(q.question) ? {} : { status: "generated" as const }) }));
    const { error: qErr } = await db.from("firm_questions").upsert(rows, { onConflict: "firm_id,question" });
    if (qErr) throw qErr;
    questionsTotal += rows.length;
    console.log(`seed 08: ${f.name} (${firm.status}) — ${rows.length} questions`);
  }

  const sample = JSON.parse(readFileSync(path.join(process.cwd(), "fixtures", "pulse", "sample-week.json"), "utf8")) as { week_start: string; model: string; prompt_version: string; body: unknown };
  const v = validateDigest(sample.body);
  if (!v.ok) throw new Error(`fixtures/pulse/sample-week.json: ${v.errors.join("; ")}`);
  const { error: pErr } = await db.from("pulse_digests").upsert({ week_start: sample.week_start, status: "approved", body: v.value, model: sample.model, prompt_version: sample.prompt_version }, { onConflict: "week_start" });
  if (pErr) throw pErr;
  console.log(`seed 08: ${firms.length} firms, ${questionsTotal} questions, sample digest ${sample.week_start} approved (synthetic)`);
}
