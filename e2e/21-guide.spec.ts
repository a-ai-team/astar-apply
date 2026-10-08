import { test, expect } from "@playwright/test";
import { unlockPrivateArea } from "./helpers/auth";

// Loop 21 — the complete technicals guide. Counts are read off the page, never pinned.
test.describe("loop 21: complete technicals guide", () => {
  test.setTimeout(120_000);

  test("Technicals links to the guide; every chapter carries takeaways, a cheat sheet and rapid fire", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto("/home/technicals");
    await page.getByTestId("guide-link").click();
    await expect(page.getByTestId("guide-heading")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("guide-download")).toHaveAttribute("href", "/home/technicals/guide/pdf");

    const chapters = page.getByTestId("guide-chapter");
    const n = await chapters.count();
    expect(n).toBeGreaterThanOrEqual(7); // the seven technical chapters are approved
    await expect(page.getByTestId("guide-contents").locator("li")).toHaveCount(n + (await page.getByTestId("guide-extras").count()));
    for (let i = 0; i < n; i++) {
      const c = chapters.nth(i);
      expect(await c.getByTestId("guide-takeaways").locator("li").count()).toBeGreaterThan(0);
      await expect(c.getByTestId("cheatsheet-formulas")).toHaveCount(1);
      expect(await c.getByTestId("guide-rapid").locator("li").count()).toBeGreaterThan(0);
    }
  });

  test("the PDF link ends in a file or the print-ready page", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto("/home/technicals/guide"); // signs the team session in first
    const res = await page.request.get("/home/technicals/guide/pdf", { maxRedirects: 0 });
    if (res.status() === 200) expect(res.headers()["content-type"]).toBe("application/pdf");
    else expect(res.headers()["location"]).toContain("/home/technicals/guide?print=1");
  });
});
