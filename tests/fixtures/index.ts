/**
 * Typed fixture data for Playwright tests.
 *
 * All fixtures are in the StorageExport format — the same format produced by
 * storageService.export() and consumed by storageService.import(). This ensures
 * that test state flows through the exact same code path as real user imports.
 *
 * Data model: each conversation is a tree of Message nodes linked via parentId.
 * The root message has parentId: null and role "user". Each assistant reply has
 * lyrics fields (title, style, commentary, lyricsBody) populated from the response.
 * Songs reference the assistant Message whose lyrics were used (messageId).
 *
 * Image fixtures use the ImageStorageExport format consumed by
 * imageStorageService.import(). Playwright tests seed storage state via
 * window.imageStorageService.import(fixture) before navigating to image pages.
 */

import type { StorageExport } from "../../src/music/lib/storage/types";
import type { ImageStorageExport } from "../../src/image/lib/storage/types";

/** Empty state: no settings, no messages, no songs. */
export const emptyFixture: StorageExport = {
  settings: null,
  messages: [],
  songs: [],
};

/**
 * A fixture with one complete conversation (user → assistant) and one song.
 * Suitable for most feature tests.
 */
export const baseFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  messages: [
    {
      id: "fixture-msg-1u",
      role: "user",
      content: "Write a short pop song about coffee",
      parentId: null,
      createdAt: "2026-01-01T08:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-msg-1a",
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
      parentId: "fixture-msg-1u",
      title: "Coffee Dreams",
      style: "upbeat pop",
      commentary: "A cheerful song about the morning ritual of coffee.",
      lyricsBody: [
        "Wake up to the smell of something brewing",
        "Golden liquid dreams in my cup",
        "Every sip a moment worth pursuing",
        "Coffee gets me up",
      ].join("\n"),
      createdAt: "2026-01-01T08:05:00.000Z",
      deleted: false,
    },
  ],
  songs: [
    {
      id: "fixture-song-1",
      messageId: "fixture-msg-1a",
      title: "Coffee Dreams (Take 1)",
      audioUrl: "https://example.com/fixture-audio-1.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-01T08:10:00.000Z",
    },
  ],
};

/**
 * A fixture with a pinned song, for testing the Pinned Songs page.
 * Uses a simple user → assistant conversation about a rock anthem.
 */
export const pinnedFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  messages: [
    {
      id: "fixture-msg-pinned-u",
      role: "user",
      content: "Write a rock anthem worth pinning",
      parentId: null,
      createdAt: "2026-01-02T10:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-msg-pinned-a",
      role: "assistant",
      content: "We rise, we fall, we rise again",
      parentId: "fixture-msg-pinned-u",
      title: "Pinned Anthem",
      style: "rock",
      commentary: "A rock anthem worth pinning.",
      lyricsBody: "We rise, we fall, we rise again",
      createdAt: "2026-01-02T10:01:00.000Z",
      deleted: false,
    },
  ],
  songs: [
    {
      id: "fixture-song-pinned-1",
      messageId: "fixture-msg-pinned-a",
      title: "Pinned Anthem (Take 1)",
      audioUrl: "https://example.com/fixture-pinned-1.mp3",
      pinned: true,
      deleted: false,
      createdAt: "2026-01-02T10:05:00.000Z",
    },
    {
      id: "fixture-song-pinned-2",
      messageId: "fixture-msg-pinned-a",
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
  messages: [
    {
      id: "fixture-msg-nokey-u",
      role: "user",
      content: "Write a jazz piece",
      parentId: null,
      createdAt: "2026-01-03T09:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-msg-nokey-a",
      role: "assistant",
      content: "Notes in the air, keys not there",
      parentId: "fixture-msg-nokey-u",
      title: "Keyless Wonder",
      style: "jazz",
      commentary: "A jazz piece with no API key set.",
      lyricsBody: "Notes in the air, keys not there",
      createdAt: "2026-01-03T09:01:00.000Z",
      deleted: false,
    },
  ],
  songs: [],
};

/**
 * A fixture for the Song Generator page with a conversation and pre-existing songs.
 * The assistant message ("fixture-msg-songs-a") is the source for all songs.
 */
export const songGeneratorFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  messages: [
    {
      id: "fixture-msg-songs-u",
      role: "user",
      content: "Write an indie folk song about lazy Sunday mornings",
      parentId: null,
      createdAt: "2026-01-05T09:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-msg-songs-a",
      role: "assistant",
      content: [
        "Golden light through curtain lace",
        "Coffee cooling in its place",
        "Sunday holds us soft and slow",
        "Nowhere we need to go",
      ].join("\n"),
      parentId: "fixture-msg-songs-u",
      title: "Sunday Gold",
      style: "indie folk",
      commentary: "A warm, reflective song about lazy Sunday mornings.",
      lyricsBody: [
        "Golden light through curtain lace",
        "Coffee cooling in its place",
        "Sunday holds us soft and slow",
        "Nowhere we need to go",
      ].join("\n"),
      duration: 180,
      createdAt: "2026-01-05T09:01:00.000Z",
      deleted: false,
    },
  ],
  songs: [
    {
      id: "fixture-song-gen-1",
      messageId: "fixture-msg-songs-a",
      title: "Sunday Gold (Take 1)",
      audioUrl:
        "https://pfst.cf2.poecdn.net/base/audio/0d80fec33b1948741959d66bafe06da54553bfd28fb6409aac588255cc4f2714",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-05T09:05:00.000Z",
    },
    {
      id: "fixture-song-gen-2",
      messageId: "fixture-msg-songs-a",
      title: "Sunday Gold (Take 2)",
      audioUrl:
        "https://pfst.cf2.poecdn.net/base/audio/0d80fec33b1948741959d66bafe06da54553bfd28fb6409aac588255cc4f2714",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-05T09:06:00.000Z",
    },
    {
      id: "fixture-song-gen-3",
      messageId: "fixture-msg-songs-a",
      title: "Sunday Gold (Take 3)",
      audioUrl:
        "https://pfst.cf2.poecdn.net/base/audio/0d80fec33b1948741959d66bafe06da54553bfd28fb6409aac588255cc4f2714",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-05T09:07:00.000Z",
    },
  ],
};

