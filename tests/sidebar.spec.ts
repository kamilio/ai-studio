/**
 * Tests for US-005: Persistent left sidebar navigation.
 *
 * Verifies that:
 * - The sidebar is visible on all five app pages
 * - Each sidebar link navigates to the correct page
 * - The active link is visually distinguished from inactive links
 * - Screenshot test captures the sidebar with an active state
 *
 * State is seeded via storageService.import() — the same code path as the
 * real Settings import UI — so test state mirrors real user behaviour.
 */

import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { screenshotPage } from "./helpers/screenshot";
import { baseFixture } from "../fixtures/index";

/** Pages to test: [sidebarLabel, route, expected page heading] */
const NAV_CASES = [
  { label: "Lyrics List", route: "/lyrics", heading: "Lyrics List" },
  { label: "Lyrics Generator", route: "/lyrics/new", heading: "Lyrics Generator" },
  { label: "Song Generator", route: "/songs", heading: "Song Generator" },
  { label: "Pinned Songs", route: "/pinned", heading: "Pinned Songs" },
  { label: "Settings", route: "/settings", heading: "Settings" },
] as const;

test.describe("Sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Seed base fixture through the real import path before each test
    await seedFixture(page, baseFixture);
    // Navigate to a page that shows the sidebar to start each test
    await page.goto("/lyrics");
  });

  for (const { label, route, heading } of NAV_CASES) {
    test(`clicking "${label}" navigates to the correct page`, async ({ page }) => {
      // Click the sidebar link
      await page.getByRole("navigation").getByRole("link", { name: label }).click();

      // Verify URL
      await expect(page).toHaveURL(route);

      // Verify the correct page heading is visible
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    });
  }

  test("sidebar is visible on all five pages", async ({ page }) => {
    for (const { route } of NAV_CASES) {
      await page.goto(route);
      await expect(page.getByRole("navigation")).toBeVisible();
      // The branding text "Song Builder" identifies the sidebar
      await expect(page.getByRole("navigation").getByText("Song Builder")).toBeVisible();
    }
  });

  test("active route link is visually distinguished", async ({ page }) => {
    // Navigate to Lyrics List and confirm its nav link has the active class
    await page.goto("/lyrics");

    const lyricsListLink = page
      .getByRole("navigation")
      .getByRole("link", { name: "Lyrics List" });

    // The active NavLink has bg-primary applied; inactive links have text-muted-foreground.
    // We check that the active link does NOT have the muted style applied.
    const inactiveLink = page
      .getByRole("navigation")
      .getByRole("link", { name: "Settings" });

    // Active link should have bg-primary class
    await expect(lyricsListLink).toHaveClass(/bg-primary/);
    // Inactive link should not have bg-primary class
    await expect(inactiveLink).not.toHaveClass(/bg-primary/);
  });
});

test("@screenshot:sidebar sidebar renders correctly with active state", async ({ page }) => {
  // Seed base fixture and navigate to /lyrics so "Lyrics List" is active
  await screenshotPage(page, "/lyrics", baseFixture, {
    path: "screenshots/sidebar-active.png",
  });

  // Verify the sidebar and the active item are visible after screenshot
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Lyrics List" })
  ).toHaveClass(/bg-primary/);
});
