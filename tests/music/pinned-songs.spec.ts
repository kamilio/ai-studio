/**
 * Tests for US-013 / US-010 / US-020: Pinned Songs page.
 *
 * Verifies that:
 * - All pinned, non-deleted songs are listed
 * - Each song shows its title and associated lyrics entry title
 * - The lyrics entry title is a clickable link to /lyrics/:messageId/songs (US-010)
 * - Play renders an inline HTML5 audio player
 * - Unpin sets pinned: false and removes the song from the view
 * - Download button is visible on each pinned song item
 * - Empty state shown when no pinned songs exist
 * - Screenshot test with seeded fixture data
 * - US-020: "Clear filter" button shows all songs; "Show pinned only" restores pinned view
 *
 * State is seeded via storageService.import() — the same code path as the
 * real Settings import UI — to ensure test state flows through real code.
 */

import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { screenshotPage } from "./helpers/screenshot";
import { pinnedFixture, baseFixture, emptyFixture } from "../fixtures/index";
import type { Song } from "../src/music/lib/storage/types";

test.describe("Pinned Songs page (US-013)", () => {
  test("lists all pinned non-deleted songs", async ({ page }) => {
    // pinnedFixture has 2 songs: 1 pinned, 1 not pinned
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    // Only the pinned song should appear
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(1);
    await expect(page.getByTestId("pinned-song-title")).toHaveText(
      "Pinned Anthem (Take 1)"
    );
  });

  test("shows song title and associated lyrics entry title", async ({
    page,
  }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    await expect(page.getByTestId("pinned-song-title")).toBeVisible();
    await expect(page.getByTestId("pinned-song-title")).toHaveText(
      "Pinned Anthem (Take 1)"
    );

    // Entry title should be shown under the song title (includes "from" prefix)
    await expect(page.getByTestId("pinned-song-entry-title")).toHaveText(
      'from "Pinned Anthem"'
    );
  });

  test("US-010: lyrics title is a link to /lyrics/:messageId/songs", async ({
    page,
  }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    // The entry title element should be an anchor (<a>) pointing to the Songs View
    const entryTitleLink = page.getByTestId("pinned-song-entry-title");
    await expect(entryTitleLink).toBeVisible();
    await expect(entryTitleLink).toHaveText('from "Pinned Anthem"');

    // Verify it is a link with the correct href
    const expectedHref = `/music/lyrics/fixture-msg-pinned-a/songs`;
    await expect(entryTitleLink).toHaveAttribute("href", expectedHref);
  });

  test("US-010: clicking lyrics title link navigates to correct Songs View", async ({
    page,
  }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    // Click the lyrics title link
    await page.getByTestId("pinned-song-entry-title").click();

    // Should navigate to the Songs View for the source message
    await expect(page).toHaveURL(
      "/music/lyrics/fixture-msg-pinned-a/songs"
    );
  });

  test("play: renders an inline audio player for each pinned song", async ({
    page,
  }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    const audio = page.getByTestId("pinned-song-audio");
    await expect(audio).toHaveCount(1);
    await expect(audio).toHaveAttribute("controls");
    await expect(audio).toHaveAttribute(
      "src",
      "https://example.com/fixture-pinned-1.mp3"
    );
  });

  test("unpin: sets pinned flag to false in localStorage", async ({ page }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    // 1 pinned song visible
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(1);

    // Click the unpin button
    await page.getByTestId("pinned-song-unpin-btn").click();

    // Verify localStorage was updated
    const songs = await page.evaluate(() => {
      const stored = localStorage.getItem("ai-studio:songs");
      if (!stored) return [] as Song[];
      return JSON.parse(stored) as Song[];
    });

    const unpinnedSong = songs.find(
      (s) => s.id === "fixture-song-pinned-1"
    );
    expect(unpinnedSong?.pinned).toBe(false);
  });

  test("unpin: removes song from view immediately", async ({ page }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    await expect(page.getByTestId("pinned-song-item")).toHaveCount(1);

    await page.getByTestId("pinned-song-unpin-btn").click();

    // Song should be gone from the list
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(0);

    // Empty state message should now appear
    await expect(page.getByTestId("no-pinned-message")).toBeVisible();
  });

  test("download: download button is visible on each pinned song", async ({
    page,
  }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    await expect(page.getByTestId("pinned-song-download-btn")).toHaveCount(1);
  });

  test("shows empty state when no pinned songs exist", async ({ page }) => {
    // baseFixture has 1 song with pinned: false
    await seedFixture(page, baseFixture);
    await page.goto("/music/pinned");

    await expect(page.getByTestId("no-pinned-message")).toBeVisible();
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(0);
  });

  test("shows empty state when storage is empty", async ({ page }) => {
    await seedFixture(page, emptyFixture);
    await page.goto("/music/pinned");

    await expect(page.getByTestId("no-pinned-message")).toBeVisible();
  });

  test("does not show deleted pinned songs", async ({ page }) => {
    // Seed a fixture with a pinned but deleted song
    const deletedPinnedFixture = {
      ...pinnedFixture,
      songs: pinnedFixture.songs.map((s) =>
        s.id === "fixture-song-pinned-1" ? { ...s, deleted: true } : s
      ),
    };
    await seedFixture(page, deletedPinnedFixture);
    await page.goto("/music/pinned");

    await expect(page.getByTestId("no-pinned-message")).toBeVisible();
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(0);
  });

  test("multiple pinned songs are all displayed", async ({ page }) => {
    // Seed both songs as pinned
    const allPinnedFixture = {
      ...pinnedFixture,
      songs: pinnedFixture.songs.map((s) => ({ ...s, pinned: true })),
    };
    await seedFixture(page, allPinnedFixture);
    await page.goto("/music/pinned");

    await expect(page.getByTestId("pinned-song-item")).toHaveCount(2);
    await expect(page.getByTestId("pinned-song-audio")).toHaveCount(2);
  });

  // ── US-020: Filter toggle ─────────────────────────────────────────────────

  test("US-020: defaults to pinned-only view with Clear filter button visible", async ({
    page,
  }) => {
    // pinnedFixture has 1 pinned song and 1 unpinned song
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    // Only pinned song visible by default
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(1);

    // "Clear filter" button is visible; "Show pinned only" is not
    await expect(page.getByTestId("clear-filter-btn")).toBeVisible();
    await expect(page.getByTestId("show-pinned-only-btn")).not.toBeVisible();
  });

  test("US-020: clicking Clear filter shows all non-deleted songs", async ({
    page,
  }) => {
    // pinnedFixture has 1 pinned + 1 unpinned non-deleted song
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    await page.getByTestId("clear-filter-btn").click();

    // Both songs should now be visible
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(2);
  });

  test("US-020: after clearing filter, Show pinned only button appears", async ({
    page,
  }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    await page.getByTestId("clear-filter-btn").click();

    // "Show pinned only" replaces "Clear filter"
    await expect(page.getByTestId("show-pinned-only-btn")).toBeVisible();
    await expect(page.getByTestId("clear-filter-btn")).not.toBeVisible();
  });

  test("US-020: clicking Show pinned only restores pinned-only view", async ({
    page,
  }) => {
    await seedFixture(page, pinnedFixture);
    await page.goto("/music/pinned");

    // Clear filter to show all
    await page.getByTestId("clear-filter-btn").click();
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(2);

    // Restore pinned-only view
    await page.getByTestId("show-pinned-only-btn").click();
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(1);
    await expect(page.getByTestId("clear-filter-btn")).toBeVisible();
  });

  test("US-020: cleared filter does not show deleted songs", async ({
    page,
  }) => {
    // pinnedFixture has 1 pinned + 1 unpinned non-deleted song; add a deleted song
    const fixtureWithDeleted = {
      ...pinnedFixture,
      songs: [
        ...pinnedFixture.songs,
        {
          id: "fixture-song-pinned-3",
          messageId: "fixture-msg-pinned-a",
          title: "Deleted Take",
          audioUrl: "https://example.com/deleted.mp3",
          pinned: false,
          deleted: true,
          createdAt: "2026-01-02T10:07:00.000Z",
        },
      ],
    };
    await seedFixture(page, fixtureWithDeleted);
    await page.goto("/music/pinned");

    await page.getByTestId("clear-filter-btn").click();

    // Only non-deleted songs (2) should be visible; deleted song excluded
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(2);
  });
});

test(
  "@screenshot:pinned pinned songs page renders correctly with seeded data",
  async ({ page }) => {
    await screenshotPage(page, "/music/pinned", pinnedFixture, {
      path: "screenshots/pinned-songs.png",
    });

    // Verify key elements are visible
    await expect(
      page.getByRole("heading", { name: "Pinned Songs" })
    ).toBeVisible();
    await expect(page.getByTestId("pinned-song-item")).toHaveCount(1);
    await expect(page.getByTestId("pinned-song-title")).toHaveText(
      "Pinned Anthem (Take 1)"
    );
    await expect(page.getByTestId("pinned-song-unpin-btn")).toBeVisible();
    await expect(page.getByTestId("pinned-song-download-btn")).toBeVisible();
  }
);
