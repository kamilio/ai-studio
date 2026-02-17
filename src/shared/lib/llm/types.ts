export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** A single tool call returned by the model. */
export interface ToolCall {
  /** Unique identifier for this tool call (from the API). */
  id: string;
  /** Name of the tool to invoke. */
  name: string;
  /** Parsed arguments for the tool. */
  args: Record<string, unknown>;
}

/** Combined response from chatWithTools(): assistant text plus any tool calls. */
export interface ChatWithToolsResponse {
  /** Assistant text content (may be empty if the model only emitted tool calls). */
  text: string;
  /** Tool calls emitted by the model (empty array if none). */
  toolCalls: ToolCall[];
}

/** JSON-schema property shape used when building tool definitions for the API. */
export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
}

/** A single tool definition in OpenAI function-calling format. */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolParameterProperty>;
      required?: string[];
    };
  };
}

/**
 * Typed interface for all LLM interactions in the app.
 * Implemented by PoeLLMClient (real) and MockLLMClient (fixture-based).
 */
export interface LLMClient {
  /**
   * Send a chat message history to Claude and return the assistant's response text.
   * @param model - optional model name; falls back to claude-sonnet-4.5 when omitted
   */
  chat(messages: ChatMessage[], model?: string): Promise<string>;

  /**
   * Submit a style prompt to ElevenLabs and return a publicly-accessible audio URL.
   * @param prompt - style/lyrics prompt
   * @param musicLengthMs - desired audio length in milliseconds (derived from message.duration * 1000)
   */
  generateSong(prompt: string, musicLengthMs?: number): Promise<string>;

  /**
   * Submit a text prompt to the image model and return an array of publicly-accessible image URLs.
   * @param prompt - text description of the desired image
   * @param count - number of images to generate in parallel (default 3)
   * @param model - optional model id; falls back to implementation default when omitted
   * @param extraBody - optional extra fields forwarded verbatim to the API request body
   * @param remixImageBase64 - optional raw base64-encoded reference image for remix (no data URI prefix)
   */
  generateImage(prompt: string, count?: number, model?: string, extraBody?: Record<string, unknown>, remixImageBase64?: string): Promise<string[]>;

  /**
   * Submit a video prompt to the veo-3.1 model and return a publicly-accessible video URL.
   * @param prompt - text description of the desired video shot
   * @param duration - optional clip duration in seconds; defaults to VIDEO_DURATIONS[0]
   */
  generateVideo(prompt: string, duration?: number): Promise<string>;

  /**
   * Submit narration text to the elevenlabs-v3 model and return a publicly-accessible audio URL.
   * @param text - narration text to synthesize
   */
  generateAudio(text: string): Promise<string>;

  /**
   * Send a chat message history with tool definitions to the model.
   * Returns the assistant text plus any tool calls emitted in the response.
   * @param messages - conversation history (may include a system message)
   * @param tools - array of tool definitions in OpenAI function-calling format
   * @param model - optional model name; falls back to claude-sonnet-4.5 when omitted
   */
  chatWithTools(messages: ChatMessage[], tools: ToolDefinition[], model?: string): Promise<ChatWithToolsResponse>;
}
