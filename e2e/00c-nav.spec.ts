import { test, expect } from "@playwright/test";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00`. Primary nav is a sticky horizontal bar of the five products
// (src/components/shell/app-header.tsx); no sidebar, no dropdown.
test.describe("Sticky horizontal nav", () => {
  test("five product links → Technicals navigates and is current → header gains its rule on scroll", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("side-nav")).toHaveCount(0);
    await expect(page.getByTestId("nav-menu")).toHaveCount(0);

    const nav = page.getByTestId("nav-bar");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(["Home", "Mentor", "Technicals", "Practice", "Interviews"]);
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByTestId("nav-staff-link")).toHaveCount(0); // students never see Admin

    // Right cluster is just search · initials · sign out — no role badge, no email.
    await expect(page.getByTestId("palette-open")).toBeVisible();
    await expect(page.getByTestId("user-avatar")).toHaveText("E");
    await expect(page.getByTestId("user-email")).toHaveCount(0);

    const header = page.getByTestId("app-header");
    await expect(header).not.toHaveAttribute("data-scrolled", "");
    await page.mouse.wheel(0, 600);
    await expect(header).toHaveAttribute("data-scrolled", "");
    await expect(header).toBeInViewport(); // sticky

    await nav.getByRole("link", { name: "Technicals" }).click();
    await expect(page).toHaveURL(/\/home\/technicals$/);
    await expect(page.getByTestId("nav-bar").getByRole("link", { name: "Technicals" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("nav-bar").getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current", "page");
  });

  test("staff see Admin at the end of the bar", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-admin@astar.test", "/home");
    const admin = page.getByTestId("nav-bar").getByTestId("nav-staff-link");
    await expect(admin).toHaveText("Admin");
    await expect(admin).toHaveAttribute("href", "/admin");
  });
});

// /home landing (feat/home-landing): hero CTA, neural field, mentor bench.
test.describe("/home landing", () => {
  test("hero, field and bench render; CTA opens the Mentor", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await expect(page.getByTestId("home-heading")).toHaveText("Ask the people who actually got in.");
    await expect(page.getByTestId("neural-field")).toBeAttached();
    await expect(page.getByTestId("home-mentor-card")).toHaveAttribute("href", "/home/mentor");
    await page.getByTestId("mentor-grid").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("mentor-tile").first()).toContainText("Tesleem Fowora");
    await expect(page.getByTestId("mentor-seat")).toHaveCount(3);
    await page.getByTestId("home-mentor-card").click();
    await expect(page).toHaveURL(/\/home\/mentor/);
  });
});
