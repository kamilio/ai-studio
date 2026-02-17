/**
 * All Scripts page.
 *
 * Route: /video/scripts (TopBar via VideoPageLayout in App.tsx)
 *
 * Displays all video scripts in a card grid. Each card shows:
 * - A preview thumbnail area (inline <video> if any shot has a selectedUrl,
 *   otherwise a muted film-strip placeholder).
 * - Title with inline rename support.
 * - Shot count, approximate duration (~{N}s), and last-updated relative time.
 * - Edit button navigating to /video/scripts/:id.
 * - ⋯ overflow menu offering Rename and Delete (with ConfirmDialog).
 *
 * A "New Script" card at the end of the grid navigates to /video (Video Home)
 * so the user can enter a new prompt.
 *
 * Implements US-039.
 */

import { useRef, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, MoreHorizontal, Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { videoStorageService } from "@/video/lib/storage/storageService";
import type { Script } from "@/video/lib/storage/types";

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ─── ScriptThumbnail ──────────────────────────────────────────────────────────

/**
 * Renders the 16:9 preview area for a script card.
 * If the script has a shot with a selectedUrl, renders an inline <video> element
 * (muted, preload=metadata). Otherwise renders a placeholder with a Film icon.
 */
function ScriptThumbnail({ script }: { script: Script }) {
  const selectedUrl = script.shots.find((s) => s.video.selectedUrl != null)?.video.selectedUrl ?? null;

  if (selectedUrl) {
    return (
      <div className="w-full aspect-video rounded-md overflow-hidden bg-black">
        <video
          src={selectedUrl}
          muted
          preload="metadata"
          className="w-full h-full object-cover"
          aria-label="Script preview"
        />
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-md overflow-hidden bg-muted flex items-center justify-center">
      <Film className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
    </div>
  );
}

// ─── ScriptCard ───────────────────────────────────────────────────────────────

interface ScriptCardProps {
  script: Script;
  onDeleted: () => void;
  onRenamed: (id: string, newTitle: string) => void;
}

function ScriptCard({ script, onDeleted, onRenamed }: ScriptCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(script.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const shotCount = script.shots.length;
  const durationS = shotCount * 8;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  function handleRename() {
    setMenuOpen(false);
    setRenameValue(script.title);
    setIsRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== script.title) {
      videoStorageService.updateScript(script.id, { title: trimmed });
      onRenamed(script.id, trimmed);
    }
    setIsRenaming(false);
  }

  function cancelRename() {
    setRenameValue(script.title);
    setIsRenaming(false);
  }

  function handleDelete() {
    setMenuOpen(false);
    setConfirmDelete(true);
  }

  function confirmDeleteAction() {
    videoStorageService.deleteScript(script.id);
    setConfirmDelete(false);
    onDeleted();
  }

  return (
    <>
      <div
        className="rounded-lg border border-border bg-card flex flex-col hover:shadow-md hover:border-foreground/20 transition-all overflow-hidden"
        data-testid={`script-card-${script.id}`}
      >
        {/* Thumbnail */}
        <div className="p-3 pb-0">
          <ScriptThumbnail script={script} />
        </div>

        {/* Card body */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            {isRenaming ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  className="flex-1 min-w-0 text-sm font-medium bg-background border border-border rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Rename script"
                />
                <button
                  type="button"
                  onClick={commitRename}
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Save rename"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelRename}
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Cancel rename"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground leading-tight truncate flex-1 min-w-0">
                {script.title}
              </p>
            )}

            {/* Overflow menu */}
            {!isRenaming && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="More options"
                  data-testid={`script-card-menu-${script.id}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-32 rounded-md border border-border bg-background shadow-md py-1">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                      onClick={handleRename}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{shotCount} {shotCount === 1 ? "shot" : "shots"}</span>
            <span aria-hidden="true">·</span>
            <span>~{durationS}s</span>
            <span aria-hidden="true">·</span>
            <span>{relativeTime(script.updatedAt)}</span>
          </div>

          {/* Edit button */}
          <div className="flex justify-end mt-auto pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              data-testid={`script-card-edit-${script.id}`}
            >
              <Link to={`/video/scripts/${script.id}`}>Edit</Link>
            </Button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete script?"
          description="This will permanently delete the script and all its shots. This cannot be undone."
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

// ─── NewScriptCard ────────────────────────────────────────────────────────────

/**
 * A card with a + icon that navigates to /video (Video Home) so the user
 * can enter a new prompt and generate a new script.
 */
function NewScriptCard() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/video")}
      className="rounded-lg border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 min-h-[180px] hover:border-primary hover:bg-accent/30 transition-all cursor-pointer group"
      data-testid="new-script-card"
      aria-label="Create new script"
    >
      <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors text-muted-foreground/50">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
        New Script
      </span>
    </button>
  );
}

// ─── VideoScripts ─────────────────────────────────────────────────────────────

export default function VideoScripts() {
  const [scripts, setScripts] = useState<Script[]>(() =>
    videoStorageService.listScripts()
  );

  function reloadScripts() {
    setScripts(videoStorageService.listScripts());
  }

  function handleRenamed(id: string, newTitle: string) {
    setScripts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Video Scripts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your scripts, generate shots, and export for production.
        </p>
      </div>

      {/* Scripts grid */}
      {scripts.length === 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-testid="scripts-grid"
        >
          <NewScriptCard />
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-testid="scripts-grid"
        >
          {scripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              onDeleted={reloadScripts}
              onRenamed={handleRenamed}
            />
          ))}
          <NewScriptCard />
        </div>
      )}
    </div>
  );
}
