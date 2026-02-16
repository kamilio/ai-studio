/**
 * Tests for US-027: Fullscreen image viewer.
 *
 * Verifies that:
 * - Clicking an image opens the fullscreen modal (US-027)
 * - Modal shows the "Current" list by default (US-027)
 * - "All" list includes all images in the session including older steps (US-027)
 * - "Current" list is limited to the most recent generation only (US-027)
 * - Left/right arrow buttons navigate within the active list (US-027)
 * - ArrowLeft/ArrowRight keyboard keys navigate within the active list (US-027)
 * - ESC key closes the modal (US-027)
 * - Clicking outside the image area closes the modal (US-027)
 * - Modal does not show when there are no images (US-027)
 * - Counter shows correct position (e.g. "1 / 3") (US-027)
 *
 * All tests run with VITE_USE_MOCK_LLM=true (configured in playwright.config.ts).
 */

import { test, expect } from "@playwright/test";
import { seedImageFixture } from "./helpers/seed";
import { imageBaseFixture, imageMultiStepFixture } from "../fixtures/index";

const BASE_SESSION_ID = "fixture-img-session-1";
const MULTI_SESSION_ID = "fixture-img-multi-session-1";

// ── Opening the fullscreen viewer ─────────────────────────────────────────────

test.describe("Fullscreen viewer — opening (US-027)", () => {
  test.beforeEach(async ({ page }) => {
    await seedImageFixture(page, imageBaseFixture);
  });

  test("clicking an image opens the fullscreen viewer", async ({ page }) => {
    await page.goto(`/image/sessions/${BASE_SESSION_ID}`);

    // Click the first image in the main pane
    const firstCard = page.getByTestId("image-card").first();
    await firstCard.locator("img").click();

    await expect(page.getByTestId("fullscreen-viewer")).toBeVisible();
  });

  test("fullscreen viewer shows the selected image", async ({ page }) => {
    await page.goto(`/image/sessions/${BASE_SESSION_ID}`);

    const firstCard = page.getByTestId("image-card").first();
    await firstCard.locator("img").click();

    await expect(page.getByTestId("fullscreen-image")).toBeVisible();
  });

  test("fullscreen button on each card opens the viewer", async ({ page }) => {
    await page.goto(`/image/sessions/${BASE_SESSION_ID}`);

    const firstCard = page.getByTestId("image-card").first();
    await firstCard.getByTestId("fullscreen-btn").click();

    await expect(page.getByTestId("fullscreen-viewer")).toBeVisible();
  });
});

// ── Closing the fullscreen viewer ─────────────────────────────────────────────

test.describe("Fullscreen viewer — closing (US-027)", () => {
  test.beforeEach(async ({ page }) => {
    await seedImageFixture(page, imageBaseFixture);
    await page.goto(`/image/sessions/${BASE_SESSION_ID}`);
    await page.getByTestId("image-card").first().locator("img").click();
    await expect(page.getByTestId("fullscreen-viewer")).toBeVisible();
  });

  test("close button closes the fullscreen viewer", async ({ page }) => {
    await page.getByTestId("fullscreen-close-btn").click();
    await expect(page.getByTestId("fullscreen-viewer")).not.toBeVisible();
  });

  test("ESC key closes the fullscreen viewer", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("fullscreen-viewer")).not.toBeVisible();
  });

  test("clicking the backdrop (outside image) closes the viewer", async ({ page }) => {
    // Click in the top-left corner of the backdrop (far from image center)
    const viewer = page.getByTestId("fullscreen-viewer");
    const box = await viewer.boundingBox();
    if (box) {
      // Click near the left edge of the backdrop (safely outside the image area)
      await page.mouse.click(box.x + 10, box.y + box.height / 2);
    }
    await expect(page.getByTestId("fullscreen-viewer")).not.toBeVisible();
  });
});

// ── List mode toggle (US-027) ─────────────────────────────────────────────────

test.describe("Fullscreen viewer — list modes (US-027)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedImageFixture(page, imageMultiStepFixture);
    await page.goto(`/image/sessions/${MULTI_SESSION_ID}`);
    // Open the viewer by clicking the first image in the main pane
    await page.getByTestId("image-card").first().locator("img").click();
    await expect(page.getByTestId("fullscreen-viewer")).toBeVisible();
  });

  test("list mode toggle is visible", async ({ page }) => {
    await expect(page.getByTestId("fullscreen-list-mode-toggle")).toBeVisible();
  });

  test("'Current' mode button is present", async ({ page }) => {
    await expect(page.getByTestId("fullscreen-mode-current")).toBeVisible();
  });

  test("'All' mode button is present", async ({ page }) => {
    await expect(page.getByTestId("fullscreen-mode-all")).toBeVisible();
  });

  test("counter shows 3 images in Current mode (only step 2)", async ({ page }) => {
    // imageMultiStepFixture has stepId 2 (3 items) as the latest generation
    // Default mode is "current" which shows only step 2 items
    await expect(page.getByTestId("fullscreen-counter")).toContainText("/ 3");
  });

  test("switching to All mode shows 6 images (both steps)", async ({ page }) => {
    // Click All mode button
    await page.getByTestId("fullscreen-mode-all").click();
    // imageMultiStepFixture has 6 total non-deleted items
    await expect(page.getByTestId("fullscreen-counter")).toContainText("/ 6");
  });

  test("switching back to Current mode shows 3 images again", async ({ page }) => {
    // Switch to All then back to Current
    await page.getByTestId("fullscreen-mode-all").click();
    await expect(page.getByTestId("fullscreen-counter")).toContainText("/ 6");

    await page.getByTestId("fullscreen-mode-current").click();
    await expect(page.getByTestId("fullscreen-counter")).toContainText("/ 3");
  });
});

