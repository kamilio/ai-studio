/**
 * Fixture responses for MockLLMClient.chatWithTools().
 *
 * Each fixture represents a different response shape to ensure the chat tool
 * pipeline handles all cases: single tool call, multiple tool calls, unknown
 * tool name, and plain text (regression guard for non-tool responses).
 *
 * The shot ID "shot-fixture-0" is the conventional placeholder used in
 * tests — it corresponds to the first shot in whatever script is under test.
 */

import type { ChatWithToolsResponse } from "@/shared/lib/llm/types";

/** Single tool call: update_shot_prompt targeting the first shot. */
export const singleToolCallResponse: ChatWithToolsResponse = {
  text: "I've updated the prompt for the first shot.",
  toolCalls: [
    {
      id: "call_single_001",
      name: "update_shot_prompt",
      args: {
        shotId: "shot-fixture-0",
        prompt: "A dramatic wide-angle aerial view of a mountain range at golden hour, cinematic, 4K",
      },
    },
  ],
};

/** Multi-tool call: add_shot + update_script_settings in one response. */
export const multiToolCallResponse: ChatWithToolsResponse = {
  text: "I've added a new closing shot and enabled narration globally.",
  toolCalls: [
    {
      id: "call_multi_001",
      name: "add_shot",
      args: {
        title: "Closing Shot",
        prompt: "Slow fade to black over a peaceful sunset, cinematic outro",
      },
    },
    {
      id: "call_multi_002",
      name: "update_script_settings",
      args: {
        narrationEnabled: true,
        globalPrompt: "Cinematic, high quality, 4K",
      },
    },
  ],
};

/** Unknown tool name — should render an error card without mutating script state. */
export const unknownToolResponse: ChatWithToolsResponse = {
  text: "",
  toolCalls: [
    {
      id: "call_unknown_001",
      name: "nonexistent_tool",
      args: {
        someArg: "someValue",
      },
    },
  ],
};

/** Plain text response with no tool calls — regression guard. */
export const plainTextResponse: ChatWithToolsResponse = {
  text: "Here is some information about your script. No changes have been made.",
  toolCalls: [],
};
