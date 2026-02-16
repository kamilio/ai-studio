/**
 * FullscreenImageViewer component (US-027)
 *
 * Opens a fullscreen modal when the user clicks any image in the session view.
 * Provides left/right navigation within a named list.
 *
 * List modes:
 *   - All:     every non-deleted ImageItem in the session (all generations).
 *   - Current: only items from the generation with the highest stepId.
 *
 * The active list mode is toggled by the user via two tab buttons.
 *
 * Keyboard shortcuts:
 *   - ArrowLeft  → previous image in the active list
 *   - ArrowRight → next image in the active list
 *   - Escape     → close the modal
 *
 * Clicking outside the image area (i.e. on the backdrop) closes the modal.
 * Not rendered when there are no images (callers should gate on this).
 */

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ImageGeneration, ImageItem } from "@/image/lib/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListMode = "all" | "current";

export interface FullscreenImageViewerProps {
  /** All non-deleted items in the session (used for the "All" list). */
  allItems: ImageItem[];
  /** All generations in the session (used to determine the latest step). */
  generations: ImageGeneration[];
  /** The item that was clicked and should be shown first when the modal opens. */
  initialItem: ImageItem;
  /** Called when the modal should close (ESC, backdrop click, or close button). */
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns items for the "Current" list: non-deleted items from the generation
 * with the highest stepId.
 */
function getLatestGenerationItems(
  generations: ImageGeneration[],
  allItems: ImageItem[]
): ImageItem[] {
  if (generations.length === 0) return [];
  const latest = generations.reduce((best, g) =>
    g.stepId > best.stepId ? g : best
  );
  return allItems.filter(
    (item) => item.generationId === latest.id && !item.deleted
  );
}

/**
 * Builds the active list for the given mode.
 */
function buildList(
  mode: ListMode,
  allItems: ImageItem[],
  generations: ImageGeneration[]
): ImageItem[] {
  const nonDeleted = allItems.filter((item) => !item.deleted);
  if (mode === "current") {
    return getLatestGenerationItems(generations, nonDeleted);
  }
  return nonDeleted;
}

// ─── FullscreenImageViewer ────────────────────────────────────────────────────

export function FullscreenImageViewer({
  allItems,
  generations,
  initialItem,
  onClose,
}: FullscreenImageViewerProps) {
  // Active list mode: "all" shows every image in the session, "current" shows
  // only items from the most recent generation step.
  const [listMode, setListMode] = useState<ListMode>("current");

  // Build the active list whenever mode, allItems, or generations changes.
  const activeList = buildList(listMode, allItems, generations);

  // Current display index within the active list.
  // Initialise to the position of the clicked item in the "current" list.
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const list = buildList("current", allItems, generations);
    const idx = list.findIndex((item) => item.id === initialItem.id);
    return idx >= 0 ? idx : 0;
  });

  // When the list mode changes, try to preserve the same item in the new list.
  // If the item is not in the new list, default to 0.
  const handleListModeChange = useCallback(
    (newMode: ListMode) => {
      setListMode(newMode);
      const currentItem = activeList[currentIndex];
      if (currentItem) {
        const newList = buildList(newMode, allItems, generations);
        const newIdx = newList.findIndex((item) => item.id === currentItem.id);
        setCurrentIndex(newIdx >= 0 ? newIdx : 0);
      } else {
        setCurrentIndex(0);
      }
    },
    [activeList, currentIndex, allItems, generations]
  );

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goToPrev = useCallback(() => {
    if (activeList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
  }, [activeList.length]);

  const goToNext = useCallback(() => {
    if (activeList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeList.length);
  }, [activeList.length]);

  // ── Keyboard handler ────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToPrev, goToNext]);

  // ── Backdrop click ──────────────────────────────────────────────────────────

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Close only when clicking on the backdrop itself, not its children.
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // ── Guard: nothing to show ──────────────────────────────────────────────────

  if (activeList.length === 0) return null;

  // Clamp index in case list shrank (e.g. mode switch leaves fewer items).
  const safeIndex = Math.min(currentIndex, activeList.length - 1);
  const currentItem = activeList[safeIndex];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image viewer"
      data-testid="fullscreen-viewer"
      onClick={handleBackdropClick}
    >
      {/* ── Close button ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close fullscreen viewer"
        data-testid="fullscreen-close-btn"
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* ── List mode toggle ──────────────────────────────────────────────── */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex rounded-lg overflow-hidden border border-white/20 text-sm"
        data-testid="fullscreen-list-mode-toggle"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleListModeChange("all");
          }}
          aria-pressed={listMode === "all"}
          data-testid="fullscreen-mode-all"
          className={`px-4 py-1.5 transition-colors ${
            listMode === "all"
              ? "bg-white text-black font-medium"
              : "bg-black/50 text-white hover:bg-black/70"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleListModeChange("current");
          }}
          aria-pressed={listMode === "current"}
          data-testid="fullscreen-mode-current"
          className={`px-4 py-1.5 transition-colors ${
            listMode === "current"
              ? "bg-white text-black font-medium"
              : "bg-black/50 text-white hover:bg-black/70"
          }`}
        >
          Current
        </button>
      </div>

      {/* ── Left arrow ────────────────────────────────────────────────────── */}
      {activeList.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          aria-label="Previous image"
          data-testid="fullscreen-prev-btn"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      {/* ── Image area ────────────────────────────────────────────────────── */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        data-testid="fullscreen-image-container"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={currentItem.id}
          src={currentItem.url}
          alt=""
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          data-testid="fullscreen-image"
        />
        {/* Position counter: "3 / 6" */}
        {activeList.length > 1 && (
          <div
            className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white tabular-nums"
            data-testid="fullscreen-counter"
            aria-label={`Image ${safeIndex + 1} of ${activeList.length}`}
          >
            {safeIndex + 1} / {activeList.length}
          </div>
        )}
      </div>

      {/* ── Right arrow ───────────────────────────────────────────────────── */}
      {activeList.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          aria-label="Next image"
          data-testid="fullscreen-next-btn"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
