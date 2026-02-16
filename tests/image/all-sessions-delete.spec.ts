/**
 * Tests for US-005: AllSessions stale state after deletion.
 * Updated for US-012: delete now requires confirmation via ConfirmDialog.
 *
 * Verifies that:
 * - Each session row renders a delete button.
 * - Clicking the delete button opens a confirmation dialog.
 * - Cancelling the dialog leaves the session intact.
 * - Confirming the dialog removes the session from the list immediately.
 * - No page navigation is required for the list to reflect the deletion.
 * - Sibling sessions are unaffected by the deletion.
 * - When the last session is deleted the empty state is shown.
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

test.describe("AllSessions delete (US-005)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app root, clear localStorage, then seed fixture data.
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((data: ImageStorageExport) => {
      window.imageStorageService.import(data);
    }, fixture);
    await page.goto("/image/sessions");
  });

  test("each session row has a delete button", async ({ page }) => {
    const rows = page.getByTestId("session-list-item");
    await expect(rows).toHaveCount(3);

    const deleteBtns = page.getByTestId("delete-session-btn");
    await expect(deleteBtns).toHaveCount(3);
  });

  test("delete shows confirmation dialog before removing session", async ({ page }) => {
    await expect(page.getByTestId("session-list-item")).toHaveCount(3);

    // Click delete — dialog should appear
    await page.getByTestId("delete-session-btn").first().click();
    await expect(page.getByTestId("confirm-dialog")).toBeVisible();

    // Sessions still intact while dialog is open
    await expect(page.getByTestId("session-list-item")).toHaveCount(3);
  });

  test("cancelling confirmation leaves session unchanged", async ({ page }) => {
    await page.getByTestId("delete-session-btn").first().click();
    await expect(page.getByTestId("confirm-dialog")).toBeVisible();

    // Cancel
    await page.getByTestId("confirm-dialog-cancel").click();
    await expect(page.getByTestId("confirm-dialog")).not.toBeVisible();

    // All sessions still present
    await expect(page.getByTestId("session-list-item")).toHaveCount(3);
  });

  test("deleting a session removes it from the list immediately", async ({ page }) => {
    await expect(page.getByTestId("session-list-item")).toHaveCount(3);

    // Delete the first row (Alpha session — newest first) — click delete then confirm
    const firstDeleteBtn = page.getByTestId("delete-session-btn").first();
    await firstDeleteBtn.click();
    await page.getByTestId("confirm-dialog-confirm").click();

    // List should now have 2 items without any navigation
    await expect(page.getByTestId("session-list-item")).toHaveCount(2);
  });

  test("sibling sessions remain visible after deletion", async ({ page }) => {
    // Delete Alpha (first/top) — click delete then confirm
    await page.getByTestId("delete-session-btn").first().click();
    await page.getByTestId("confirm-dialog-confirm").click();

    // Beta and Gamma should still be present
    await expect(page.getByText("Beta session")).toBeVisible();
    await expect(page.getByText("Gamma session")).toBeVisible();

    // Alpha should be gone
    await expect(page.getByText("Alpha session")).not.toBeVisible();
  });

  test("shows empty state after all sessions are deleted", async ({ page }) => {
    // Delete all three sessions (each requires a confirm step)
    await page.getByTestId("delete-session-btn").first().click();
    await page.getByTestId("confirm-dialog-confirm").click();

    await page.getByTestId("delete-session-btn").first().click();
    await page.getByTestId("confirm-dialog-confirm").click();

    await page.getByTestId("delete-session-btn").first().click();
    await page.getByTestId("confirm-dialog-confirm").click();

    await expect(page.getByTestId("all-sessions-empty")).toBeVisible();
  });

  test("deleted session is not restored after page reload", async ({ page }) => {
    await page.getByTestId("delete-session-btn").first().click();
    await page.getByTestId("confirm-dialog-confirm").click();
    await expect(page.getByTestId("session-list-item")).toHaveCount(2);

    // Reload the page — the deleted session must not reappear
    await page.reload();
    await expect(page.getByTestId("session-list-item")).toHaveCount(2);
  });
});
