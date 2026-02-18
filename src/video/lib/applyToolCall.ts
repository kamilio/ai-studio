/**
 * applyToolCall — pure script mutation function for AI chat tool calls.
 *
 * Takes a Script, a tool name, and the parsed args from a ToolCall, and returns
 * a new Script with the requested mutation applied.  This is deliberately a pure
 * function (no side effects, no storage writes) so it can be unit-tested without
 * any browser or storage dependencies.
 *
 * Callers (e.g. the chat panel) are responsible for persisting the returned
 * script to storage after applying each tool call.
 *
 * Unknown tool names → script returned unchanged (no throw, no error).
 * Missing required args → script returned unchanged.
 */

import type { Script, Shot, AudioSource } from "./storage/types";
import { DEFAULT_VIDEO_DURATION } from "./config";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Create a minimal valid Shot with defaults derived from the script's current settings. */
function makeShot(title: string, prompt: string, script: Script): Shot {
  return {
    id: generateId(),
    title,
    prompt,
    narration: {
      enabled: script.settings.narrationEnabled,
      text: "",
      audioSource: script.settings.defaultAudio,
    },
    video: {
      selectedUrl: null,
      history: [],
    },
    subtitles: script.settings.subtitles,
    duration: DEFAULT_VIDEO_DURATION,
  };
}

/**
 * Apply a single tool call to a script and return the mutated copy.
 *
 * @param script   - Immutable input script (not mutated).
 * @param toolName - Name of the tool to apply.
 * @param args     - Parsed tool arguments.
 * @returns A new Script with the mutation applied, or the original script if
 *          the tool name is unknown or required args are missing/invalid.
 */
export function applyToolCall(
  script: Script,
  toolName: string,
  args: Record<string, unknown>,
): Script {
  switch (toolName) {
    case "update_shot_prompt": {
      const { shotId, prompt } = args;
      if (typeof shotId !== "string" || typeof prompt !== "string") return script;
      const shots = script.shots.map((s) =>
        s.id === shotId ? { ...s, prompt } : s
      );
      return { ...script, shots };
    }

    case "update_shot_narration": {
      const { shotId, enabled, text, audioSource } = args;
      if (typeof shotId !== "string") return script;
      const shots = script.shots.map((s) => {
        if (s.id !== shotId) return s;
        const updatedNarration = { ...s.narration };
        if (typeof enabled === "boolean") updatedNarration.enabled = enabled;
        if (typeof text === "string") updatedNarration.text = text;
        if (audioSource === "video" || audioSource === "elevenlabs") {
          updatedNarration.audioSource = audioSource as AudioSource;
        }
        return { ...s, narration: updatedNarration };
      });
      return { ...script, shots };
    }

    case "update_shot_subtitles": {
      const { shotId, subtitles } = args;
      if (typeof shotId !== "string" || typeof subtitles !== "boolean") return script;
      const shots = script.shots.map((s) =>
        s.id === shotId ? { ...s, subtitles } : s
      );
      return { ...script, shots };
    }

    case "add_shot": {
      const { title, prompt, afterShotId } = args;
      if (typeof title !== "string" || typeof prompt !== "string") return script;
      const newShot = makeShot(title, prompt, script);
      if (typeof afterShotId === "string") {
        const idx = script.shots.findIndex((s) => s.id === afterShotId);
        if (idx !== -1) {
          const shots = [
            ...script.shots.slice(0, idx + 1),
            newShot,
            ...script.shots.slice(idx + 1),
          ];
          return { ...script, shots };
        }
      }
      // Append to end when afterShotId is absent or not found.
      return { ...script, shots: [...script.shots, newShot] };
    }

    case "delete_shot": {
      const { shotId } = args;
      if (typeof shotId !== "string") return script;
      const shots = script.shots.filter((s) => s.id !== shotId);
      return { ...script, shots };
    }

    case "reorder_shots": {
      const { shotIds } = args;
      if (!Array.isArray(shotIds)) return script;
      const shotMap = new Map(script.shots.map((s) => [s.id, s]));
      const reordered = (shotIds as unknown[])
        .filter((id): id is string => typeof id === "string")
        .map((id) => shotMap.get(id))
        .filter((s): s is Shot => s !== undefined);
      // Only accept if all existing shots are accounted for (prevent data loss).
      if (reordered.length !== script.shots.length) return script;
      return { ...script, shots: reordered };
    }

    case "update_script_settings": {
      const { narrationEnabled, subtitles, globalPrompt } = args;
      const updatedSettings = { ...script.settings };
      if (typeof narrationEnabled === "boolean") {
        updatedSettings.narrationEnabled = narrationEnabled;
      }
      if (typeof subtitles === "boolean") {
        updatedSettings.subtitles = subtitles;
      }
      if (typeof globalPrompt === "string") {
        updatedSettings.globalPrompt = globalPrompt;
      }
      return { ...script, settings: updatedSettings };
    }

    default:
      // Unknown tool name — return script unchanged.
      return script;
  }
}
