/**
 * Video generation configuration constants.
 *
 * VIDEO_DURATIONS is the deduplicated sorted union of all model durations.
 * The duration picker renders one button per value.
 *
 * DEFAULT_VIDEO_DURATION is assigned to new shots on creation and on migration
 * from storage records that pre-date the duration field.
 */

import { VIDEO_MODELS } from "./videoModels";

export const VIDEO_DURATIONS: number[] = [
  ...new Set(VIDEO_MODELS.flatMap((m) => m.durations)),
].sort((a, b) => a - b);

export const DEFAULT_VIDEO_DURATION = 8;
