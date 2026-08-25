// PLACEHOLDER — synthetic content for pipeline testing.
// Builds the 3-page synthetic "workshop deck" PDF in memory (pdf-lib). Never written into the
// repo: *.pdf is gitignored and the pre-commit hook blocks it.
import { PDFDocument, StandardFonts } from "pdf-lib";

export const SAMPLE_PDF_PAGES: { title: string; lines: string[] }[] = [
  {
    title: "Slide 1 - LBO workshop: what a sponsor is buying",
    lines: [
      "PLACEHOLDER - synthetic content for pipeline testing",
      "A private equity fund buys a company using mostly borrowed money.",
      "Returns come from three levers: debt paydown, EBITDA growth, multiple expansion.",
      "Worked number: buy at 8x EBITDA of 50m = 400m, fund 60% with debt = 240m.",
    ],
  },
  {
    title: "Slide 2 - Sources and uses",
    lines: [
      "PLACEHOLDER - synthetic content for pipeline testing",
      "Uses: purchase price 400m + fees 10m = 410m.",
      "Sources: senior debt 200m, mezzanine 40m, sponsor equity 170m.",
      "Rule of thumb: total debt of 4-5x EBITDA is normal for a stable business.",
    ],
  },
  {
    title: "Slide 3 - Exit and returns",
    lines: [
      "PLACEHOLDER - synthetic content for pipeline testing",
      "Exit in year 5 at 8x on EBITDA of 70m = 560m enterprise value.",
      "Net debt at exit 120m, so equity value 440m versus 170m invested.",
      "MOIC = 440 / 170 = 2.6x; IRR roughly 21% over five years.",
    ],
  },
];

export async function buildSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (const p of SAMPLE_PDF_PAGES) {
    const page = doc.addPage([842, 595]); // landscape A4-ish "slide"
    page.drawText(p.title, { x: 50, y: 520, size: 24, font: bold });
    let y = 460;
    for (const line of p.lines) {
      page.drawText(line, { x: 50, y, size: 16, font });
      y -= 36;
    }
  }
  return doc.save();
}
