import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-jameswingfield-dev-astar-apply/1faa7c78-d985-402d-b3a5-324e8ce63f83/scratchpad";
const BASE = "http://localhost:3010";
const KEY = "astar-team";
const sizes = [[1440, 900], [390, 844]];
const browser = await chromium.launch();
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/unlock?next=/home`);
  await page.getByTestId("unlock-key").fill(KEY);
  await page.getByTestId("unlock-key").press("Enter");
  await page.waitForURL((u) => u.pathname === "/home", { timeout: 30000 });
  const shot = async (name, url) => {
    if (url) await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(`${name}@${w}: ${page.url()} hscroll=${sw}`);
    await page.screenshot({ path: `${OUT}/navy-${name}-${w}.png` });
  };
  await shot("home", "/home");
  await shot("technicals", "/home/technicals");
  const topic = await page.locator('a[href^="/home/technicals/"]').first().getAttribute("href");
  await page.goto(`${BASE}${topic}`, { waitUntil: "networkidle" });
  const lesson = await page.locator('a[href^="/home/technicals/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")).find((h) => h.split("/").length >= 5));
  if (lesson) await page.goto(`${BASE}${lesson}`, { waitUntil: "networkidle" });
  await shot("lesson");
  await shot("practice", "/home/practice");
  await shot("mentor-empty", "/home/mentor");
  const thread = await page.locator('a[href^="/home/mentor/"]').first().getAttribute("href", { timeout: 3000 }).catch(() => null);
  if (thread) {
    await shot("mentor-answered", thread);
  } else {
    await page.getByTestId("composer-input").fill("What is EBITDA?");
    await page.getByTestId("composer-send").click();
    await page.waitForTimeout(15000);
    await shot("mentor-answered");
  }
  await shot("admin", "/admin");
  await shot("admin-review", "/admin/review");
  await ctx.close();
}
await browser.close();
