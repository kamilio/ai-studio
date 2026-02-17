/**
 * Tool definitions for the AI chat panel.
 *
 * All tools are in OpenAI function-calling format (ToolDefinition from LLMClient types).
 * They cover the full set of script mutations the assistant can perform:
 * shot prompt, narration, subtitles, add/delete/reorder shots, and script settings.
 *
 * These definitions are passed directly to chatWithTools() and are also used
 * by applyToolCall() to validate and apply the resulting tool calls.
 */

import type { ToolDefinition } from "@/shared/lib/llm/types";

export const UPDATE_SHOT_PROMPT: ToolDefinition = {
  type: "function",
  function: {
    name: "update_shot_prompt",
    description: "Update the generation prompt for a specific shot.",
    parameters: {
      type: "object",
      properties: {
        shotId: {
          type: "string",
          description: "The ID of the shot to update.",
        },
        prompt: {
          type: "string",
          description: "The new prompt text for the shot.",
        },
      },
      required: ["shotId", "prompt"],
    },
  },
};

export const UPDATE_SHOT_NARRATION: ToolDefinition = {
  type: "function",
  function: {
    name: "update_shot_narration",
    description: "Update the narration settings for a specific shot.",
    parameters: {
      type: "object",
      properties: {
        shotId: {
          type: "string",
          description: "The ID of the shot to update.",
        },
        enabled: {
          type: "boolean",
          description: "Whether narration is enabled for this shot.",
        },
        text: {
          type: "string",
          description: "The narration text to synthesise.",
        },
        audioSource: {
          type: "string",
          description: "Audio source: 'video' (native) or 'elevenlabs' (TTS).",
          enum: ["video", "elevenlabs"],
        },
      },
      required: ["shotId"],
    },
  },
};

export const UPDATE_SHOT_SUBTITLES: ToolDefinition = {
  type: "function",
  function: {
    name: "update_shot_subtitles",
    description: "Enable or disable subtitle burning for a specific shot.",
    parameters: {
      type: "object",
      properties: {
        shotId: {
          type: "string",
          description: "The ID of the shot to update.",
        },
        subtitles: {
          type: "boolean",
          description: "Whether to burn subtitles into this shot's clip.",
        },
      },
      required: ["shotId", "subtitles"],
    },
  },
};

export const ADD_SHOT: ToolDefinition = {
  type: "function",
  function: {
    name: "add_shot",
    description: "Add a new shot to the script, optionally after a specific existing shot.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the new shot.",
        },
        prompt: {
          type: "string",
          description: "The generation prompt for the new shot.",
        },
        afterShotId: {
          type: "string",
          description: "Insert the new shot after this shot ID. If omitted, appends to the end.",
        },
      },
      required: ["title", "prompt"],
    },
  },
};

export const DELETE_SHOT: ToolDefinition = {
  type: "function",
  function: {
    name: "delete_shot",
    description: "Delete a shot from the script.",
    parameters: {
      type: "object",
      properties: {
        shotId: {
          type: "string",
          description: "The ID of the shot to delete.",
        },
      },
      required: ["shotId"],
    },
  },
};

export const REORDER_SHOTS: ToolDefinition = {
  type: "function",
  function: {
    name: "reorder_shots",
    description: "Reorder all shots in the script by supplying the desired sequence of shot IDs.",
    parameters: {
      type: "object",
      properties: {
        shotIds: {
          type: "array",
          description: "Ordered array of all shot IDs defining the new sequence.",
          items: { type: "string" },
        },
      },
      required: ["shotIds"],
    },
  },
};

export const UPDATE_SCRIPT_SETTINGS: ToolDefinition = {
  type: "function",
  function: {
    name: "update_script_settings",
    description: "Update global script settings: narration, subtitles, and/or global prompt.",
    parameters: {
      type: "object",
      properties: {
        narrationEnabled: {
          type: "boolean",
          description: "Enable or disable narration globally (applied to all shots).",
        },
        subtitles: {
          type: "boolean",
          description: "Enable or disable subtitle burning globally (applied to all shots).",
        },
        globalPrompt: {
          type: "string",
          description: "Prompt text prepended to every shot during generation.",
        },
      },
      required: [],
    },
  },
};

/** Convenience array of all tool definitions for passing to chatWithTools(). */
export const CHAT_TOOLS: ToolDefinition[] = [
  UPDATE_SHOT_PROMPT,
  UPDATE_SHOT_NARRATION,
  UPDATE_SHOT_SUBTITLES,
  ADD_SHOT,
  DELETE_SHOT,
  REORDER_SHOTS,
  UPDATE_SCRIPT_SETTINGS,
];
