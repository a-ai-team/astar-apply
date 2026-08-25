// One-off: runs the real extraction on fixtures/corpus/sample-note.png and the generated 3-page
// PDF, and records the responses as unit-test fixtures under fixtures/recorded/. Synthetic input
// only. `npx tsx scripts/dev/record-extraction.ts`
import { config as loadEnv } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { extractImages, extractPdf } from "../../src/lib/corpus/extract";
import { extractPdfText } from "../../src/lib/corpus/pdf-text";
import { buildSamplePdf } from "../../fixtures/corpus/sample-pdf";

loadEnv({ path: ".env.local" });

async function main() {
  const png = readFileSync("fixtures/corpus/sample-note.png");
  const img = await extractImages([{ data: png, mime: "image/png" }]);
  writeFileSync("fixtures/recorded/corpus-extract.v1.sample-note.json", JSON.stringify(img, null, 2) + "\n");
  console.log("photo:", img.model, "confidence", img.confidence.toFixed(2), "usage", img.usage);

  const pdf = await buildSamplePdf();
  const t = await extractPdfText(pdf);
  console.log("pdfjs pages:", t.pageCount, t.pages.map((p) => p.slice(0, 40)));
  const ext = await extractPdf(pdf);
  writeFileSync("fixtures/recorded/corpus-extract.v1.sample-deck.json", JSON.stringify(ext, null, 2) + "\n");
  console.log("pdf:", ext.model, "pages", ext.extraction.pages.length, "confidence", ext.confidence.toFixed(2), "usage", ext.usage);
}
main().catch((e) => { console.error(e); process.exit(1); });
