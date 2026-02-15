/**
 * Tests for US-009: Lyrics Generator layout and frontmatter display.
 *
 * Verifies that:
 * - Left panel displays YAML frontmatter (title, style, commentary) and lyrics body
 * - Right panel contains scrollable message history and a text input with send button
 * - "Generate Songs" button is present at the bottom of the page
 * - Clicking "Generate Songs" navigates to the Song Generator for the current entry
 * - Screenshot test with seeded fixture data
 *
 * State is seeded via storageService.import() — the same code path as the
 * real Settings import UI.
 */

import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { screenshotPage } from "./helpers/screenshot";
import { baseFixture } from "../fixtures/index";

test.describe("Lyrics Generator page", () => {
  test.beforeEach(async ({ page }) => {
    await seedFixture(page, baseFixture);
    await page.goto("/lyrics/fixture-entry-1");
  });

  test("left panel displays frontmatter fields", async ({ page }) => {
    const panel = page.getByTestId("lyrics-panel");
    await expect(panel).toBeVisible();

    // Title, style, and commentary from the fixture
    await expect(page.getByTestId("lyrics-title")).toContainText("Coffee Dreams");
    await expect(page.getByTestId("lyrics-style")).toContainText("upbeat pop");
    await expect(page.getByTestId("lyrics-commentary")).toContainText(
      "A cheerful song about the morning ritual of coffee."
    );
  });

  test("left panel displays lyrics body", async ({ page }) => {
    const body = page.getByTestId("lyrics-body");
    await expect(body).toBeVisible();
    await expect(body).toContainText("Wake up to the smell of something brewing");
    await expect(body).toContainText("Coffee gets me up");
  });

  test("right panel has scrollable chat history area", async ({ page }) => {
    const chatPanel = page.getByTestId("chat-panel");
    await expect(chatPanel).toBeVisible();

    // The fixture entry has chat history entries
    const history = page.getByTestId("chat-history");
    await expect(history).toBeVisible();
  });

  test("right panel shows existing chat messages", async ({ page }) => {
    // baseFixture has one user and one assistant message
    const userMsgs = page.getByTestId("chat-message-user");
    const assistantMsgs = page.getByTestId("chat-message-assistant");

    await expect(userMsgs.first()).toBeVisible();
    await expect(userMsgs.first()).toContainText("Write a short pop song about coffee");
    await expect(assistantMsgs.first()).toBeVisible();
  });

  test("right panel has text input and send button", async ({ page }) => {
    await expect(page.getByTestId("chat-input")).toBeVisible();
    await expect(page.getByTestId("chat-submit")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send" })
    ).toBeVisible();
  });

  test("Generate Songs button is present at the bottom of the page", async ({
    page,
  }) => {
    await expect(page.getByTestId("generate-songs-btn")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate Songs" })
    ).toBeVisible();
  });

  test("clicking Generate Songs navigates to Song Generator for the current entry", async ({
    page,
  }) => {
    await page.getByTestId("generate-songs-btn").click();
    await expect(page).toHaveURL(/\/songs\?entryId=fixture-entry-1/);
  });
});

test.describe("Lyrics Generator – empty / new entry", () => {
  test("shows empty state message when navigated to /lyrics/new", async ({
    page,
  }) => {
    await seedFixture(page, baseFixture);
    await page.goto("/lyrics/new");

    // The /lyrics/new route has no :id param so entry is null
    await expect(page.getByTestId("lyrics-empty")).toBeVisible();
  });

  test("Generate Songs button is disabled when there is no entry id", async ({
    page,
  }) => {
    await seedFixture(page, baseFixture);
    await page.goto("/lyrics/new");

    const btn = page.getByTestId("generate-songs-btn");
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });
});

test(
  "@screenshot:lyrics lyrics generator page renders correctly with seeded data",
  async ({ page }) => {
    await screenshotPage(page, "/lyrics/fixture-entry-1", baseFixture, {
      path: "screenshots/lyrics-generator.png",
    });

    // Verify key elements are visible
    await expect(page.getByTestId("lyrics-panel")).toBeVisible();
    await expect(page.getByTestId("chat-panel")).toBeVisible();
    await expect(page.getByTestId("lyrics-title")).toContainText("Coffee Dreams");
    await expect(page.getByTestId("chat-input")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate Songs" })
    ).toBeVisible();
  }
);
