/**
 * Lyrics List page (US-009, US-019).
 *
 * Displays all non-deleted assistant messages (lyrics versions) in a searchable,
 * sortable card grid. Users can:
 *  - Search by title or style (real-time filter)
 *  - Sort by newest first, oldest first, most generated, or most pinned
 *  - Click a card to open the Lyrics Generator for that message
 *  - Click "New" to navigate to /music (new lyrics flow)
 *  - Soft-delete a message (sets deleted=true, hides from grid)
 *
 * Sort options:
 *  - Newest first: descending createdAt
 *  - Oldest first: ascending createdAt
 *  - Most generated: descending count of non-deleted songs per message
 *  - Most pinned: descending count of pinned non-deleted songs per message
 *
 * Sort combines with the existing title/style search filter.
 */

import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { LyricsItemCard } from "@/music/components/LyricsItemCard";
import {
  getMessages,
  getSongs,
  updateMessage,
} from "@/music/lib/storage/storageService";
import type { Message } from "@/music/lib/storage/types";

type SortOption = "newest" | "oldest" | "most-generated" | "most-pinned";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "most-generated": "Most generated",
  "most-pinned": "Most pinned",
};

export default function LyricsList() {
  const navigate = useNavigate();

  // Only show non-deleted assistant messages (which carry lyrics fields).
  const [allEntries, setAllEntries] = React.useState<Message[]>(
    () => getMessages().filter((m) => m.role === "assistant" && !m.deleted)
  );
  const [search, setSearch] = React.useState("");
  const [sortOption, setSortOption] = React.useState<SortOption>("newest");
  // ID of the lyrics entry pending deletion confirmation; null when no dialog is open.
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  function reloadEntries() {
    setAllEntries(getMessages().filter((m) => m.role === "assistant" && !m.deleted));
  }

  // Build song count maps once per render for efficient sort lookups.
  const songCountMap = useMemo(() => {
    const allSongs = getSongs().filter((s) => !s.deleted);
    const counts = new Map<string, number>();
    for (const song of allSongs) {
      counts.set(song.messageId, (counts.get(song.messageId) ?? 0) + 1);
    }
    return counts;
  }, [allEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  const pinnedCountMap = useMemo(() => {
    const pinnedSongs = getSongs().filter((s) => !s.deleted && s.pinned);
    const counts = new Map<string, number>();
    for (const song of pinnedSongs) {
      counts.set(song.messageId, (counts.get(song.messageId) ?? 0) + 1);
    }
    return counts;
  }, [allEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = useMemo<Message[]>(() => {
    const q = search.trim().toLowerCase();

    // Filter by title or style (case-insensitive substring match).
    const filtered = q
      ? allEntries.filter(
          (m) =>
            (m.title ?? "").toLowerCase().includes(q) ||
            (m.style ?? "").toLowerCase().includes(q)
        )
      : allEntries;

    // Sort a copy to avoid mutating state.
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return a.createdAt > b.createdAt ? -1 : 1;
        case "oldest":
          return a.createdAt < b.createdAt ? -1 : 1;
        case "most-generated": {
          const diff = (songCountMap.get(b.id) ?? 0) - (songCountMap.get(a.id) ?? 0);
          if (diff !== 0) return diff;
          // Tie-break: newest first
          return a.createdAt > b.createdAt ? -1 : 1;
        }
        case "most-pinned": {
          const diff = (pinnedCountMap.get(b.id) ?? 0) - (pinnedCountMap.get(a.id) ?? 0);
          if (diff !== 0) return diff;
          // Tie-break: newest first
          return a.createdAt > b.createdAt ? -1 : 1;
        }
        default:
          return 0;
      }
    });
  }, [allEntries, search, sortOption, songCountMap, pinnedCountMap]);

  function handleDeleteRequest(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setPendingDeleteId(id);
  }

  function handleDeleteConfirm() {
    if (pendingDeleteId === null) return;
    updateMessage(pendingDeleteId, { deleted: true });
    setPendingDeleteId(null);
    reloadEntries();
  }

  function handleDeleteCancel() {
    setPendingDeleteId(null);
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Lyrics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {allEntries.length === 0
              ? "No songs yet"
              : `${allEntries.length} song${allEntries.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button onClick={() => navigate("/music")} data-testid="new-lyrics-btn">
          <Plus className="h-4 w-4 mr-1.5" />
          New
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Search by title or style…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search lyrics"
          className="flex-1 min-w-[160px] max-w-xs rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          aria-label="Sort lyrics"
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
          data-testid="lyrics-sort-select"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <option key={opt} value={opt}>
              {SORT_LABELS[opt]}
            </option>
          ))}
        </select>
      </div>

      {displayed.length === 0 ? (
        <div
          className="mt-12 flex flex-col items-center gap-3 text-center"
          data-testid="lyrics-list-empty"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {search.trim() ? "No matches found" : "No lyrics yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {search.trim() ? (
                "Try a different search term."
              ) : (
                <>
                  <Link
                    to="/music"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Start a new song
                  </Link>{" "}
                  from the home page.
                </>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((entry) => (
            <div key={entry.id} data-testid="lyrics-list-item">
              <LyricsItemCard
                message={entry}
                onDelete={(e) => handleDeleteRequest(e, entry.id)}
              />
            </div>
          ))}
        </div>
      )}

      {pendingDeleteId !== null && (
        <ConfirmDialog
          title="Delete lyrics?"
          description="This will permanently remove these lyrics. This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