/**
 * A fixture with a multi-turn chat (3 user/assistant exchanges) forming a
 * linear message tree. Used for: checkpoint navigation, chat history display,
 * LyricsItem card rendering.
 *
 * Tree (root-first):
 *   fixture-multi-msg-1u  (user, parentId: null)
 *   fixture-multi-msg-1a  (assistant: City Pulse, parentId: 1u)
 *   fixture-multi-msg-2u  (user, parentId: 1a)
 *   fixture-multi-msg-2a  (assistant: Dark Frequency, parentId: 2u)
 *   fixture-multi-msg-3u  (user, parentId: 2a)
 *   fixture-multi-msg-3a  (assistant: Neon Rain, parentId: 3u)  ← latest leaf
 */
export const multiMessageFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  messages: [
    {
      id: "fixture-multi-msg-1u",
      role: "user",
      content: "Write a synthwave song about a rainy city night",
      parentId: null,
      createdAt: "2026-01-06T20:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-msg-1a",
      role: "assistant",
      content: [
        "---",
        "title: City Pulse",
        "style: synthwave",
        "commentary: First draft, establishing the mood.",
        "---",
        "Pulse beneath the sodium glow",
        "Rain-slicked streets and radio",
      ].join("\n"),
      parentId: "fixture-multi-msg-1u",
      title: "City Pulse",
      style: "synthwave",
      commentary: "First draft, establishing the mood.",
      lyricsBody: "Pulse beneath the sodium glow\nRain-slicked streets and radio",
      createdAt: "2026-01-06T20:02:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-msg-2u",
      role: "user",
      content: "Make it darker and more cinematic",
      parentId: "fixture-multi-msg-1a",
      createdAt: "2026-01-06T20:05:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-msg-2a",
      role: "assistant",
      content: [
        "---",
        "title: Dark Frequency",
        "style: synthwave, cinematic",
        "commentary: Darker tone, added tension.",
        "---",
        "Shadows bleed through chrome and wire",
        "The city hums its low desire",
      ].join("\n"),
      parentId: "fixture-multi-msg-2u",
      title: "Dark Frequency",
      style: "synthwave, cinematic",
      commentary: "Darker tone, added tension.",
      lyricsBody: "Shadows bleed through chrome and wire\nThe city hums its low desire",
      createdAt: "2026-01-06T20:07:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-msg-3u",
      role: "user",
      content: "Add a neon rain motif throughout",
      parentId: "fixture-multi-msg-2a",
      createdAt: "2026-01-06T20:10:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-msg-3a",
      role: "assistant",
      content: [
        "---",
        "title: Neon Rain",
        "style: synthwave, dark, driving beat",
        "commentary: Third iteration of a city-at-night concept.",
        "---",
        "Neon rain falls on the empty street",
        "Echoes swallowed by the city beat",
        "Headlights blur through the wet black glass",
        "Every moment too electric to last",
      ].join("\n"),
      parentId: "fixture-multi-msg-3u",
      title: "Neon Rain",
      style: "synthwave, dark, driving beat",
      commentary: "Third iteration of a city-at-night concept.",
      lyricsBody: [
        "Neon rain falls on the empty street",
        "Echoes swallowed by the city beat",
        "Headlights blur through the wet black glass",
        "Every moment too electric to last",
      ].join("\n"),
      createdAt: "2026-01-06T20:15:00.000Z",
      deleted: false,
    },
  ],
  songs: [],
};

