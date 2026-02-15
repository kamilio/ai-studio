/**
 * SongGenerator page (US-011).
 *
 * Reads the `?entryId=` query parameter to determine which lyrics entry is
 * currently open. Triggers N parallel calls to llmClient.generateSong() where
 * N comes from settings.numSongs (default 3). Each call receives a style
 * prompt derived from the entry's frontmatter fields. Generated songs are
 * persisted to localStorage via storageService.createSong() and rendered as
 * list items with an inline HTML5 audio player.
 *
 * A per-song loading indicator is shown while each request is in flight, so
 * the user sees N skeleton rows immediately after clicking "Generate Songs".
 *
 * The API key guard (useApiKeyGuard) blocks generation when no key is set,
 * matching the behaviour of the Lyrics Generator chat panel (US-007).
 */

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiKeyMissingModal } from "@/components/ApiKeyMissingModal";
import { useApiKeyGuard } from "@/hooks/useApiKeyGuard";
import {
  getLyricsEntry,
  getSettings,
  getSongsByLyricsEntry,
  createSong,
} from "@/lib/storage/storageService";
import type { LyricsEntry, Song } from "@/lib/storage/types";
import { createLLMClient } from "@/lib/llm/factory";

/** Build the style prompt sent to ElevenLabs from a lyrics entry's frontmatter. */
function buildStylePrompt(entry: LyricsEntry): string {
  const parts: string[] = [];
  if (entry.title) parts.push(`Title: ${entry.title}`);
  if (entry.style) parts.push(`Style: ${entry.style}`);
  if (entry.commentary) parts.push(`Commentary: ${entry.commentary}`);
  if (entry.body) parts.push(`\nLyrics:\n${entry.body}`);
  return parts.join("\n");
}

/** State for a single in-progress or completed song generation slot. */
interface SongSlot {
  /** Slot index (0-based). Used as a stable React key while loading. */
  index: number;
  /** Whether this slot is still awaiting a response. */
  loading: boolean;
  /** The persisted Song record once the response arrives; null while loading. */
  song: Song | null;
  /** Error message if generation failed for this slot. */
  error: string | null;
}

