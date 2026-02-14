/**
 * Typed fixture data for Playwright tests.
 *
 * All fixtures are in the StorageExport format — the same format produced by
 * storageService.export() and consumed by storageService.import(). This ensures
 * that test state flows through the exact same code path as real user imports.
 */

import type { StorageExport } from "../src/lib/storage/types";

/** Empty state: no settings, no entries, no songs. */
export const emptyFixture: StorageExport = {
  settings: null,
  lyricsEntries: [],
  songs: [],
};

/** A fixture with one complete lyrics entry and one song, suitable for most feature tests. */
export const baseFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  lyricsEntries: [
    {
      id: "fixture-entry-1",
      title: "Coffee Dreams",
      style: "upbeat pop",
      commentary: "A cheerful song about the morning ritual of coffee.",
      body: [
        "Wake up to the smell of something brewing",
        "Golden liquid dreams in my cup",
        "Every sip a moment worth pursuing",
        "Coffee gets me up",
      ].join("\n"),
      chatHistory: [
        {
          role: "user",
          content: "Write a short pop song about coffee",
        },
        {
          role: "assistant",
          content: [
            "---",
            "title: Coffee Dreams",
            "style: upbeat pop",
            "commentary: A cheerful song about the morning ritual of coffee.",
            "---",
            "Wake up to the smell of something brewing",
            "Golden liquid dreams in my cup",
            "Every sip a moment worth pursuing",
            "Coffee gets me up",
          ].join("\n"),
        },
      ],
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:05:00.000Z",
      deleted: false,
    },
  ],
  songs: [
    {
      id: "fixture-song-1",
      lyricsEntryId: "fixture-entry-1",
      title: "Coffee Dreams (Take 1)",
      audioUrl: "https://example.com/fixture-audio-1.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-01T08:10:00.000Z",
    },
  ],
};

/** A fixture with a pinned song, for testing the Pinned Songs page. */
export const pinnedFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  lyricsEntries: [
    {
      id: "fixture-entry-pinned",
      title: "Pinned Anthem",
      style: "rock",
      commentary: "A rock anthem worth pinning.",
      body: "We rise, we fall, we rise again",
      chatHistory: [],
      createdAt: "2026-01-02T10:00:00.000Z",
      updatedAt: "2026-01-02T10:00:00.000Z",
      deleted: false,
    },
  ],
  songs: [
    {
      id: "fixture-song-pinned-1",
      lyricsEntryId: "fixture-entry-pinned",
      title: "Pinned Anthem (Take 1)",
      audioUrl: "https://example.com/fixture-pinned-1.mp3",
      pinned: true,
      deleted: false,
      createdAt: "2026-01-02T10:05:00.000Z",
    },
    {
      id: "fixture-song-pinned-2",
      lyricsEntryId: "fixture-entry-pinned",
      title: "Pinned Anthem (Take 2)",
      audioUrl: "https://example.com/fixture-pinned-2.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-02T10:06:00.000Z",
    },
  ],
};

/** A fixture without an API key, for testing the API-key-missing modal. */
export const noApiKeyFixture: StorageExport = {
  settings: {
    poeApiKey: "",
    numSongs: 3,
  },
  lyricsEntries: [
    {
      id: "fixture-entry-nokey",
      title: "Keyless Wonder",
      style: "jazz",
      commentary: "A jazz piece with no API key set.",
      body: "Notes in the air, keys not there",
      chatHistory: [],
      createdAt: "2026-01-03T09:00:00.000Z",
      updatedAt: "2026-01-03T09:00:00.000Z",
      deleted: false,
    },
  ],
  songs: [],
};

/** A fixture with multiple lyrics entries, for testing the Lyrics List page. */
export const multiEntryFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  lyricsEntries: [
    {
      id: "fixture-multi-entry-1",
      title: "Morning Pop",
      style: "pop",
      commentary: "A pop song for the morning.",
      body: "Rise and shine, the day is mine",
      chatHistory: [],
      createdAt: "2026-01-04T07:00:00.000Z",
      updatedAt: "2026-01-04T07:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-entry-2",
      title: "Midnight Jazz",
      style: "jazz",
      commentary: "A jazz tune for late nights.",
      body: "Smooth notes drift through the dark",
      chatHistory: [],
      createdAt: "2026-01-04T23:00:00.000Z",
      updatedAt: "2026-01-04T23:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-entry-3",
      title: "Deleted Entry",
      style: "blues",
      commentary: "This entry was soft-deleted.",
      body: "Gone but not forgotten",
      chatHistory: [],
      createdAt: "2026-01-04T12:00:00.000Z",
      updatedAt: "2026-01-04T12:01:00.000Z",
      deleted: true,
    },
  ],
  songs: [],
};