/**
 * A fixture with a mix of deleted and non-deleted songs on the same message.
 * Used for: soft-delete song flow, confirming deleted songs are hidden.
 */
export const deletedSongFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  messages: [
    {
      id: "fixture-msg-deleted-song-u",
      role: "user",
      content: "Write an ambient electronic piece",
      parentId: null,
      createdAt: "2026-01-07T14:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-msg-deleted-song-a",
      role: "assistant",
      content: "Signal lost in the static haze",
      parentId: "fixture-msg-deleted-song-u",
      title: "Faded Signal",
      style: "ambient electronic",
      commentary: "A drifting ambient piece.",
      lyricsBody: "Signal lost in the static haze",
      createdAt: "2026-01-07T14:01:00.000Z",
      deleted: false,
    },
  ],
  songs: [
    {
      id: "fixture-song-deleted-1",
      messageId: "fixture-msg-deleted-song-a",
      title: "Faded Signal (Take 1)",
      audioUrl: "https://example.com/faded-1.mp3",
      pinned: false,
      deleted: true, // already soft-deleted
      createdAt: "2026-01-07T14:05:00.000Z",
    },
    {
      id: "fixture-song-deleted-2",
      messageId: "fixture-msg-deleted-song-a",
      title: "Faded Signal (Take 2)",
      audioUrl: "https://example.com/faded-2.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-07T14:06:00.000Z",
    },
    {
      id: "fixture-song-deleted-3",
      messageId: "fixture-msg-deleted-song-a",
      title: "Faded Signal (Take 3)",
      audioUrl: "https://example.com/faded-3.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-07T14:07:00.000Z",
    },
  ],
};

/**
 * A comprehensive fixture combining multiple conversations, multi-turn history,
 * pinned songs, deleted songs, and a soft-deleted message.
 * Used for: full-flow MCP QA runs that need realistic mixed state.
 *
 * Conversations:
 *   Tree 1 — Morning Pop (1 user/assistant exchange, pinned + soft-deleted songs)
 *   Tree 2 — Midnight Jazz (2 user/assistant exchanges)
 *   Tree 3 — Deleted Draft (root user message, soft-deleted assistant)
 */
