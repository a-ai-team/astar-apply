import { test, expect } from "@playwright/test";

/**
 * Single door (docs/PRIVATE_AREA.md): the team key is the only credential. No `signInAs` here —
 * entering the key must sign the browser into the shared admin "team" account by itself.
 */
test.describe("Team entry", () => {
  test("key alone gets into /home and /admin", async ({ page }) => {
    const key = process.env.PRIVATE_ACCESS_KEY;
    expect(key, "PRIVATE_ACCESS_KEY (playwright.config.ts supplies one)").toBeTruthy();

    await page.goto("/home");
    await expect(page).toHaveURL(/\/unlock\?next=%2Fhome$/);
    await expect(page.getByTestId("unlock-heading")).toHaveText("Enter the team key");

    await page.getByTestId("unlock-key").fill(key!);
    await page.getByRole("button", { name: "Enter" }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("home-heading")).toHaveText("Ask the people who actually got in.");

    // The team user is admin, so staff pages open too.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId("app-shell")).toBeVisible();
  });

  test("wrong key stays on /unlock", async ({ page }) => {
    await page.goto("/unlock?next=%2Fhome");
    await page.getByTestId("unlock-key").fill("definitely-not-the-key");
    await page.getByRole("button", { name: "Enter" }).click();
    await expect(page.getByTestId("unlock-error")).toHaveText("Wrong key.");
    await expect(page).toHaveURL(/\/unlock/);
  });
});
