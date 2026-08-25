import { test, expect } from "@playwright/test";
import path from "node:path";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00` (users). Extraction runs in fixture mode (playwright.config.ts).
test.describe("Loop 01 mentor corpus", () => {
  test("mentor uploads a photo → ≥ 1 chunk within 60 s → approves it", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-mentor@astar.test", "/admin/corpus");
    await expect(page).toHaveURL(/\/admin\/corpus$/);
    await expect(page.getByTestId("corpus-heading")).toHaveText("Corpus");

    await page.getByTestId("upload-link").click();
    await expect(page).toHaveURL(/\/admin\/corpus\/upload$/);
    await page.getByTestId("upload-input").setInputFiles(path.join(process.cwd(), "fixtures", "corpus", "sample-note.png"));

    // Upload → process → redirect to the source detail page.
    await expect(page).toHaveURL(/\/admin\/corpus\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    await expect(page.getByTestId("source-title")).toHaveText("sample-note");
    const chunks = page.getByTestId("chunk");
    await expect(chunks.first()).toBeVisible({ timeout: 60_000 });
    expect(await chunks.count()).toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId("chunk-text").first()).toContainText("Spring week prep");

    await page.getByTestId("approve-source").click();
    await expect(page.getByTestId("approve-source")).toHaveText("Approved", { timeout: 30_000 });
    await expect(page.getByTestId("status-badge").first()).toHaveText("approved");
  });

  test("student is redirected away from /admin/corpus", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await page.goto("/admin/corpus");
    await expect(page).toHaveURL(/\/home$/);
  });

  test("unauthenticated POST /api/corpus/x/process → 401", async ({ request }) => {
    const res = await request.post("/api/corpus/x/process");
    expect(res.status()).toBe(401);
  });
});