export const fullFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  messages: [
    // Tree 1: Morning Pop
    {
      id: "fixture-full-msg-1u",
      role: "user",
      content: "Write a morning pop song",
      parentId: null,
      createdAt: "2026-01-08T07:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-full-msg-1a",
      role: "assistant",
      content: [
        "---",
        "title: Morning Pop",
        "style: pop, upbeat",
        "commentary: A bright pop song for mornings.",
        "---",
        "Rise and shine, the day is mine",
        "Coffee in hand, feeling fine",
      ].join("\n"),
      parentId: "fixture-full-msg-1u",
      title: "Morning Pop",
      style: "pop, upbeat",
      commentary: "A bright pop song for mornings.",
      lyricsBody: "Rise and shine, the day is mine\nCoffee in hand, feeling fine",
      createdAt: "2026-01-08T07:05:00.000Z",
      deleted: false,
    },
    // Tree 2: Midnight Jazz (2 turns)
    {
      id: "fixture-full-msg-2u",
      role: "user",
      content: "Write a late-night jazz song",
      parentId: null,
      createdAt: "2026-01-08T23:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-full-msg-2a",
      role: "assistant",
      content: [
        "---",
        "title: Midnight Jazz",
        "style: jazz, late night",
        "commentary: Smooth late-night jazz.",
        "---",
        "Notes drift through the smoke and blue",
      ].join("\n"),
      parentId: "fixture-full-msg-2u",
      title: "Midnight Jazz",
      style: "jazz, late night",
      commentary: "Smooth late-night jazz.",
      lyricsBody: "Notes drift through the smoke and blue",
      createdAt: "2026-01-08T23:05:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-full-msg-3u",
      role: "user",
      content: "Add a trumpet solo section",
      parentId: "fixture-full-msg-2a",
      createdAt: "2026-01-08T23:08:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-full-msg-3a",
      role: "assistant",
      content: [
        "---",
        "title: Midnight Jazz",
        "style: jazz, late night, trumpet",
        "commentary: Added trumpet solo bridge.",
        "---",
        "Notes drift through the smoke and blue",
        "[Trumpet Solo]",
        "High and lonesome, cutting through",
      ].join("\n"),
      parentId: "fixture-full-msg-3u",
      title: "Midnight Jazz",
      style: "jazz, late night, trumpet",
      commentary: "Added trumpet solo bridge.",
      lyricsBody:
        "Notes drift through the smoke and blue\n[Trumpet Solo]\nHigh and lonesome, cutting through",
      createdAt: "2026-01-08T23:10:00.000Z",
      deleted: false,
    },
    // Tree 3: Deleted Draft (soft-deleted assistant message)
    {
      id: "fixture-full-msg-4u",
      role: "user",
      content: "Write a rock draft",
      parentId: null,
      createdAt: "2026-01-08T12:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-full-msg-4a",
      role: "assistant",
      content: "Riff that never made it out",
      parentId: "fixture-full-msg-4u",
      title: "Deleted Draft",
      style: "rock",
      commentary: "A scrapped draft.",
      lyricsBody: "Riff that never made it out",
      createdAt: "2026-01-08T12:01:00.000Z",
      deleted: true,
    },
  ],
  songs: [
    {
      id: "fixture-full-song-1",
      messageId: "fixture-full-msg-1a",
      title: "Morning Pop (Take 1)",
      audioUrl: "https://example.com/morning-pop-1.mp3",
      pinned: true,
      deleted: false,
      createdAt: "2026-01-08T07:10:00.000Z",
    },
    {
      id: "fixture-full-song-2",
      messageId: "fixture-full-msg-1a",
      title: "Morning Pop (Take 2)",
      audioUrl: "https://example.com/morning-pop-2.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-08T07:11:00.000Z",
    },
    {
      id: "fixture-full-song-3",
      messageId: "fixture-full-msg-1a",
      title: "Morning Pop (Take 3)",
      audioUrl: "https://example.com/morning-pop-3.mp3",
      pinned: false,
      deleted: true, // soft-deleted
      createdAt: "2026-01-08T07:12:00.000Z",
    },
    {
      id: "fixture-full-song-4",
      messageId: "fixture-full-msg-3a",
      title: "Midnight Jazz (Take 1)",
      audioUrl: "https://example.com/midnight-jazz-1.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-08T23:15:00.000Z",
    },
  ],
};

/**
 * A fixture with multiple independent conversations (assistant messages),
 * for testing the Lyrics List page. Includes a soft-deleted entry.
 *
 * Song counts (non-deleted):
 *   Morning Pop (fixture-multi-entry-1a) → 2 songs
 *   Midnight Jazz (fixture-multi-entry-2a) → 0 songs
 *   Deleted Entry (fixture-multi-entry-3a) → soft-deleted message; not shown
 */
