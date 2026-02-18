# AI Studio — Spec

## Overview

A client-side web app for generating song lyrics and audio. Built with React and TypeScript. All data is persisted in local storage — no backend required. Deployable to GitHub Pages (`https://kamilio.github.io/ai-studio/`).

---

## Navigation

A persistent left sidebar with icons and labels linking to:

1. Lyrics Generator (current session)
2. Lyrics List
3. Song Generator
4. Pinned Songs
5. Settings

---

## Pages

### 1. Lyrics Generator

The main workspace for writing and iterating on lyrics.

**Layout:**

- **Left panel** — displays the current lyrics in frontmatter format (see below)
- **Right panel** — chat interface for iterating with Claude

**Behavior:**

- The user describes the song or gives feedback in the chat
- Claude (latest available model) responds with updated lyrics
- The conversation thread is maintained and persisted
- Output format is frontmatter-style: a YAML header with metadata, followed by the lyrics body
- A **"Generate Songs"** button at the bottom opens the Song Generator in the context of the current lyrics entry

**Frontmatter metadata fields (at minimum):**

- `title`
- `style` — genre, mood, instrumentation hints
- `commentary` — Claude's notes on the lyrics

---

### 2. Song Generator (ElevenLabs)

A one-off generation page — no chat. Takes the lyrics and metadata from the currently open lyrics entry and generates audio.

**Layout:**

- **Left panel** — list of generated songs, each with an MP3 player

**Behavior:**

- Always operates on the currently open lyrics entry
- Pulls all metadata from the lyrics frontmatter automatically
- Generates N songs in parallel (default: 3, configurable in Settings)
- ElevenLabs returns a URL per song; the app uses that URL for playback and download
- Song titles are generated from the lyrics metadata
- Songs are stored per lyrics entry

Both APIs are accessed via Poe's OpenAI-compatible endpoint using a single `POE_API_KEY`.

**ElevenLabs (song generation):**

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: POE_API_KEY,
  baseURL: "https://api.poe.com/v1",
  dangerouslyAllowBrowser: true,
});

const response = await client.chat.completions.create({
  model: "elevenlabs-music",
  messages: [{ role: "user", content: stylePrompt }],
  extra_body: { music_length_ms: 300000 },
});
// response.choices[0].message.content contains the audio URL
```

**Claude (lyrics generation):**

```typescript
const response = await client.chat.completions.create({
  model: "claude-sonnet-4.5",  // or latest available via Poe
  messages: conversationHistory,
});
```

**Per-song actions:**

- **Play** — inline MP3 player
- **Pin** — marks the song as pinned; pinned songs appear in the Pinned Songs view
- **Delete** — soft delete only (marked as deleted, not removed from storage)
- **Download** — fetches the audio from the URL and triggers the browser's save dialog

---

### 3. Lyrics List

A table view of all saved lyrics sessions.

- Simple text search over title and style fields
- Shows metadata (title, style, etc.) — not the full lyrics body
- Maintains and displays the full chat history per entry
- Clicking an entry opens it in the Lyrics Generator
- Each entry can be soft-deleted (marked as deleted, not removed from storage)
- **"New Lyrics"** button in the header creates a blank lyrics entry and opens the Lyrics Generator

---

### 4. Pinned Songs

A view of all pinned songs with their associated metadata.

**Per-song actions:**

- **Play** — inline MP3 player
- **Unpin** — removes the pin
- **Download** — triggers the browser's save dialog

---

### 5. Settings

- Number of songs to generate (default: 3)
- `POE_API_KEY` — single key used for both Claude and ElevenLabs via Poe
- Import / Export local storage data — calls `storageService.import()` / `storageService.export()`
  - Export includes a checkbox: **"Include API keys in export"** (opt-in)

---

## API Keys — First-Use Flow

If `POE_API_KEY` is missing when the user triggers any generation action, show a blocking modal directing them to Settings to add the key. No separate onboarding screen.

---

## Technical Stack

| Concern | Choice |
| --- | --- |
| Framework | React + TypeScript + Vite |
| UI library | shadcn/ui |
| State / persistence | Local storage only |
| API gateway | Poe (`https://api.poe.com/v1`) with `POE_API_KEY` |
| LLM abstraction | `LLMClient` interface — `PoeLLMClient` (real) or `MockLLMClient` (fixtures) |
| LLM | Claude via Poe (OpenAI-compatible) |
| Audio generation | ElevenLabs (`elevenlabs-music`) via Poe |
| Deployment | GitHub Pages via GitHub Actions (build artifacts never committed to main) |

---

## LLM Client Abstraction

All LLM access goes through a typed `LLMClient` interface. A factory function returns the appropriate implementation based on the `VITE_USE_MOCK_LLM` environment variable.

```
src/lib/llm/
  types.ts            — LLMClient interface: chat() and generateSong()
  poe-client.ts       — PoeLLMClient: wraps OpenAI SDK with Poe baseURL
  mock-client.ts      — MockLLMClient: replays committed fixture files with a simulated delay
  factory.ts          — createLLMClient(): returns mock or real based on VITE_USE_MOCK_LLM
  fixtures/
    lyrics-response.txt   — recorded Claude response (valid frontmatter + lyrics body)
    song-response.json    — recorded ElevenLabs response { audioUrl: "..." }
```

Fixtures are pre-recorded real API responses. To regenerate them:

```
POE_API_KEY=xxx npm run generate:fixtures
```

Commit the output files. `MockLLMClient` replays them in all non-production contexts.

---

## Dev Tooling

```
npm run dev                 # start dev server (real Poe API)
npm run dev:mock            # start dev server with mock LLM (no API key needed)
npm run build               # production build (always uses real LLM client)
npm start                   # serve production build locally
npm test                    # run Playwright tests (always uses mock LLM)
npm run screenshot:<page>   # screenshot test for a specific page
npm run generate:fixtures   # record real API responses into src/lib/llm/fixtures/
```

---

## Build Order

Stories are implemented in this sequence:

1. Project scaffold
2. Data models + localStorage service (including `storageService.import` / `storageService.export`)
3. Integration test infrastructure
4. LLM client abstraction + mock provider
5. Feature by feature — each story ships with its own Playwright tests and quality gate run

---

## Testing

- **End-to-end tests with Playwright** — TDD approach; tests are written as part of each feature story, not batched at the end
- **Mock LLM always**: `npm run test` starts the dev server with `VITE_USE_MOCK_LLM=true`; no live API calls are made during testing or Playwright MCP QA
- **State seeding**: tests seed localStorage by calling `storageService.import(fixture)` via `page.evaluate` — the same function the Settings import UI calls, so test state flows through real app code
- Selector priority: accessibility selectors first; add `data-testid` attributes where no accessible selector is available
- **Screenshot tests**: for each page, seed local storage with fixture data via `storageService.import`, render the page, and capture a screenshot to verify visual design
  - One screenshot script per page: `npm run screenshot:<page>`
- **Quality gates** run at the end of every story: `npm run lint`, `npm run test`, `npm run build`, Playwright MCP QA

---

## Data Model Notes

- Songs are stored per lyrics entry
- Nothing is hard-deleted; deletions are soft (flagged in storage)
- ElevenLabs audio URLs are used directly for playback; the user downloads songs they want to keep
- Import/export logic lives in `storageService`; the Settings page is only the UI
- API keys are excluded from export by default (opt-in checkbox to include)
