// pdfjs-dist legacy build in Node: per-page text used as a hint alongside the PDF document block,
// and as the fallback text when no ANTHROPIC_API_KEY is available.
export type PdfText = { pageCount: number; pages: string[] };

export async function extractPdfText(data: Uint8Array): Promise<PdfText> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2) text += "\n";
      else if (text && !text.endsWith("\n") && !text.endsWith(" ")) text += " ";
      text += item.str;
      lastY = y;
    }
    pages.push(text.trim());
  }
  const pageCount = doc.numPages;
  await doc.cleanup();
  return { pageCount, pages };
}
