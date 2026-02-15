/**
 * Generates image fixture URLs by calling the Poe nano-banana model.
 * Reads POE_API_KEY from .env and writes results to
 * src/music/lib/llm/fixtures/image-fixtures.json
 *
 * Usage: node scripts/generate-image-fixtures.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Read .env ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(ROOT, ".env");
  const raw = readFileSync(envPath, "utf-8");
  const vars = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

const env = loadEnv();
const API_KEY = env.POE_API_KEY;
if (!API_KEY) {
  console.error("POE_API_KEY not found in .env");
  process.exit(1);
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const PROMPTS = [
  "A serene Japanese garden with a koi pond at golden hour, photorealistic",
  "Futuristic city skyline at night with neon reflections in rain-soaked streets, cinematic",
  "Close-up of vintage vinyl record with warm bokeh background, shallow depth of field",
  "Abstract geometric composition in deep blue and gold, minimalist digital art",
  "Cozy coffee shop interior, steam rising from cups, warm amber lighting",
  "Northern lights dancing over a snow-covered mountain lake, long exposure",
  "Vintage acoustic guitar leaning against a brick wall, dramatic studio lighting",
  "Minimalist desert landscape at dusk, long shadows, wide angle",
  "Dense misty forest with sun rays filtering through ancient trees",
  "Ocean waves crashing on black volcanic rocks at sunrise, high contrast",
  "Studio condenser microphone with bokeh city lights background, warm cinematic tones",
  "Cosmic nebula in vivid purples and blues with star clusters, space photography",
];

// ─── Client ───────────────────────────────────────────────────────────────────

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://api.poe.com/v1",
  fetch: (url, init) => {
    const headers = new Headers(init?.headers);
    for (const key of [...headers.keys()]) {
      if (key.startsWith("x-stainless-")) headers.delete(key);
    }
    return globalThis.fetch(url, { ...init, headers });
  },
});

// ─── Generate ─────────────────────────────────────────────────────────────────

/**
 * The Poe API returns image URLs wrapped in markdown: ![image](url)\n\nurl
 * Extract just the plain HTTPS URL.
 */
function extractUrl(content) {
  const match = content?.match(/!\[image\]\((https?:\/\/[^)]+)\)/);
  if (match) return match[1];
  const lines = (content ?? "").split("\n").filter((l) => l.trim().startsWith("http"));
  return lines[lines.length - 1]?.trim() ?? content;
}

async function generateOne(prompt, index) {
  console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt.slice(0, 60)}..."`);
  const response = await client.chat.completions.create({
    model: "nano-banana",
    messages: [{ role: "user", content: prompt }],
    // @ts-ignore
    extra_body: { image_only: true },
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error(`Empty response for prompt: ${prompt}`);
  const url = extractUrl(raw);
  console.log(`  -> ${url.slice(0, 80)}...`);
  return { prompt, url };
}

async function main() {
  const results = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    try {
      const result = await generateOne(PROMPTS[i], i);
      results.push(result);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      results.push({ prompt: PROMPTS[i], url: null, error: err.message });
    }
    // Small delay to avoid rate limiting
    if (i < PROMPTS.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // ─── Write fixtures ────────────────────────────────────────────────────────

  const successful = results.filter((r) => r.url !== null);
  const failed = results.filter((r) => r.url === null);

  console.log(`\nGenerated ${successful.length}/${PROMPTS.length} images.`);
  if (failed.length > 0) {
    console.warn(`Failed prompts:`);
    failed.forEach((f) => console.warn(`  - ${f.prompt}: ${f.error}`));
  }

  const outDir = join(ROOT, "src/music/lib/llm/fixtures");
  mkdirSync(outDir, { recursive: true });

  // Full data file (prompts + URLs) for reference
  const fullPath = join(outDir, "image-fixtures.json");
  writeFileSync(fullPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote full fixtures to: ${fullPath}`);

  // URL-only file for MockLLMClient (flat array of URLs)
  const urls = successful.map((r) => r.url);
  const urlsPath = join(outDir, "image-urls.json");
  writeFileSync(urlsPath, JSON.stringify(urls, null, 2));
  console.log(`Wrote ${urls.length} URLs to: ${urlsPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
