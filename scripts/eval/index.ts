// Eval harness core (docs/loops/CONTRACTS.md § Eval harness).
// `npm run eval -- --suite retrieval,chat|all [--limit N] [--json out.json]`
// Each suite returns a SuiteResult; results are written to .eval/last-<suite>.json (gitignored);
// a missed threshold exits 1; a suite that has to skip (no credit, no hidden set) warns and passes.
import { config as loadEnv } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

loadEnv({ path: ".env.local" });

export type SuiteResult = {
  suite: string;
  passed: boolean;
  skipped?: string;
  metrics: Record<string, number | string | boolean | null>;
  thresholds: Record<string, number>;
  items: unknown[];
  notes: string[];
};

export type SuiteFn = (opts: { limit: number | null }) => Promise<SuiteResult>;

export const SUITES: Record<string, () => Promise<{ run: SuiteFn }>> = {
  retrieval: () => import("./suites/retrieval"),
  chat: () => import("./suites/chat"),
  lessons: () => import("./suites/lessons"),
  questions: () => import("./suites/questions"),
};

export function readJsonl<T>(file: string): T[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as T & { _note?: string })
    .filter((r) => !("_note" in r));
}

export function hiddenDir(): string {
  return process.env.EVAL_HIDDEN_DIR || path.join(process.env.HOME ?? "", "Desktop", "A* AI");
}

export function parseArgs(argv: string[]) {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const suiteArg = get("--suite") ?? "all";
  const suites = suiteArg === "all" ? Object.keys(SUITES) : suiteArg.split(",").map((s) => s.trim()).filter(Boolean);
  const limitRaw = get("--limit");
  const limit = limitRaw ? Number(limitRaw) : null;
  return { suites, limit: limit && Number.isFinite(limit) ? limit : null, json: get("--json") };
}

export async function main(argv = process.argv.slice(2)) {
  const { suites, limit, json } = parseArgs(argv);
  const results: SuiteResult[] = [];
  let ok = true;
  for (const name of suites) {
    const loader = SUITES[name];
    if (!loader) {
      console.error(`eval: unknown suite "${name}" (known: ${Object.keys(SUITES).join(", ")})`);
      process.exit(2);
    }
    console.log(`\n=== eval: ${name}${limit ? ` (limit ${limit})` : ""} ===`);
    const { run } = await loader();
    const r = await run({ limit });
    results.push(r);
    mkdirSync(".eval", { recursive: true });
    writeFileSync(path.join(".eval", `last-${name}.json`), JSON.stringify(r, null, 2));
    for (const n of r.notes) console.log(`  ${n}`);
    for (const [k, v] of Object.entries(r.metrics)) console.log(`  ${k.padEnd(28)} ${typeof v === "number" ? v.toFixed(3) : String(v)}`);
    if (r.skipped) console.log(`  SKIPPED: ${r.skipped}`);
    console.log(`  → ${r.passed ? "PASS" : "FAIL"}`);
    if (!r.passed) ok = false;
  }
  if (json) writeFileSync(json, JSON.stringify(results, null, 2));
  if (!ok) {
    console.error("\neval: threshold missed");
    process.exit(1);
  }
}
