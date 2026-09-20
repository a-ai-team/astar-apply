import { test, expect } from "@playwright/test";
import { unlockPrivateArea } from "./helpers/auth";

// Loop 20 — week packs. Week 4 (EqV/EV) is a free, approved chapter that closes with a cheat
// sheet, so its pack carries every section. Counts are read off the week page, never pinned.
const WEEK = 4;

test.describe("loop 20: week packs", () => {
  // The first request after a cold `next start` also signs the team session in.
  test.setTimeout(120_000);

  test("the week page offers the pack, and the pack lays the whole week out with nothing to click", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto(`/home/path/${WEEK}`);
    await expect(page.getByTestId("week-pdf-link")).toHaveAttribute("href", `/home/path/${WEEK}/pdf`);
    const lessons = await page.getByTestId("day-lesson-link").count();
    expect(lessons).toBeGreaterThan(0);

    await page.getByTestId("week-pack-link").click();
    await expect(page.getByTestId("pack-heading")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("pack-plan").locator("tr")).toHaveCount(5);
    await expect(page.getByTestId("pack-lesson")).toHaveCount(lessons);
    await expect(page.getByTestId("pack-cheatsheet")).toBeVisible();

    // Paper has no buttons: reveals are open, inputs are write-in lines, lens hints are gone.
    const pack = page.getByTestId("week-pack");
    await expect(pack.getByTestId("pack-lesson").locator("button, input")).toHaveCount(0);
    await expect(pack.getByTestId("lens-hint")).toHaveCount(0);
    expect(await pack.getByTestId("print-check").count()).toBeGreaterThan(0);

    // Every practice question is answered at the back, in the same order.
    const questions = await page.getByTestId("pack-question").count();
    expect(questions).toBeGreaterThan(0);
    await expect(page.getByTestId("pack-answer")).toHaveCount(questions);
  });

  test("print media drops the app chrome and the pack toolbar", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto(`/home/path/${WEEK}/pack`);
    await expect(page.getByTestId("app-header")).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(page.getByTestId("app-header")).toBeHidden();
    await expect(page.getByTestId("pack-download")).toBeHidden();
    await expect(page.getByTestId("pack-cover")).toBeVisible();
  });

  test("the download answers with a PDF, or falls back to the print view", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto("/home/path");
    const res = await page.request.get(`/home/path/${WEEK}/pdf`);
    expect(res.ok()).toBe(true);
    const type = res.headers()["content-type"] ?? "";
    if (type.includes("application/pdf")) {
      expect(res.headers()["content-disposition"]).toContain(`astar-apply-week-0${WEEK}`);
      expect((await res.body()).subarray(0, 5).toString()).toBe("%PDF-");
    } else {
      expect(res.url()).toContain(`/home/path/${WEEK}/pack?print=1`);
    }
    expect((await page.request.get("/home/path/99/pdf")).status()).toBe(404);
  });

  test("week 10 shows drafts as not ready and links its drill days", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto("/home/path/10");
    await expect(page.getByTestId("day-row")).toHaveCount(5);
    await expect(page.getByTestId("day-drill-link").first()).toHaveAttribute("href", "/home/interviews");
    // Every lesson link on the week resolves — a week may borrow a lesson from another topic.
    for (const href of await page.getByTestId("day-lesson-link").evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
      expect((await page.request.get(href)).status()).toBe(200);
    }
  });
});
