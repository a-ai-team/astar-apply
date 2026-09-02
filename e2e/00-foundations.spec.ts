import { test, expect } from "@playwright/test";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

test.describe("Loop 00 foundations", () => {
  test("student signs in and sees the /home shell", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("home-heading")).toHaveText("Everything between you and the offer.");
    await expect(page.getByTestId("user-avatar")).toHaveText("E");
    await expect(page.getByTestId("user-avatar")).toHaveAttribute("title", "e2e-student@astar.test");
  });

  test("student is redirected away from /admin", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/home$/);
  });

  test("admin can open /admin/users", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-admin@astar.test", "/admin/users");
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByTestId("users-table")).toBeVisible();
    await expect(page.getByTestId("users-table")).toContainText("e2e-student@astar.test");
  });

  test("key cookie without a Supabase session is signed into the team account", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByTestId("app-shell")).toBeVisible();
  });

  test("visitor without the key lands on /unlock", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/unlock\?next=%2Fhome$/);
    await expect(page.getByTestId("unlock-heading")).toHaveText("Enter the team key");
  });

  // No more "Coming soon": `/` is the door to /home (src/app/page.tsx), and the gate takes it from there.
  test("/ redirects to /home (and on to /unlock without the key)", async ({ page, baseURL }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/unlock\?next=%2Fhome$/);

    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await page.goto("/");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByTestId("home-heading")).toBeVisible();
  });
});
