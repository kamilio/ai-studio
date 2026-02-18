export interface VideoModelDef {
  id: string;
  label: string;
  /** Supported durations in seconds, ascending */
  durations: number[];
  /** Default duration in seconds */
  defaultDuration: number;
  /** Build the model-specific extra_body given a duration in seconds */
  toExtraBody: (duration: number) => Record<string, unknown>;
}

/**
 * Snap a target duration to the nearest value in a model's available durations.
 * When two values are equidistant, the longer one wins (better to have
 * slightly more footage than too little).
 */
export function closestDuration(target: number, available: number[]): number {
  if (available.length === 0) return target;
  let best = available[0];
  let bestDiff = Math.abs(target - best);
  for (let i = 1; i < available.length; i++) {
    const diff = Math.abs(target - available[i]);
    if (diff < bestDiff || (diff === bestDiff && available[i] > best)) {
      best = available[i];
      bestDiff = diff;
    }
  }
  return best;
}

export const VIDEO_MODELS: VideoModelDef[] = [
  {
    id: "Veo-3.1",
    label: "Veo 3.1",
    durations: [4, 6, 8],
    defaultDuration: 8,
    toExtraBody: (d) => ({ size: "1792x1024", duration: String(d) }),
  },
  {
    id: "Veo-3.1-Fast",
    label: "Veo 3.1 Fast",
    durations: [4, 6, 8],
    defaultDuration: 8,
    toExtraBody: (d) => ({ size: "1792x1024", duration: String(d) }),
  },
  {
    id: "Runway-Gen-4.5",
    label: "Runway Gen 4.5",
    durations: [5, 8, 10],
    defaultDuration: 5,
    toExtraBody: (d) => ({ duration: String(d), aspect_ratio: "16:9" }),
  },
  {
    id: "Grok-Imagine-Video",
    label: "Grok Imagine Video",
    durations: [5, 6, 8],
    defaultDuration: 6,
    toExtraBody: (d) => ({ duration: d, aspect: "16:9", resolution: "720p" }),
  },
  {
    id: "Kling-2.6-Pro",
    label: "Kling 2.6 Pro",
    durations: [5, 10],
    defaultDuration: 5,
    toExtraBody: (d) => ({ duration: String(d), aspect: "16:9" }),
  },
];
