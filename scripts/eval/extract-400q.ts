// `npx tsx scripts/eval/extract-400q.ts` — the ONLY code that reads the private 400Q PDF.
// Reads `$EVAL_HIDDEN_DIR` (default ~/Desktop/A* AI), finds the 400Q PDF, extracts its text with
// pdfjs, splits it into numbered questions and writes ONLY to `$EVAL_HIDDEN_DIR/.eval/`:
//   400q.jsonl        — { n, section, question, answer } for every question (hidden eval + overlap)
//   chat-hidden.jsonl — one question per detected section (≈ 45) with the guide's answer as
//                       the judge reference: { id, question, reference }
// Prints counts only. Never copies text into the repo. Both outputs are gitignored (`.eval/`).
import { config as loadEnv } from "dotenv";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { extractPdfText } from "../../src/lib/corpus/pdf-text";
import { hiddenDir } from "./index";

loadEnv({ path: ".env.local" });

type Q = { n: number; section: string; question: string; answer: string };

function findPdf(dir: string): string | null {
  if (!existsSync(dir)) return null;
  const pdfs = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const preferred = pdfs.find((f) => /400/.test(f)) ?? pdfs[0];
  return preferred ? path.join(dir, preferred) : null;
}

/**
 * Splits guide text into questions. Question lines look like "12. What is …?" (a number, a dot,
 * text ending in a question mark within a few lines); everything until the next numbered line is
 * the answer. Section headings are lines in Title Case without a number that precede a "1."
 * restart or a known section keyword.
 */
export function splitQuestions(text: string): Q[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim());
  const out: Q[] = [];
  let section = "Intro";
  let cur: Q | null = null;
  const qRe = /^(\d{1,3})\.\s+(.{8,})$/;
  for (const line of lines) {
    if (!line) continue;
    const m = line.match(qRe);
    if (m) {
      const n = Number(m[1]);
      if (cur) out.push(cur);
      if (n === 1 && out.length) section = out[out.length - 1].section === section ? `${section}` : section;
      cur = { n, section, question: m[2], answer: "" };
      continue;
    }
    // Heading heuristic: short line, no terminal punctuation, mostly letters, not inside an answer of > 3 lines.
    if (!cur || cur.answer.length === 0) {
      if (line.length <= 80 && /^[A-Z][A-Za-z&/,()' -]+$/.test(line) && !/^(Q|A)$/.test(line)) {
        section = line;
        continue;
      }
    }
    if (cur) {
      if (!cur.question.includes("?") && cur.answer.length === 0 && line.length < 200) cur.question += " " + line;
      else cur.answer += (cur.answer ? " " : "") + line;
    }
  }
  if (cur) out.push(cur);
  return out.filter((q) => q.question.length > 8);
}

/**
 * Section labels + question counts from docs/research/400q-taxonomy.md (structural metadata only;
 * 413 questions in guide order). Questions are assigned to sections by cumulative count, which is
 * far more reliable than heading detection in pdfjs text.
 */
export const SECTIONS: [string, number][] = [
  ["Fit – Big 5", 5], ["Fit – Teamwork & leadership", 5], ["Fit – Strengths & weaknesses", 5], ["Fit – Flaws & failures", 9],
  ["Fit – Recruiting process", 10], ["Fit – Resume / CV", 5], ["Fit – Understanding banking", 9], ["Fit – Why banking / why our firm", 10],
  ["Fit – Outside the box", 5], ["Fit – Discussing transaction experience", 10],
  ["Finance concepts", 10], ["Accounting – concepts", 18], ["Accounting – calculations", 18],
  ["EqV & EV – concepts", 11], ["EqV & EV – calculations", 12], ["Valuation methodologies", 15], ["Valuation metrics & multiples", 15],
  ["DCF – assumptions & analysis", 23], ["DCF – discount rate", 25], ["Merger models – concepts", 13], ["Merger models – calculations", 11],
  ["LBO models – concepts", 15], ["LBO models – calculations", 5],
  ["Industry – Consumer/Retail", 4], ["Industry – DCM & LevFin", 14], ["Industry – Distressed & Restructuring", 15], ["Industry – ECM", 10],
  ["Industry – FIG", 15], ["Industry – FSG", 5], ["Industry – Healthcare & Biotech", 4], ["Industry – Industrials", 5],
  ["Industry – Metals & Mining", 9], ["Industry – Oil & Gas", 10], ["Industry – Power & Utilities", 10], ["Industry – Private Capital Advisory", 5],
  ["Industry – Private Companies", 5], ["Industry – Project Finance & Infra", 9], ["Industry – Real Estate", 10], ["Industry – REITs", 10],
  ["Industry – Renewables", 5], ["Industry – TMT", 10],
];

export function assignSections(questions: Q[]): Q[] {
  const total = SECTIONS.reduce((s, [, n]) => s + n, 0);
  if (questions.length !== total) console.warn(`extract-400q: found ${questions.length} questions, taxonomy expects ${total} — section labels may drift`);
  let i = 0;
  const out: Q[] = [];
  for (const [label, n] of SECTIONS) {
    for (let k = 0; k < n && i < questions.length; k++, i++) out.push({ ...questions[i], section: label });
  }
  for (; i < questions.length; i++) out.push({ ...questions[i], section: "Unassigned" });
  return out;
}

async function main() {
  const dir = hiddenDir();
  const pdf = findPdf(dir);
  if (!pdf) {
    console.log(`extract-400q: HIDDEN SET MISSING — no PDF in ${dir}`);
    process.exit(0);
  }
  const data = new Uint8Array(readFileSync(pdf));
  const { pages, pageCount } = await extractPdfText(data);
  const questions = assignSections(splitQuestions(pages.join("\n")));
  const sections = new Map<string, Q[]>();
  for (const q of questions) sections.set(q.section, [...(sections.get(q.section) ?? []), q]);
  const outDir = path.join(dir, ".eval");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "400q.jsonl"), questions.map((q) => JSON.stringify(q)).join("\n") + "\n");
  // One per section: the first question with a usable answer.
  const hidden = [...sections.entries()]
    .map(([section, qs], i) => {
      const q = qs.find((x) => x.answer.length > 40) ?? qs[0];
      return { id: `h${String(i + 1).padStart(2, "0")}`, section, question: q.question, reference: q.answer.slice(0, 1500) };
    })
    .filter((x) => x.reference.length > 0);
  writeFileSync(path.join(outDir, "chat-hidden.jsonl"), hidden.map((h) => JSON.stringify(h)).join("\n") + "\n");
  console.log(`extract-400q: ${pageCount} pages → ${questions.length} questions in ${sections.size} sections → ${hidden.length} hidden chat questions (written to ${outDir}, nothing printed)`);
}

if (process.argv[1]?.endsWith("extract-400q.ts")) {
  main().catch((e) => {
    console.error("extract-400q failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
