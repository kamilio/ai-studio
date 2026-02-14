import type { LLMClient, ChatMessage } from "./types";
// Vite inlines these fixture files as strings at build time via the `?raw` suffix.
import lyricsFixture from "./fixtures/lyrics-response.txt?raw";
import songFixtureRaw from "./fixtures/song-response.json?raw";

/**
 * Fixture-based LLM client used in tests and offline development.
 * Reads pre-recorded responses from committed fixture files and adds a
 * configurable simulated delay to mimic real latency.
 *
 * Activated when VITE_USE_MOCK_LLM=true (set automatically by the
 * Playwright webServer config and `npm run dev:mock`).
 */
export class MockLLMClient implements LLMClient {
  /** Simulated latency in milliseconds (default 200 ms). */
  private readonly delayMs: number;

  constructor(delayMs = 200) {
    this.delayMs = delayMs;
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chat(_messages: ChatMessage[]): Promise<string> {
    await this.delay();
    return lyricsFixture;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateSong(_prompt: string): Promise<string> {
    await this.delay();
    const parsed = JSON.parse(songFixtureRaw) as { audioUrl: string };
    return parsed.audioUrl;
  }
}
