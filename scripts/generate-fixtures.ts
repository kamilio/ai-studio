#!/usr/bin/env tsx
/**
 * Generates mock fixture files by making one real call to each API.
 * Commit the output files — MockLLMClient will replay them in tests.
 *
 * Usage:
 *   POE_API_KEY=xxx npm run generate:fixtures
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, "../src/lib/llm/fixtures");

const POE_API_KEY = process.env.POE_API_KEY;
if (!POE_API_KEY) {
  console.error("Error: POE_API_KEY environment variable is required");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: POE_API_KEY,
  baseURL: "https://api.poe.com/v1",
});

const SEED_PROMPT = `Write a short, catchy pop song about the feeling of a perfect Sunday morning. \
Return ONLY the song in this exact frontmatter format — no extra commentary outside the format:

---
title: "<song title>"
style: "<genre, mood, and instrumentation hints — e.g. indie pop, warm acoustic guitar, dreamy vocals>"
commentary: "<2–3 sentences: your notes on the creative choices, mood, and what makes this work>"
---

<lyrics body here>`;

async function generateLyricsFixture(): Promise<string> {
  console.log("Calling Claude for lyrics fixture...");
  const response = await client.chat.completions.create({
    model: "claude-sonnet-4.5",
    messages: [{ role: "user", content: SEED_PROMPT }],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Claude returned an empty response");
  return content;
}

async function generateSongFixture(lyricsContent: string): Promise<{ audioUrl: string }> {
  console.log("Calling ElevenLabs for song fixture (may take ~30s)...");

  const titleMatch = lyricsContent.match(/title:\s*"([^"]+)"/);
  const styleMatch = lyricsContent.match(/style:\s*"([^"]+)"/);
  const bodyMatch = lyricsContent.match(/---[\s\S]*?---\n([\s\S]*)/);

  const title = titleMatch?.[1] ?? "Sunday Morning";
  const style = styleMatch?.[1] ?? "indie pop, warm acoustic guitar";
  const body = bodyMatch?.[1]?.trim() ?? "";

  const stylePrompt = `${title}\n\n${style}\n\n${body}`;

  const response = await client.chat.completions.create({
    model: "elevenlabs-music",
    messages: [{ role: "user", content: stylePrompt }],
    // @ts-expect-error extra_body is a Poe-specific extension
    extra_body: { music_length_ms: 30000 },
  });

  const audioUrl = response.choices[0]?.message?.content;
  if (!audioUrl) throw new Error("ElevenLabs returned an empty response");
  return { audioUrl };
}

async function main() {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  const lyricsContent = await generateLyricsFixture();
  console.log("  ✓ Lyrics received\n");
  console.log(lyricsContent);
  console.log();

  const lyricsPath = path.join(FIXTURES_DIR, "lyrics-response.txt");
  fs.writeFileSync(lyricsPath, lyricsContent, "utf-8");
  console.log(`  ✓ Saved ${path.relative(process.cwd(), lyricsPath)}`);

  const songResponse = await generateSongFixture(lyricsContent);
  console.log("  ✓ Song received");
  console.log(`  Audio URL: ${songResponse.audioUrl}\n`);

  const songPath = path.join(FIXTURES_DIR, "song-response.json");
  fs.writeFileSync(songPath, JSON.stringify(songResponse, null, 2) + "\n", "utf-8");
  console.log(`  ✓ Saved ${path.relative(process.cwd(), songPath)}`);

  console.log("\nDone. Commit both fixture files and they will be used by MockLLMClient.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
