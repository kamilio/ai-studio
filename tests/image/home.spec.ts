/**
 * Tests for US-027: Playwright tests for image landing page.
 *
 * Verifies that:
 * - Empty state shows 4 example prompts and no recent sessions section
 * - Returning user state shows 2 example prompts and up to 2 recent sessions
 * - Submitting a prompt creates a session and navigates to /image/sessions/:id
 * - Cmd+Enter keyboard shortcut submits the form
 * - Generate button is disabled when the prompt textarea is empty
 * - Clicking an example prompt fills the textarea
 *
 * All tests run with VITE_USE_MOCK_LLM=true (configured in playwright.config.ts).
 * Storage is seeded via window.imageStorageService.import() through the helpers.
 */

import { test, expect } from "@playwright/test";
import { seedImageFixture, clearImageStorage } from "./helpers/seed";
import type { ImageStorageExport } from "../../src/image/lib/storage/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Two sessions used for the returning-user state tests. */
const twoSessionsFixture: ImageStorageExport = {
  sessions: [
    {
      id: "home-test-session-1",
      title: "A serene mountain landscape at golden hour",
      createdAt: "2026-01-10T10:00:00.000Z",
    },
    {
      id: "home-test-session-2",
      title: "Futuristic cityscape at night with neon reflections",
      createdAt: "2026-01-11T12:00:00.000Z",
    },
  ],
  generations: [],
  items: [],
  settings: { numImages: 3 },
};

// ── Empty state ────────────────────────────────────────────────────────────────

test.describe("Image home — empty state (no prior sessions)", () => {
  test.beforeEach(async ({ page }) => {
    await clearImageStorage(page);
    await page.goto("/image");
  });

  test("shows 4 example prompts when user has no sessions", async ({ page }) => {
    const examples = page.getByTestId("example-prompt-btn");
    await expect(examples).toHaveCount(4);
  });

  test("does not show the recent sessions section", async ({ page }) => {
    await expect(page.getByTestId("recent-session-card")).toHaveCount(0);
  });

  test("textarea is auto-focused on mount", async ({ page }) => {
    const textarea = page.getByRole("textbox", { name: "Image prompt" });
    await expect(textarea).toBeFocused();
  });

  test("Generate button is disabled when prompt is empty", async ({ page }) => {
    const button = page.getByRole("button", { name: /Generate/i });
    await expect(button).toBeDisabled();
  });
});

// ── Returning user state ───────────────────────────────────────────────────────

test.describe("Image home — returning user state (2 recent sessions)", () => {
  test.beforeEach(async ({ page }) => {
    await seedImageFixture(page, twoSessionsFixture);
    await page.goto("/image");
  });

  test("shows 2 example prompts when user has prior sessions", async ({ page }) => {
    const examples = page.getByTestId("example-prompt-btn");
    await expect(examples).toHaveCount(2);
  });

  test("shows 2 recent session cards for returning user", async ({ page }) => {
    const cards = page.getByTestId("recent-session-card");
    await expect(cards).toHaveCount(2);
  });

  test("recent session cards link to correct session routes", async ({ page }) => {
    const cards = page.getByTestId("recent-session-card");
    // Session with the most recent createdAt should appear (order not strictly enforced here)
    await expect(cards.first()).toHaveAttribute("href", /\/image\/sessions\//);
  });

  test("recent session cards display session title text", async ({ page }) => {
    const cards = page.getByTestId("recent-session-card");
    // Both session titles from the fixture should appear somewhere on the page
    const allText = await cards.allInnerTexts();
    const combined = allText.join(" ");
    expect(combined).toContain("mountain landscape");
    expect(combined).toContain("neon reflections");
  });
});

// ── Prompt submission ──────────────────────────────────────────────────────────

test.describe("Image home — prompt submission and navigation", () => {
  test.beforeEach(async ({ page }) => {
    await clearImageStorage(page);
    await page.goto("/image");
  });

  test("submitting a non-empty prompt navigates to /image/sessions/:id", async ({ page }) => {
    const textarea = page.getByRole("textbox", { name: "Image prompt" });
    await textarea.fill("A magical forest with glowing mushrooms");

    const button = page.getByRole("button", { name: /Generate/i });
    await expect(button).toBeEnabled();
    await button.click();

    await expect(page).toHaveURL(/\/image\/sessions\//);
  });

  test("Generate button becomes enabled after typing a prompt", async ({ page }) => {
    const textarea = page.getByRole("textbox", { name: "Image prompt" });
    const button = page.getByRole("button", { name: /Generate/i });

    await expect(button).toBeDisabled();
    await textarea.fill("Something");
    await expect(button).toBeEnabled();
  });

  test("clicking an example prompt fills the textarea", async ({ page }) => {
    const exampleBtn = page.getByTestId("example-prompt-btn").first();
    const exampleText = await exampleBtn.innerText();

    await exampleBtn.click();

    const textarea = page.getByRole("textbox", { name: "Image prompt" });
    await expect(textarea).toHaveValue(exampleText);
  });
});

// ── Cmd+Enter keyboard shortcut ───────────────────────────────────────────────

test.describe("Image home — Cmd+Enter keyboard shortcut", () => {
  test.beforeEach(async ({ page }) => {
    await clearImageStorage(page);
    await page.goto("/image");
  });

  test("Cmd+Enter submits the form and navigates to session view", async ({ page }) => {
    const textarea = page.getByRole("textbox", { name: "Image prompt" });
    await textarea.fill("An ancient temple hidden in the jungle");

    await textarea.press("Meta+Enter");

    await expect(page).toHaveURL(/\/image\/sessions\//);
  });

  test("Ctrl+Enter also submits the form and navigates to session view", async ({ page }) => {
    const textarea = page.getByRole("textbox", { name: "Image prompt" });
    await textarea.fill("A cyberpunk alleyway with holographic advertisements");

    await textarea.press("Control+Enter");

    await expect(page).toHaveURL(/\/image\/sessions\//);
  });

  test("Enter alone does not submit the form", async ({ page }) => {
    const textarea = page.getByRole("textbox", { name: "Image prompt" });
    await textarea.fill("Test prompt");

    await textarea.press("Enter");

    // Should remain on /image
    await expect(page).toHaveURL("/image");
  });
});
