// Coverage suite (Loop 21): does every generalist-technical question in the hidden 400Q set map
// to something we teach? Reads ONLY $EVAL_HIDDEN_DIR/.eval/400q.jsonl (via hiddenDir()), sends
// batches to the judge model with an inventory of our lessons / questions / cheat sheets, and
// writes per-question verdicts to .eval/coverage-400q.json (gitignored). Prints counts and our
// own concept labels only — never source text. Skips (passes) without the hidden set or a key.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { OPUS_BETAS, OPUS_FALLBACKS, getClient, hasAnthropicKey } from "../../../src/lib/ai/client";
import { CURRICULUM } from "../../../src/lib/content/taxonomy";
import { hiddenDir, readJsonl, type SuiteResult } from "../index";
import { judgeModel } from "../judge";
import { THRESHOLDS } from "../thresholds";

/** The 13 generalist-technical section labels, exactly as `SECTIONS` in extract-400q.ts writes them. */
export const TECHNICAL_SECTIONS = [
  "Finance concepts",
  "Accounting – concepts",
  "Accounting – calculations",
  "EqV & EV – concepts",
  "EqV & EV – calculations",
  "Valuation methodologies",
  "Valuation metrics & multiples",
  "DCF – assumptions & analysis",
  "DCF – discount rate",
  "Merger models – concepts",
  "Merger models – calculations",
  "LBO models – concepts",
  "LBO models – calculations",
] as const;

type HiddenRow = { n: number; section: string; question: string; answer: string };

const VerdictSchema = z.object({
  verdicts: z.array(
    z.object({
      id: z.number().int(),
      status: z.enum(["covered", "partial", "gap"]),
      best_slugs: z.array(z.string()),
      concept_label: z.string(),
      missing: z.string(),
    }),
  ),
});
export type Verdict = z.infer<typeof VerdictSchema>["verdicts"][number];

const SYSTEM = `You audit an investment-banking technicals course for completeness. You receive the course inventory (lessons with their headings and drill questions, standalone practice questions, and cheat-sheet lines) and a batch of interview questions from a private reference set.

For each interview question decide:
- "covered": a student who studied the course could answer it well — the concept AND the specific twist asked are taught or drilled somewhere.
- "partial": the topic is there but the specific twist, edge case or calculation type is not.
- "gap": the concept is not taught anywhere.

Return for each: "id" (as given), "status", "best_slugs" (up to 3 inventory slugs that cover it, most relevant first), "concept_label" (at most 8 words, in YOUR OWN words, naming the concept — never quote or paraphrase the question), and "missing" (for partial/gap: at most 15 words, your own words, naming what the course would need to add; "" when covered).

Judge strictly but fairly: a course need not use the same wording or numbers; it must teach the idea well enough to answer.`;

function loadDir(dir: string): Record<string, unknown>[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));
}

/** A compact text inventory of everything we teach (all statuses — coverage is about the content set). */
export function buildInventory(root = "content"): string {
  const subToTopic = new Map<string, string>();
  for (const t of CURRICULUM) for (const s of t.subtopics) subToTopic.set(s.slug, t.slug);
  const out: string[] = ["# Lessons"];
  for (const l of loadDir(path.join(root, "lessons")) as { slug: string; title: string; subtopic_slug: string; body: { blocks: { type: string; heading?: string; pairs?: { q: string }[]; prompt?: string }[] } }[]) {
    const bits: string[] = [];
    for (const b of l.body.blocks) {
      if (b.type === "concept" && b.heading) bits.push(b.heading);
      if (b.type === "quick_fire" && b.pairs) bits.push(...b.pairs.map((p) => p.q));
      if ((b.type === "your_turn" || b.type === "predict") && b.prompt) bits.push(b.prompt);
    }
    out.push(`- lesson:${l.slug} [${subToTopic.get(l.subtopic_slug) ?? "?"}/${l.subtopic_slug}] ${l.title} :: ${bits.join(" | ")}`);
  }
  out.push("", "# Practice questions");
  for (const q of loadDir(path.join(root, "questions")) as { slug: string; subtopic_slug: string; question: string }[]) {
    out.push(`- q:${q.slug} [${q.subtopic_slug}] ${q.question}`);
  }
  out.push("", "# Cheat sheets");
  for (const c of loadDir(path.join(root, "cheatsheets")) as { topic_slug: string; formulas: { name: string }[]; canonical: { q: string }[]; you_may_hear: string[] }[]) {
    out.push(`- cheatsheet:${c.topic_slug} formulas: ${c.formulas.map((f) => f.name).join("; ")} | canonical: ${c.canonical.map((x) => x.q).join("; ")}`);
  }
  return out.join("\n");
}

