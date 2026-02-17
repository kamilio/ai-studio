/**
 * Video generation configuration constants.
 *
 * VIDEO_DURATIONS lists the allowed clip durations (in seconds).
 * All shots default to VIDEO_DURATIONS[0] on creation and on migration
 * from storage records that pre-date this field.
 */

export const VIDEO_DURATIONS = [8] as const;
export type VideoDuration = (typeof VIDEO_DURATIONS)[number];
