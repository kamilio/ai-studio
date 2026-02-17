/**
 * ScriptThumbnail component.
 *
 * Renders the 16:9 preview area for a script card (US-061).
 *
 * - If the script has a shot with a non-null selectedUrl, renders an inline
 *   <video> element: muted, preload="metadata" (loads first frame as poster),
 *   no autoplay.
 * - Otherwise renders a muted placeholder with a Film icon.
 *
 * Used on /video/scripts (ScriptCard grid) and /video (recent scripts section).
 */

import { Film } from "lucide-react";
import type { Script } from "@/video/lib/storage/types";

interface ScriptThumbnailProps {
  script: Script;
}

export function ScriptThumbnail({ script }: ScriptThumbnailProps) {
  const selectedUrl =
    script.shots.find((s) => s.video.selectedUrl != null)?.video.selectedUrl ??
    null;

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
      <Film
        className="h-8 w-8 text-muted-foreground/40"
        aria-hidden="true"
      />
    </div>
  );
}
