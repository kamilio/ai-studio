/**
 * Tests for US-005: AllSessions stale state after deletion.
 *
 * Verifies that:
 * - Each session row renders a delete button.
 * - Clicking the delete button removes the session from the list immediately.
 * - No page navigation is required for the list to reflect the deletion.
 * - Sibling sessions are unaffected by the deletion.
 * - When the last session is deleted the empty state is shown.
 *
 * Navigation uses the full /song-builder/ prefix because the Vite dev
 * server is configured with base: "/song-builder/" (vite.config.ts) and
 * the Playwright baseURL is "http://localhost:5173" (playwright.config.ts).
 * Absolute goto() paths therefore need the /song-builder prefix to reach
 * the actual app.
 */

import { test, expect } from "@playwright/test";
import type { ImageStorageExport } from "../../src/image/lib/storage/types";

const fixture: ImageStorageExport = {
  sessions: [
    {
      id: "session-alpha",
      title: "Alpha session",
      createdAt: "2026-01-03T10:00:00.000Z",
    },
    {
      id: "session-beta",
      title: "Beta session",
      createdAt: "2026-01-02T10:00:00.000Z",
    },
    {
      id: "session-gamma",
      title: "Gamma session",
      createdAt: "2026-01-01T10:00:00.000Z",
    },
  ],
  generations: [],
  items: [],
  settings: null,
};

/** Vite base path; all absolute goto() paths must include this prefix. */
const APP_BASE = "/song-builder";

test.describe("AllSessions delete (US-005)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app root, clear localStorage, then seed fixture data.
    await page.goto(`${APP_BASE}/`);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((data: ImageStorageExport) => {
      window.imageStorageService.import(data);
    }, fixture);
    await page.goto(`${APP_BASE}/image/sessions`);
  });

  test("each session row has a delete button", async ({ page }) => {
    const rows = page.getByTestId("session-list-item");
    await expect(rows).toHaveCount(3);

    const deleteBtns = page.getByTestId("delete-session-btn");
    await expect(deleteBtns).toHaveCount(3);
  });

  test("deleting a session removes it from the list immediately", async ({ page }) => {
    await expect(page.getByTestId("session-list-item")).toHaveCount(3);

    // Delete the first row (Alpha session — newest first)
    const firstDeleteBtn = page.getByTestId("delete-session-btn").first();
    await firstDeleteBtn.click();

    // List should now have 2 items without any navigation
    await expect(page.getByTestId("session-list-item")).toHaveCount(2);
  });

  test("sibling sessions remain visible after deletion", async ({ page }) => {
    // Delete Alpha (first/top)
    await page.getByTestId("delete-session-btn").first().click();

    // Beta and Gamma should still be present
    await expect(page.getByText("Beta session")).toBeVisible();
    await expect(page.getByText("Gamma session")).toBeVisible();

    // Alpha should be gone
    await expect(page.getByText("Alpha session")).not.toBeVisible();
  });

  test("shows empty state after all sessions are deleted", async ({ page }) => {
    const deleteBtns = page.getByTestId("delete-session-btn");

    // Delete all three sessions
    await deleteBtns.first().click();
    await deleteBtns.first().click();
    await deleteBtns.first().click();

    await expect(page.getByTestId("all-sessions-empty")).toBeVisible();
  });

  test("deleted session is not restored after page reload", async ({ page }) => {
    await page.getByTestId("delete-session-btn").first().click();
    await expect(page.getByTestId("session-list-item")).toHaveCount(2);

    // Reload the page — the deleted session must not reappear
    await page.reload();
    await expect(page.getByTestId("session-list-item")).toHaveCount(2);
  });
});
