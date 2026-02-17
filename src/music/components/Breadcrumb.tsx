/**
 * Breadcrumb bar for contextual navigation.
 *
 * Renders breadcrumb segments based on the current route:
 *   /lyrics                  → Lyrics
 *   /lyrics/:messageId       → Lyrics / {title}
 *   /lyrics/:messageId/songs → Lyrics / {title} / Songs
 *   /pinned                  → Pinned Songs
 *   /settings                → Settings
 *
 *   /video/scripts           → Video Scripts
 *   /video/scripts/:id       → Video Scripts / {script title}
 *   /video/videos            → All Videos
 *   /video/videos/pinned     → Pinned Videos
 *   /video/templates         → Video Templates
 *
 * Each segment is a clickable link except the last (current page).
 * The bar truncates on overflow; the rightmost segment is always visible via
 * `min-w-0 shrink` on earlier segments and `shrink-0` on the last.
 *
 * Returns null on the Home route (no breadcrumbs on /).
 */

import { Link, useLocation, useParams } from "react-router-dom";
import { getMessage } from "@/music/lib/storage/storageService";
import { getScript } from "@/video/lib/storage/storageService";

interface Segment {
  label: string;
  href?: string;
}

function useSegments(): Segment[] {
  const { pathname } = useLocation();
  const { id } = useParams<{ id?: string }>();

  // ── Video routes ────────────────────────────────────────────────────────

  // /video/scripts/:id — fetch title from video storage
  if (pathname.match(/^\/video\/scripts\/[^/]+$/)) {
    const script = id ? getScript(id) : null;
    const title = script?.title ?? id ?? "…";
    return [
      { label: "Video Scripts", href: "/video/scripts" },
      { label: title },
    ];
  }

  // /video/scripts (list)
  if (pathname === "/video/scripts") {
    return [{ label: "Video Scripts" }];
  }

  // /video/videos/pinned (must be before /video/videos)
  if (pathname === "/video/videos/pinned") {
    return [{ label: "Pinned Videos" }];
  }

  // /video/videos
  if (pathname === "/video/videos") {
    return [{ label: "All Videos" }];
  }

  // /video/templates
  if (pathname === "/video/templates") {
    return [{ label: "Video Templates" }];
  }

  // ── Music routes ────────────────────────────────────────────────────────

  // /music/lyrics/:messageId/songs
  if (pathname.match(/^\/music\/lyrics\/[^/]+\/songs/)) {
    const msg = id ? getMessage(id) : null;
    const title = msg?.title ?? id ?? "…";
    return [
      { label: "Lyrics", href: "/music/lyrics" },
      { label: title, href: `/music/lyrics/${id}` },
      { label: "Songs" },
    ];
  }

  // /music/lyrics/:messageId  (but not /music/lyrics/new — treat as generic Lyrics Generator)
  if (pathname.match(/^\/music\/lyrics\/[^/]+$/) && id && id !== "new") {
    const msg = getMessage(id);
    const title = msg?.title ?? id;
    return [
      { label: "Lyrics", href: "/music/lyrics" },
      { label: title },
    ];
  }

  // /music/lyrics (list) or /music/lyrics/new
  if (pathname === "/music/lyrics" || pathname === "/music/lyrics/new") {
    return [{ label: "Lyrics" }];
  }

  // /music/pinned
  if (pathname === "/music/pinned") {
    return [{ label: "Pinned Songs" }];
  }

  // /settings (or legacy /music/settings — redirect handles the latter)
  if (pathname === "/settings" || pathname === "/music/settings") {
    return [{ label: "Settings" }];
  }

  // /music/songs (legacy route)
  if (pathname === "/music/songs") {
    return [{ label: "Songs" }];
  }

  return [];
}

export function Breadcrumb() {
  const segments = useSegments();

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 overflow-hidden"
    >
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;

        return (
          <span key={idx} className="flex items-center gap-1 min-w-0">
            {idx > 0 && (
              <span className="shrink-0 select-none" aria-hidden="true">
                /
              </span>
            )}
            {isLast ? (
              <span
                className="font-medium text-foreground truncate max-w-[160px] sm:max-w-none shrink-0"
                aria-current="page"
                title={seg.label}
              >
                {seg.label}
              </span>
            ) : (
              <Link
                to={seg.href!}
                className="truncate hover:text-foreground transition-colors min-w-0 shrink"
                title={seg.label}
              >
                {seg.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
