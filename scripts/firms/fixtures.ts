// Reads the committed firm fixtures (Loop 08): fixtures/firms/<slug>.json (dossiers) and
// fixtures/firms/questions/<slug>.json (hand-written questions, loaded as status=generated).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { FirmQuestionFileSchema, FirmSchema, type Firm, type FirmQuestion } from "../../src/lib/firms/schema";

export const FIRMS_DIR = path.join(process.cwd(), "fixtures", "firms");
export const QUESTIONS_DIR = path.join(FIRMS_DIR, "questions");

export function loadFirmFixtures(): Firm[] {
  const files = readdirSync(FIRMS_DIR).filter((f) => f.endsWith(".json")).sort();
  return files.map((f) => {
    const raw = JSON.parse(readFileSync(path.join(FIRMS_DIR, f), "utf8")) as Record<string, unknown>;
    delete raw._note;
    const r = FirmSchema.safeParse(raw);
    if (!r.success) throw new Error(`fixtures/firms/${f}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    if (r.data.slug !== f.replace(/\.json$/, "")) throw new Error(`fixtures/firms/${f}: slug must match the file name`);
    return r.data;
  });
}

export function loadQuestionFixture(slug: string): FirmQuestion[] | null {
  const p = path.join(QUESTIONS_DIR, `${slug}.json`);
  if (!existsSync(p)) return null;
  const raw = JSON.parse(readFileSync(p, "utf8"));
  const r = FirmQuestionFileSchema.safeParse(raw);
  if (!r.success) throw new Error(`fixtures/firms/questions/${slug}.json: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  if (r.data.firm !== slug) throw new Error(`fixtures/firms/questions/${slug}.json: "firm" must be ${slug}`);
  return r.data.questions;
}
