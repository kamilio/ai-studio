/**
 * Tests for US-009 / US-019: Lyrics List page (card grid, sort + search).
 *
 * Verifies that:
 * - Card grid lists all non-deleted assistant messages with title, style badge,
 *   song count, and lyrics preview
 * - Song count badge shows correct count (non-deleted songs per messageId)
 * - Text search filters by title or style in real time
 * - Sort dropdown offers newest first, oldest first, most generated, most pinned
 * - Default sort is newest first
 * - Sort and search can be combined
 * - Clicking a card navigates to /music/lyrics/:messageId
 * - Soft-delete removes the entry from the grid; reload — card still absent
 * - Empty state shown when no lyrics exist
 * - Screenshot tests with seeded fixture data
 */

import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { screenshotPage } from "./helpers/screenshot";
import {
  multiEntryFixture,
  emptyFixture,
  baseFixture,
} from "../fixtures/index";

// ─── Fixture with songs for sort tests ───────────────────────────────────────
// multiEntryFixture: Morning Pop (createdAt 07:01, 2 songs, 0 pinned)
//                   Midnight Jazz (createdAt 23:01, 0 songs, 0 pinned)
// Midnight Jazz is newer; Morning Pop has more songs.

test.describe("Lyrics List page", () => {
  test.beforeEach(async ({ page }) => {
    await seedFixture(page, multiEntryFixture);
    await page.goto("/music/lyrics");
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  test("lists non-deleted entries as cards with title and style", async ({
    page,
  }) => {
    // multiEntryFixture has 3 entries; 1 is soft-deleted → 2 visible cards
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();

    // Style badge visible
    await expect(
      page.getByTestId("card-style").filter({ hasText: "pop" })
    ).toBeVisible();
    await expect(
      page.getByTestId("card-style").filter({ hasText: "jazz" })
    ).toBeVisible();

    // Soft-deleted entry must NOT appear
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Deleted Entry" })
    ).not.toBeVisible();
  });

  test("song count badge shows correct count per messageId", async ({
    page,
  }) => {
    // Morning Pop has 2 non-deleted songs (1 soft-deleted song doesn't count)
    await expect(
      page.getByTestId("card-song-count").filter({ hasText: "2 songs" })
    ).toBeVisible();

    // Midnight Jazz has 0 songs
    await expect(
      page.getByTestId("card-song-count").filter({ hasText: "No songs yet" })
    ).toBeVisible();
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  test("search filters entries by title in real time", async ({ page }) => {
    const search = page.getByRole("textbox", { name: "Search lyrics" });
    await search.fill("Morning");

    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).not.toBeVisible();
  });

  test("search filters entries by style in real time", async ({ page }) => {
    const search = page.getByRole("textbox", { name: "Search lyrics" });
    await search.fill("jazz");

    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).not.toBeVisible();
  });

  test("search with no matches shows empty state", async ({ page }) => {
    const search = page.getByRole("textbox", { name: "Search lyrics" });
    await search.fill("xyznotfound");

    await expect(page.getByTestId("lyrics-list-empty")).toBeVisible();
    await expect(page.getByText("No matches found")).toBeVisible();
  });

  // ── Sort ───────────────────────────────────────────────────────────────────

  test("sort dropdown is present with correct options", async ({ page }) => {
    const select = page.getByTestId("lyrics-sort-select");
    await expect(select).toBeVisible();

    // Verify all four sort options exist
    await expect(select.getByRole("option", { name: "Newest first" })).toBeAttached();
    await expect(select.getByRole("option", { name: "Oldest first" })).toBeAttached();
    await expect(select.getByRole("option", { name: "Most generated" })).toBeAttached();
    await expect(select.getByRole("option", { name: "Most pinned" })).toBeAttached();
  });

  test("default sort is newest first", async ({ page }) => {
    const select = page.getByTestId("lyrics-sort-select");
    await expect(select).toHaveValue("newest");

    // Midnight Jazz (createdAt 23:01) is newer than Morning Pop (createdAt 07:01)
    // so Midnight Jazz should appear first in the grid
    const cards = page.getByTestId("lyrics-list-item");
    const firstCardTitle = cards.first().getByTestId("card-title");
    await expect(firstCardTitle).toContainText("Midnight Jazz");
  });

  test("oldest first sort puts oldest entry at top", async ({ page }) => {
    const select = page.getByTestId("lyrics-sort-select");
    await select.selectOption("oldest");

    // Morning Pop (07:01) is older than Midnight Jazz (23:01)
    const cards = page.getByTestId("lyrics-list-item");
    const firstCardTitle = cards.first().getByTestId("card-title");
    await expect(firstCardTitle).toContainText("Morning Pop");
  });

  test("most generated sort puts entry with more songs first", async ({
    page,
  }) => {
    const select = page.getByTestId("lyrics-sort-select");
    await select.selectOption("most-generated");

    // Morning Pop has 2 songs; Midnight Jazz has 0 → Morning Pop first
    const cards = page.getByTestId("lyrics-list-item");
    const firstCardTitle = cards.first().getByTestId("card-title");
    await expect(firstCardTitle).toContainText("Morning Pop");
  });

  test("most pinned sort shows sort dropdown without error", async ({
    page,
  }) => {
    const select = page.getByTestId("lyrics-sort-select");
    await select.selectOption("most-pinned");
    await expect(select).toHaveValue("most-pinned");

    // Both entries have 0 pinned songs; tie-break is newest first (Midnight Jazz)
    const cards = page.getByTestId("lyrics-list-item");
    await expect(cards).toHaveCount(2);
    const firstCardTitle = cards.first().getByTestId("card-title");
    await expect(firstCardTitle).toContainText("Midnight Jazz");
  });

  test("sort combines with search filter", async ({ page }) => {
    // Filter to jazz entries only, then sort oldest first
    const search = page.getByRole("textbox", { name: "Search lyrics" });
    await search.fill("jazz");

    const select = page.getByTestId("lyrics-sort-select");
    await select.selectOption("oldest");

    // Only Midnight Jazz matches; still visible
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();
    await expect(page.getByTestId("lyrics-list-item")).toHaveCount(1);
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test("clicking a card navigates to Lyrics Generator for that entry", async ({
    page,
  }) => {
    await page
      .getByTestId("lyrics-item-card")
      .filter({ hasText: "Morning Pop" })
      .click();
    await expect(page).toHaveURL(/\/music\/lyrics\/fixture-multi-entry-1a$/);
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  test("soft-delete shows confirmation dialog before deleting", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Delete Morning Pop" })
      .click();
    await expect(page.getByTestId("confirm-dialog")).toBeVisible();

    // Entry still visible while dialog is open
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).toBeVisible();
  });

  test("soft-delete cancelling confirmation leaves entry unchanged", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Delete Morning Pop" })
      .click();
    await page.getByTestId("confirm-dialog-cancel").click();
    await expect(page.getByTestId("confirm-dialog")).not.toBeVisible();

    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();
  });

  test("soft-delete removes card from grid", async ({ page }) => {
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Delete Morning Pop" })
      .click();
    await page.getByTestId("confirm-dialog-confirm").click();

    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).not.toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();

    // Verify soft-deleted in storage (not hard-removed)
    const stored = await page.evaluate(() => {
      return window.storageService.export();
    });
    const deleted = stored.messages.find(
      (m: { id: string }) => m.id === "fixture-multi-entry-1a"
    );
    expect(deleted).toBeDefined();
    expect((deleted as { deleted: boolean }).deleted).toBe(true);
  });

  test("soft-delete persists after page reload", async ({ page }) => {
    await page
      .getByRole("button", { name: "Delete Morning Pop" })
      .click();
    await page.getByTestId("confirm-dialog-confirm").click();

    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).not.toBeVisible();

    await page.reload();

    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).not.toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  test("empty state shown when no lyrics entries", async ({ page }) => {
    await seedFixture(page, emptyFixture);
    await page.goto("/music/lyrics");
    await expect(page.getByTestId("lyrics-list-empty")).toBeVisible();
    await expect(page.getByText("No lyrics yet")).toBeVisible();
  });
});

// ── New button ───────────────────────────────────────────────────────────────

test("New button navigates to /music", async ({ page }) => {
  await seedFixture(page, multiEntryFixture);
  await page.goto("/music/lyrics");
  // Use the page-level New button (not the TopBar link)
  await page.getByRole("button", { name: "New" }).click();
  await expect(page).toHaveURL(/\/music$/);
});

// ── Single entry navigation ───────────────────────────────────────────────────

test("Lyrics List: single entry fixture - card click navigates correctly", async ({
  page,
}) => {
  await seedFixture(page, baseFixture);
  await page.goto("/music/lyrics");

  await expect(
    page.getByTestId("card-title").filter({ hasText: "Coffee Dreams" })
  ).toBeVisible();
  await page
    .getByTestId("lyrics-item-card")
    .filter({ hasText: "Coffee Dreams" })
    .click();
  await expect(page).toHaveURL(/\/music\/lyrics\/fixture-msg-1a$/);
});

// ── Screenshot tests ─────────────────────────────────────────────────────────

test(
  "@screenshot:lyrics-list lyrics list page renders correctly with seeded data",
  async ({ page }) => {
    await screenshotPage(page, "/music/lyrics", multiEntryFixture, {
      path: "screenshots/lyrics-list.png",
    });

    await expect(
      page.getByRole("heading", { name: "Lyrics" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New" })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Search lyrics" })
    ).toBeVisible();
    await expect(page.getByTestId("lyrics-sort-select")).toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Morning Pop" })
    ).toBeVisible();
    await expect(
      page.getByTestId("card-title").filter({ hasText: "Midnight Jazz" })
    ).toBeVisible();
  }
);

test(
  "@screenshot:lyrics-list-mobile lyrics list mobile renders correctly",
  async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await screenshotPage(page, "/music/lyrics", multiEntryFixture, {
      path: "screenshots/lyrics-list-mobile.png",
    });

    await expect(
      page.getByRole("heading", { name: "Lyrics" })
    ).toBeVisible();
    await expect(
      page.getByTestId("lyrics-list-item").first()
    ).toBeVisible();
  }
);
