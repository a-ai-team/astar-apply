// `npm run packs:build` — prints every week pack (/home/path/<week>/pack) to an A4 PDF with
// Playwright's Chromium and uploads it to the private `packs` bucket, where
// /home/path/<week>/pdf serves it from. Re-run after any lesson, cheat sheet or question changes.
//
//   npm run build && npx next start -p 3100     # or point PACKS_BASE_URL at a deployment
//   npm run packs:build                          # all weeks
//   npm run packs:build -- --week 4              # one week
//   npm run packs:build -- --no-upload           # PDFs into .packs/ only (gitignored)
//
// PDFs never enter the repo (it is public, the content is gated): `.packs/` and `*.pdf` are ignored.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { adminClient, requireEnv } from "../seed/env";
import { ACCESS_COOKIE, accessToken } from "../../src/lib/access";
import { PACKS_BUCKET, packDownloadName, packObjectPath } from "../../src/lib/content/pack-files";
import { DEFAULT_PATH } from "../../src/lib/content/taxonomy";

const args = process.argv.slice(2);
const only = args.includes("--week") ? Number(args[args.indexOf("--week") + 1]) : null;
const upload = !args.includes("--no-upload");
const baseURL = (process.env.PACKS_BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const outDir = path.join(process.cwd(), ".packs");

// Centred, so it sits right on both faces of a double-sided sheet (the body margins are mirrored).
const footer = (label: string) => `
  <div style="width:100%;font:7.5pt Helvetica,Arial,sans-serif;color:#777;text-align:center">
    A* Apply · ${label} · <span class="pageNumber"></span> / <span class="totalPages"></span>
  </div>`;

async function main() {
  const weeks = DEFAULT_PATH.weeks.filter((w) => only === null || w.week === only);
  if (weeks.length === 0) throw new Error(`no week ${only} in ${DEFAULT_PATH.slug}`);
  mkdirSync(outDir, { recursive: true });

  const db = upload ? adminClient() : null;
  if (db) {
    const { error } = await db.storage.createBucket(PACKS_BUCKET, { public: false, allowedMimeTypes: ["application/pdf"] });
    if (error && !/already exists/i.test(error.message)) throw error;
  }

  const browser = await chromium.launch();
  try {
    // The key cookie is the only credential: /auth/team turns it into the shared team session.
    const context = await browser.newContext({ baseURL });
    await context.addCookies([{ name: ACCESS_COOKIE, value: await accessToken(requireEnv("PRIVATE_ACCESS_KEY")), url: baseURL, httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();

    for (const w of weeks) {
      const res = await page.goto(`/home/path/${w.week}/pack`, { waitUntil: "networkidle" });
      if (!res?.ok() || !(await page.getByTestId("week-pack").count())) throw new Error(`week ${w.week}: pack page did not render (${res?.status()} ${page.url()})`);
      await page.evaluate(() => document.fonts.ready);
      const pdf = await page.pdf({
        format: "A4",
        preferCSSPageSize: true,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: footer(`Week ${w.week} — ${w.title}`),
        margin: { top: "16mm", right: "15mm", bottom: "18mm", left: "15mm" },
      });
      writeFileSync(path.join(outDir, packDownloadName(w.week)), pdf);
      if (db) {
        const { error } = await db.storage.from(PACKS_BUCKET).upload(packObjectPath(w.week), pdf, { contentType: "application/pdf", upsert: true });
        if (error) throw error;
      }
      const lessons = await page.getByTestId("pack-lesson").count();
      console.log(`week ${String(w.week).padStart(2)}  ${lessons} lesson(s)  ${(pdf.length / 1024).toFixed(0).padStart(5)} KB  ${upload ? "uploaded" : "local only"}  ${packDownloadName(w.week)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