export const multiEntryFixture: StorageExport = {
  settings: {
    poeApiKey: "test-poe-api-key",
    numSongs: 3,
  },
  messages: [
    // Conversation 1: Morning Pop
    {
      id: "fixture-multi-entry-1u",
      role: "user",
      content: "Write a pop song for the morning",
      parentId: null,
      createdAt: "2026-01-04T07:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-entry-1a",
      role: "assistant",
      content: "Rise and shine, the day is mine",
      parentId: "fixture-multi-entry-1u",
      title: "Morning Pop",
      style: "pop",
      commentary: "A pop song for the morning.",
      lyricsBody: "Rise and shine, the day is mine",
      createdAt: "2026-01-04T07:01:00.000Z",
      deleted: false,
    },
    // Conversation 2: Midnight Jazz
    {
      id: "fixture-multi-entry-2u",
      role: "user",
      content: "Write a jazz tune for late nights",
      parentId: null,
      createdAt: "2026-01-04T23:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-entry-2a",
      role: "assistant",
      content: "Smooth notes drift through the dark",
      parentId: "fixture-multi-entry-2u",
      title: "Midnight Jazz",
      style: "jazz",
      commentary: "A jazz tune for late nights.",
      lyricsBody: "Smooth notes drift through the dark",
      createdAt: "2026-01-04T23:01:00.000Z",
      deleted: false,
    },
    // Conversation 3: Deleted Entry
    {
      id: "fixture-multi-entry-3u",
      role: "user",
      content: "Write a blues song",
      parentId: null,
      createdAt: "2026-01-04T12:00:00.000Z",
      deleted: false,
    },
    {
      id: "fixture-multi-entry-3a",
      role: "assistant",
      content: "Gone but not forgotten",
      parentId: "fixture-multi-entry-3u",
      title: "Deleted Entry",
      style: "blues",
      commentary: "This entry was soft-deleted.",
      lyricsBody: "Gone but not forgotten",
      createdAt: "2026-01-04T12:01:00.000Z",
      deleted: true,
    },
  ],
  songs: [
    // 2 non-deleted songs for Morning Pop
    {
      id: "fixture-multi-entry-song-1",
      messageId: "fixture-multi-entry-1a",
      title: "Morning Pop (Take 1)",
      audioUrl: "https://example.com/morning-pop-1.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-04T07:10:00.000Z",
    },
    {
      id: "fixture-multi-entry-song-2",
      messageId: "fixture-multi-entry-1a",
      title: "Morning Pop (Take 2)",
      audioUrl: "https://example.com/morning-pop-2.mp3",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-04T07:11:00.000Z",
    },
    // 1 soft-deleted song for Morning Pop (should NOT count)
    {
      id: "fixture-multi-entry-song-3",
      messageId: "fixture-multi-entry-1a",
      title: "Morning Pop (Take 3)",
      audioUrl: "https://example.com/morning-pop-3.mp3",
      pinned: false,
      deleted: true,
      createdAt: "2026-01-04T07:12:00.000Z",
    },
  ],
};

// ─── Image Fixtures ───────────────────────────────────────────────────────────

/**
 * Base image fixture: one session, one generation (stepId 1), three ImageItems.
 * Suitable for most image feature tests where a single generation step is enough.
 *
 * Session:    fixture-img-session-1
 * Generation: fixture-img-gen-1  (stepId 1, prompt: serene Japanese garden)
 * Items:      fixture-img-item-1, fixture-img-item-2, fixture-img-item-3
 */
export const imageBaseFixture: ImageStorageExport = {
  sessions: [
    {
      id: "fixture-img-session-1",
      title: "A serene Japanese garden with a koi pond at golden hour",
      createdAt: "2026-01-10T10:00:00.000Z",
    },
  ],
  generations: [
    {
      id: "fixture-img-gen-1",
      sessionId: "fixture-img-session-1",
      stepId: 1,
      prompt:
        "A serene Japanese garden with a koi pond at golden hour, photorealistic",
      createdAt: "2026-01-10T10:01:00.000Z",
    },
  ],
  items: [
    {
      id: "fixture-img-item-1",
      generationId: "fixture-img-gen-1",
      url: "https://pfst.cf2.poecdn.net/base/image/3b4ad274cac34e532177281ef1458c2dbf7f8cf20b8f2c7cd909676760d6f079?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-10T10:01:05.000Z",
    },
    {
      id: "fixture-img-item-2",
      generationId: "fixture-img-gen-1",
      url: "https://pfst.cf2.poecdn.net/base/image/4a551708e0721d7c17e2d1978723751dc60851626136e7635441fb46a513782a?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-10T10:01:06.000Z",
    },
    {
      id: "fixture-img-item-3",
      generationId: "fixture-img-gen-1",
      url: "https://pfst.cf2.poecdn.net/base/image/b57fc2f73d659aa13f3f0b9cebd5343ec1d1e99fed8ad3955631bb5be0c7e6b2?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-10T10:01:07.000Z",
    },
  ],
  settings: {
    numImages: 3,
  },
};

/**
 * Pinned image fixture: one session, one generation, one pinned ImageItem.
 * Used for testing the Pinned Images page and pin/unpin actions.
 *
 * Session:    fixture-img-pinned-session-1
 * Generation: fixture-img-pinned-gen-1  (stepId 1, prompt: vintage acoustic guitar)
 * Items:      fixture-img-pinned-item-1 (pinned: true)
 */
