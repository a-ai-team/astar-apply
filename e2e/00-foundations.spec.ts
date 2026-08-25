import { test, expect } from "@playwright/test";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

test.describe("Loop 00 foundations", () => {
  test("student signs in and sees the /home shell", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("home-heading")).toHaveText("Welcome back");
    await expect(page.getByTestId("user-email")).toHaveText("e2e-student@astar.test");
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

  test("signed-out visitor to /home lands on /login", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=%2Fhome$/);
    await expect(page.getByTestId("login-form")).toBeVisible();
  });
});
