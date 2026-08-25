// `npm run fixtures:build` — regenerates the *binary* synthetic fixtures. Everything produced
// here is original placeholder content for pipeline testing.
//   fixtures/corpus/sample-note.png   (committed) — text rendered to a PNG with Playwright Chromium
//   <out>/sample-deck.pdf             (NOT committed; *.pdf is gitignored + blocked by the
//                                     pre-commit hook) — 3-page PDF via pdf-lib, used by the
//                                     chunker unit test (in memory) and the e2e upload.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { buildSamplePdf, SAMPLE_PDF_PAGES } from "../../fixtures/corpus/sample-pdf";

const NOTE_HTML = `<!doctype html><html><body style="margin:0;width:800px;background:#fbf7ef;font-family:'Comic Sans MS','Marker Felt',cursive;color:#1b2a4a;padding:40px;box-sizing:border-box">
<div style="font-size:14px;color:#8a6d3b">PLACEHOLDER — synthetic content for pipeline testing</div>
<h1 style="font-size:34px;margin:16px 0 8px">Spring week prep — my notes</h1>
<ul style="font-size:24px;line-height:1.6">
<li>Apply <b>early</b>: most spring week deadlines close by late October.</li>
<li>Coffee chats: ask one specific question, send a two-line thank you.</li>
<li>Know one recent deal in the sector you say you like.</li>
<li>Accounting basics: <i>Net income &rarr; CFO &rarr; change in cash</i>.</li>
<li>EV = Equity value + net debt + minority interest + preferred.</li>
</ul>
<p style="font-size:22px;margin-top:24px">Worked number: equity value &pound;500m, debt &pound;200m, cash &pound;80m &rArr; EV = &pound;620m.</p>
</body></html>`;

async function main() {
  const outDir = process.argv[2] ?? path.join(process.cwd(), ".eval", "fixtures");
  mkdirSync(outDir, { recursive: true });
  mkdirSync("fixtures/corpus", { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  await page.setContent(NOTE_HTML);
  const png = await page.screenshot({ fullPage: true, type: "png" });
  await browser.close();
  writeFileSync("fixtures/corpus/sample-note.png", png);
  console.log(`wrote fixtures/corpus/sample-note.png (${png.byteLength} bytes)`);

  const pdf = await buildSamplePdf();
  const pdfPath = path.join(outDir, "sample-deck.pdf");
  writeFileSync(pdfPath, pdf);
  console.log(`wrote ${pdfPath} (${pdf.byteLength} bytes, ${SAMPLE_PDF_PAGES.length} pages) — not committed`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