export const imagePinnedFixture: ImageStorageExport = {
  sessions: [
    {
      id: "fixture-img-pinned-session-1",
      title: "Vintage acoustic guitar leaning against a brick wall",
      createdAt: "2026-01-11T14:00:00.000Z",
    },
  ],
  generations: [
    {
      id: "fixture-img-pinned-gen-1",
      sessionId: "fixture-img-pinned-session-1",
      stepId: 1,
      prompt:
        "Vintage acoustic guitar leaning against a brick wall, dramatic studio lighting",
      createdAt: "2026-01-11T14:01:00.000Z",
    },
  ],
  items: [
    {
      id: "fixture-img-pinned-item-1",
      generationId: "fixture-img-pinned-gen-1",
      url: "https://pfst.cf2.poecdn.net/base/image/a8b6589b3a89a746bffd7a48afe5587953e16380dc82a712eb05f20149d7121c?w=1024&h=1024",
      pinned: true,
      deleted: false,
      createdAt: "2026-01-11T14:01:05.000Z",
    },
  ],
  settings: {
    numImages: 3,
  },
};

/**
 * Multi-step image fixture: one session, two generations (stepId 1 and 2),
 * six ImageItems (three per step). Used for testing thumbnail panel grouping,
 * main-pane latest-step rendering, and screenshot baselines.
 *
 * Session:      fixture-img-multi-session-1
 * Generation 1: fixture-img-multi-gen-1  (stepId 1, prompt: northern lights)
 * Generation 2: fixture-img-multi-gen-2  (stepId 2, prompt: northern lights, wider angle)
 * Items step 1: fixture-img-multi-item-1 … fixture-img-multi-item-3
 * Items step 2: fixture-img-multi-item-4 … fixture-img-multi-item-6
 */
export const imageMultiStepFixture: ImageStorageExport = {
  sessions: [
    {
      id: "fixture-img-multi-session-1",
      title: "Northern lights dancing over a snow-covered mountain lake",
      createdAt: "2026-01-12T20:00:00.000Z",
    },
  ],
  generations: [
    {
      id: "fixture-img-multi-gen-1",
      sessionId: "fixture-img-multi-session-1",
      stepId: 1,
      prompt:
        "Northern lights dancing over a snow-covered mountain lake, long exposure",
      createdAt: "2026-01-12T20:01:00.000Z",
    },
    {
      id: "fixture-img-multi-gen-2",
      sessionId: "fixture-img-multi-session-1",
      stepId: 2,
      prompt:
        "Northern lights dancing over a snow-covered mountain lake, wider angle, more vivid colors",
      createdAt: "2026-01-12T20:05:00.000Z",
    },
  ],
  items: [
    // Step 1 items
    {
      id: "fixture-img-multi-item-1",
      generationId: "fixture-img-multi-gen-1",
      url: "https://pfst.cf2.poecdn.net/base/image/131abd51bd2db2a860872cc2924e29d254c7b0b1ef623d1196da62e9d930355f?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-12T20:01:05.000Z",
    },
    {
      id: "fixture-img-multi-item-2",
      generationId: "fixture-img-multi-gen-1",
      url: "https://pfst.cf2.poecdn.net/base/image/2f6b9ec916b01eabb7a41a40559777a91f563f61a9caafac57f0fdc427b44989?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-12T20:01:06.000Z",
    },
    {
      id: "fixture-img-multi-item-3",
      generationId: "fixture-img-multi-gen-1",
      url: "https://pfst.cf2.poecdn.net/base/image/6ba8260f4e968b45cb9aadc1e356aa6e17c3993dd44d8610a83279272e4dc689?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-12T20:01:07.000Z",
    },
    // Step 2 items
    {
      id: "fixture-img-multi-item-4",
      generationId: "fixture-img-multi-gen-2",
      url: "https://pfst.cf2.poecdn.net/base/image/7d96f65044460ff04f2755da74da4deeba193f9ca63ad993f8eacb1e472fd5d6?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-12T20:05:05.000Z",
    },
    {
      id: "fixture-img-multi-item-5",
      generationId: "fixture-img-multi-gen-2",
      url: "https://pfst.cf2.poecdn.net/base/image/408da1759d500a53db32a931daf4c6a3397a4fd3aa2379866c45288d51f3b27e?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-12T20:05:06.000Z",
    },
    {
      id: "fixture-img-multi-item-6",
      generationId: "fixture-img-multi-gen-2",
      url: "https://pfst.cf2.poecdn.net/base/image/276aa5bd8a7a47f0d928a481f92d2c812fc049ae0f8d41b2181f20ecb9e34a49?w=1024&h=1024",
      pinned: false,
      deleted: false,
      createdAt: "2026-01-12T20:05:07.000Z",
    },
  ],
  settings: {
    numImages: 3,
  },
};