export function loadTechnicalHidden(): HiddenRow[] | null {
  const file = path.join(hiddenDir(), ".eval", "400q.jsonl");
  if (!existsSync(file)) return null;
  const set = new Set<string>(TECHNICAL_SECTIONS);
  return readJsonl<HiddenRow>(file).filter((r) => set.has(r.section));
}

async function judgeBatch(inventory: string, rows: HiddenRow[]): Promise<Verdict[]> {
  const items = rows.map((r) => `<q id="${r.n}" section="${r.section}">\n${r.question}\n<reference_answer>${r.answer.slice(0, 700)}</reference_answer>\n</q>`).join("\n");
  const res = await getClient().beta.messages.parse({
    model: judgeModel(),
    max_tokens: 8000,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    output_config: { effort: "medium", format: betaZodOutputFormat(VerdictSchema) },
    system: [
      { type: "text", text: SYSTEM },
      { type: "text", text: `<inventory>\n${inventory}\n</inventory>`, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: `Audit these ${rows.length} questions:\n${items}` }],
  });
  if (!res.parsed_output) throw new Error(`coverage judge returned nothing (stop_reason=${res.stop_reason})`);
  return res.parsed_output.verdicts;
}

export async function run({ limit }: { limit: number | null }): Promise<SuiteResult> {
  const t = THRESHOLDS.coverage;
  const thresholds = { gap_max: t.gap_max, covered_rate: t.covered_rate };
  const rows = loadTechnicalHidden();
  if (!rows) return { suite: "coverage", passed: true, skipped: "HIDDEN SET MISSING (run scripts/eval/extract-400q.ts)", metrics: {}, thresholds, items: [], notes: [] };
  if (!hasAnthropicKey()) return { suite: "coverage", passed: true, skipped: "no ANTHROPIC_API_KEY", metrics: {}, thresholds, items: [], notes: [] };
  const todo = rows.slice(0, limit ?? undefined);
  const inventory = buildInventory();
  const verdicts: (Verdict & { section: string })[] = [];
  const BATCH = 12;
  const batches: HiddenRow[][] = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
  const CONCURRENCY = 4;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const results = await Promise.all(batches.slice(i, i + CONCURRENCY).map((b) => judgeBatch(inventory, b)));
    for (const [j, vs] of results.entries()) {
      const bySection = new Map(batches[i + j].map((r) => [r.n, r.section]));
      for (const v of vs) if (bySection.has(v.id)) verdicts.push({ ...v, section: bySection.get(v.id)! });
    }
    console.log(`  judged ${Math.min((i + CONCURRENCY) * BATCH, todo.length)}/${todo.length}`);
  }
  mkdirSync(".eval", { recursive: true });
  writeFileSync(path.join(".eval", "coverage-400q.json"), JSON.stringify(verdicts, null, 2));

  const notes: string[] = [];
  for (const s of TECHNICAL_SECTIONS) {
    const vs = verdicts.filter((v) => v.section === s);
    const c = (st: string) => vs.filter((v) => v.status === st).length;
    notes.push(`${s.padEnd(48)} n=${String(vs.length).padStart(2)} covered=${c("covered")} partial=${c("partial")} gap=${c("gap")}`);
  }
  for (const v of verdicts.filter((x) => x.status !== "covered")) notes.push(`  ${v.status.toUpperCase()} [${v.section}] ${v.concept_label} — ${v.missing}`);
  const gaps = verdicts.filter((v) => v.status === "gap").length;
  const coveredRate = verdicts.length ? verdicts.filter((v) => v.status === "covered").length / verdicts.length : 0;
  return {
    suite: "coverage",
    passed: gaps <= t.gap_max && coveredRate >= t.covered_rate,
    metrics: { n: verdicts.length, expected: todo.length, covered_rate: coveredRate, partial: verdicts.filter((v) => v.status === "partial").length, gaps },
    thresholds,
    // items carry only our own labels — no source text
    items: verdicts.map(({ id, section, status, best_slugs, concept_label, missing }) => ({ id, section, status, best_slugs, concept_label, missing })),
    notes,
  };
}