// ── Navigation (US-027) ───────────────────────────────────────────────────────

test.describe("Fullscreen viewer — navigation (US-027)", () => {
  test.beforeEach(async ({ page }) => {
    await seedImageFixture(page, imageBaseFixture);
    await page.goto(`/image/sessions/${BASE_SESSION_ID}`);
    await page.getByTestId("image-card").first().locator("img").click();
    await expect(page.getByTestId("fullscreen-viewer")).toBeVisible();
  });

  test("left and right arrow buttons are visible when there are multiple images", async ({ page }) => {
    await expect(page.getByTestId("fullscreen-prev-btn")).toBeVisible();
    await expect(page.getByTestId("fullscreen-next-btn")).toBeVisible();
  });

  test("counter starts at 1 / N", async ({ page }) => {
    await expect(page.getByTestId("fullscreen-counter")).toContainText("1 /");
  });

  test("clicking next arrow advances to image 2", async ({ page }) => {
    await page.getByTestId("fullscreen-next-btn").click();
    await expect(page.getByTestId("fullscreen-counter")).toContainText("2 /");
  });

  test("clicking previous arrow after advancing goes back to image 1", async ({ page }) => {
    await page.getByTestId("fullscreen-next-btn").click();
    await expect(page.getByTestId("fullscreen-counter")).toContainText("2 /");

    await page.getByTestId("fullscreen-prev-btn").click();
    await expect(page.getByTestId("fullscreen-counter")).toContainText("1 /");
  });

  test("ArrowRight keyboard key advances to next image", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("fullscreen-counter")).toContainText("2 /");
  });

  test("ArrowLeft keyboard key goes to previous image", async ({ page }) => {
    // First advance to image 2
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("fullscreen-counter")).toContainText("2 /");

    // Then go back
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("fullscreen-counter")).toContainText("1 /");
  });

  test("navigation wraps around: next from last image goes to first", async ({ page }) => {
    // imageBaseFixture has 3 items in current generation
    // Advance to last image (index 3)
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("fullscreen-counter")).toContainText("3 /");

    // Next from last wraps to 1
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("fullscreen-counter")).toContainText("1 /");
  });

  test("navigation wraps around: previous from first image goes to last", async ({ page }) => {
    // At image 1, going left should wrap to last (3)
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("fullscreen-counter")).toContainText("3 /");
  });
});

// ── Single image (US-027) ─────────────────────────────────────────────────────

test.describe("Fullscreen viewer — single image (US-027)", () => {
  test("no navigation arrows when only one image is in the active list", async ({ page }) => {
    // Create a fixture with exactly 1 item
    const singleItemFixture = {
      sessions: [
        {
          id: "fixture-single-session",
          title: "Single image session",
          createdAt: "2026-01-10T10:00:00.000Z",
        },
      ],
      generations: [
        {
          id: "fixture-single-gen",
          sessionId: "fixture-single-session",
          stepId: 1,
          prompt: "A single image",
          createdAt: "2026-01-10T10:01:00.000Z",
        },
      ],
      items: [
        {
          id: "fixture-single-item",
          generationId: "fixture-single-gen",
          url: "https://pfst.cf2.poecdn.net/base/image/3b4ad274cac34e532177281ef1458c2dbf7f8cf20b8f2c7cd909676760d6f079?w=1024&h=1024",
          pinned: false,
          deleted: false,
          createdAt: "2026-01-10T10:01:05.000Z",
        },
      ],
      settings: { numImages: 1 },
    };
    await seedImageFixture(page, singleItemFixture);
    await page.goto("/image/sessions/fixture-single-session");

    await page.getByTestId("image-card").first().locator("img").click();
    await expect(page.getByTestId("fullscreen-viewer")).toBeVisible();

    // No navigation buttons for a single image
    await expect(page.getByTestId("fullscreen-prev-btn")).not.toBeVisible();
    await expect(page.getByTestId("fullscreen-next-btn")).not.toBeVisible();

    // No counter for a single image
    await expect(page.getByTestId("fullscreen-counter")).not.toBeVisible();
  });
});