export default function SongGenerator() {
  const [searchParams] = useSearchParams();
  const entryId = searchParams.get("entryId");

  const { isModalOpen, guardAction, closeModal } = useApiKeyGuard();

  // Derive entry from storage on every render; re-derives when entryId changes.
  const entry = useMemo(
    () => (entryId ? getLyricsEntry(entryId) : null),
    [entryId]
  );

  // Persisted songs from storage (baseline for this entry).
  const storedSongs = useMemo(
    () =>
      entryId
        ? getSongsByLyricsEntry(entryId).filter((s) => !s.deleted)
        : [],
    [entryId]
  );

  // Songs added during the current page session (before a reload).
  const [newSongs, setNewSongs] = useState<Song[]>([]);

  const [slots, setSlots] = useState<SongSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // All songs to display: stored baseline + new songs added this session.
  const songs = useMemo(() => {
    const storedIds = new Set(storedSongs.map((s) => s.id));
    const uniqueNew = newSongs.filter((s) => !storedIds.has(s.id));
    return [...storedSongs, ...uniqueNew];
  }, [storedSongs, newSongs]);

  const handleGenerate = useCallback(async () => {
    // API key guard must run first so the modal appears even without an entry.
    if (!guardAction()) return;
    if (isGenerating) return;
    if (!entryId || !entry) return;

    const settings = getSettings();
    const n = settings?.numSongs ?? 3;
    const prompt = buildStylePrompt(entry);

    // Build N loading slots immediately so the UI shows placeholders.
    const initialSlots: SongSlot[] = Array.from({ length: n }, (_, i) => ({
      index: i,
      loading: true,
      song: null,
      error: null,
    }));
    setSlots(initialSlots);
    setIsGenerating(true);

    const client = createLLMClient(settings?.poeApiKey ?? undefined);

    // Launch N concurrent generation requests.
    const promises = Array.from({ length: n }, async (_, i) => {
      try {
        const audioUrl = await client.generateSong(prompt);
        const songNumber = i + 1;
        const song = createSong({
          lyricsEntryId: entryId,
          title: `${entry.title || "Song"} (Take ${songNumber})`,
          audioUrl,
        });

        setSlots((prev) =>
          prev.map((slot) =>
            slot.index === i
              ? { ...slot, loading: false, song, error: null }
              : slot
          )
        );
        setNewSongs((prev) => [...prev, song]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        setSlots((prev) =>
          prev.map((slot) =>
            slot.index === i
              ? { ...slot, loading: false, song: null, error: message }
              : slot
          )
        );
      }
    });

    await Promise.allSettled(promises);
    setIsGenerating(false);
    // Clear slots now that all have resolved; the persisted songs list shows the results.
    setSlots([]);
  }, [entryId, entry, isGenerating, guardAction]);

  // Songs being shown in active slots (not yet moved to the persisted list).
  const slotSongIds = new Set(
    slots.filter((s) => s.song !== null).map((s) => s.song!.id)
  );
  // Songs to show in the static list (excludes those currently in active slots).
  const listedSongs = songs.filter((s) => !slotSongIds.has(s.id));

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold">Song Generator</h1>
      <p className="text-muted-foreground mt-2">
        Generate audio from your lyrics using ElevenLabs.
      </p>

      {/* Entry info */}
      {entry ? (
        <div className="mt-4 rounded-md bg-muted p-4 text-sm font-mono" data-testid="song-entry-info">
          <p>
            <span className="text-muted-foreground">title:</span>{" "}
            <span data-testid="song-entry-title">{entry.title}</span>
          </p>
          <p>
            <span className="text-muted-foreground">style:</span>{" "}
            <span data-testid="song-entry-style">{entry.style}</span>
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="no-entry-message">
          {entryId
            ? "Lyrics entry not found."
            : "No lyrics entry selected. Open a lyrics entry and click \"Generate Songs\"."}
        </p>
      )}

      {/* Generate button */}
      <div className="mt-6">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          data-testid="generate-songs-btn"
        >
          {isGenerating ? "Generating…" : "Generate Songs"}
        </Button>
      </div>

      {/* In-progress slots (shown during generation) */}
      {slots.length > 0 && (
        <div className="mt-6 space-y-4" data-testid="song-slots">
          {slots.map((slot) => (
            <div
              key={slot.index}
              className="rounded-md border p-4"
              data-testid={`song-slot-${slot.index}`}
            >
              {slot.loading ? (
                <div
                  className="animate-pulse text-sm text-muted-foreground"
                  data-testid={`song-loading-${slot.index}`}
                  aria-label={`Generating song ${slot.index + 1}…`}
                >
                  Generating song {slot.index + 1}…
                </div>
              ) : slot.error ? (
                <p className="text-sm text-destructive" data-testid={`song-error-${slot.index}`}>
                  Error: {slot.error}
                </p>
              ) : slot.song ? (
                <SongItem song={slot.song} />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Pre-existing + newly generated songs (after slots clear) */}
      {listedSongs.length > 0 && (
        <div className="mt-6 space-y-4" data-testid="song-list">
          {listedSongs.map((song) => (
            <div
              key={song.id}
              className="rounded-md border p-4"
              data-testid="song-item"
            >
              <SongItem song={song} />
            </div>
          ))}
        </div>
      )}

      {isModalOpen && <ApiKeyMissingModal onClose={closeModal} />}
    </div>
  );
}

/** Renders a single song with its title and an inline HTML5 audio player. */
function SongItem({ song }: { song: Song }) {
  return (
    <>
      <p className="font-medium text-sm mb-2" data-testid="song-title">
        {song.title}
      </p>
      <audio
        controls
        src={song.audioUrl}
        className="w-full"
        data-testid="song-audio"
      />
    </>
  );
}
