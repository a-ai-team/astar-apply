import { test, expect } from "@playwright/test";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00`. The left sidebar is gone: navigation lives in a hover dropdown
// under the logo (src/components/shell/nav-menu.tsx).
test.describe("Hover nav under the logo", () => {
  test("hidden until hovered → hover shows the menu → Technicals navigates → hidden again", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("side-nav")).toHaveCount(0);

    const logo = page.getByTestId("nav-logo");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("nav-menu")).toHaveCount(0);

    await logo.hover();
    const menu = page.getByTestId("nav-menu");
    await expect(menu).toBeVisible();
    await expect(logo).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("menuitem")).toHaveText(["Home", "Mentor", "Technicals", "10-week path", "Practice", "Flashcards", "Progress", "Interviews", "Pulse"]);
    await expect(menu.getByTestId("nav-staff-link")).toHaveCount(0); // students never see Admin

    // Moving from the logo into the panel keeps it open (150 ms grace), then a click navigates.
    await menu.getByRole("menuitem", { name: "Technicals" }).hover();
    await expect(menu).toBeVisible();
    await menu.getByRole("menuitem", { name: "Technicals" }).click();
    await expect(page).toHaveURL(/\/home\/technicals$/);

    // Not hovered → not visible. Then hover again: Technicals is the active item.
    await page.mouse.move(600, 400);
    await expect(page.getByTestId("nav-menu")).toHaveCount(0);
    await logo.hover();
    await expect(page.getByTestId("nav-menu").getByRole("menuitem", { name: "Technicals" })).toHaveAttribute("aria-current", "page");

    // Keyboard: Escape closes; Enter on the focused logo opens.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("nav-menu")).toHaveCount(0);
    await page.mouse.move(600, 400);
    await logo.focus();
    await expect(page.getByTestId("nav-menu")).toBeVisible();
  });

  test("staff see Admin below a divider", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-admin@astar.test", "/home");
    await page.getByTestId("nav-logo").hover();
    const admin = page.getByTestId("nav-menu").getByTestId("nav-staff-link");
    await expect(admin).toHaveText("Admin");
    await expect(admin).toHaveAttribute("href", "/admin");
  });
});
