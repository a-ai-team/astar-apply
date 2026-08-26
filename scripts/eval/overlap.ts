// 8-gram overlap check between generated/committed content and the private 400Q text.
// `npx tsx scripts/eval/overlap.ts [paths…]` — defaults to fixtures/ content/ src/lib/ai/prompts.
// Reads ONLY $EVAL_HIDDEN_DIR/.eval/400q.jsonl (written by extract-400q.ts). Prints counts, never text.
import { config as loadEnv } from "dotenv";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { hiddenDir, readJsonl } from "./index";

loadEnv({ path: ".env.local" });

export { N, tokens, ngrams, overlapCount, isTrivialGram, jsonText } from "../../src/lib/content/overlap";
import { N, ngrams, overlapCount } from "../../src/lib/content/overlap";

function walk(p: string, out: string[] = []): string[] {
  if (!existsSync(p)) return out;
  const st = statSync(p);
  if (st.isDirectory()) for (const f of readdirSync(p)) walk(path.join(p, f), out);
  else if (/\.(md|json|jsonl|ts|tsx|txt)$/.test(p) && !/\.eval\//.test(p)) out.push(p);
  return out;
}

export function loadReference(): Set<string> | null {
  const file = path.join(hiddenDir(), ".eval", "400q.jsonl");
  if (!existsSync(file)) return null;
  const rows = readJsonl<{ question: string; answer?: string }>(file);
  const ref = new Set<string>();
  for (const r of rows) for (const g of ngrams(`${r.question}\n${r.answer ?? ""}`)) ref.add(g);
  return ref;
}

export function main(argv = process.argv.slice(2)) {
  const targets = argv.length ? argv : ["fixtures", "content", "src/lib/ai/prompts"];
  const ref = loadReference();
  if (!ref) {
    console.warn("overlap: HIDDEN SET MISSING — skipping (run scripts/eval/extract-400q.ts first)");
    return 0;
  }
  let total = 0;
  for (const file of targets.flatMap((t) => walk(t))) {
    const hits = overlapCount(readFileSync(file, "utf8"), ref);
    if (hits > 0) {
      console.log(`overlap: ${file}: ${hits} shared ${N}-gram(s)`);
      total += hits;
    }
  }
  console.log(`overlap: ${total} hit(s) across ${targets.join(", ")} (reference n-grams: ${ref.size})`);
  return total;
}

if (process.argv[1]?.endsWith("overlap.ts")) {
  process.exit(main() > 0 ? 1 : 0);
}
