/**
 * LyricsGenerator page (US-004 / US-009 / US-010).
 *
 * Route: /lyrics/:messageId
 *
 * On load: getAncestors(messageId) → render path top-down in the chat panel.
 * The left panel shows the latest assistant message's lyrics fields.
 * Submitting a message: createMessage (user, parentId = current messageId),
 * call llmClient.chat() with the ancestor path as history, createMessage
 * (assistant), navigate to /lyrics/:newAssistantId.
 *
 * Layout:
 *   Desktop (≥ 768px): side-by-side split panels (lyrics left, chat right).
 *   Mobile (< 768px):  tab bar "Lyrics" | "Chat" replaces the side-by-side
 *                       panels; the chat input is fixed at the bottom when
 *                       the Chat tab is active.
 *
 * For `/lyrics/new` the page has no message yet; empty-state messages are shown.
 * For `/lyrics/:id` the message is read from localStorage.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiKeyMissingModal } from "@/components/ApiKeyMissingModal";
import { useApiKeyGuard } from "@/hooks/useApiKeyGuard";
import {
  createMessage,
  getMessage,
  getAncestors,
  getSettings,
} from "@/lib/storage/storageService";
import type { Message } from "@/lib/storage/types";
import { createLLMClient } from "@/lib/llm/factory";
import type { ChatMessage as LLMChatMessage } from "@/lib/llm/types";

const LYRICS_SYSTEM_PROMPT = `You are a professional songwriter and lyricist. \
Help the user write and refine song lyrics.

When producing lyrics always respond in this exact format:

---
title: "Song Title"
style: "genre / mood / instrumentation"
commentary: "Brief note about the creative choices"
---
<lyrics body here>

Rules:
- No emoji of any kind
- The YAML frontmatter block is mandatory in every reply
- Keep language poetic and evocative`;

/**
 * Parse the frontmatter + body from an LLM response string.
 *
 * Expected format:
 *   ---
 *   title: "..."
 *   style: "..."
 *   commentary: "..."
 *   ---
 *   <lyrics body>
 *
 * Returns parsed fields if the header block is present; otherwise returns null
 * so the caller can fall back to leaving the entry unchanged.
 */
function parseLyricsResponse(text: string): {
  title: string;
  style: string;
  commentary: string;
  lyricsBody: string;
} | null {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const lyricsBody = match[2].trim();

  function extractField(name: string): string {
    const re = new RegExp(`^${name}:\\s*"?([^"\\n]+)"?`, "m");
    const m = frontmatter.match(re);
    return m ? m[1].trim() : "";
  }

  return {
    title: extractField("title"),
    style: extractField("style"),
    commentary: extractField("commentary"),
    lyricsBody,
  };
}

/** Format a duration in seconds as M:SS (e.g. 185 → "3:05"). */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Returns true when window.innerWidth < 768px.
 * Re-evaluates on every resize so the layout switches live.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function LyricsGenerator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isModalOpen, guardAction, closeModal } = useApiKeyGuard();
  const isMobile = useIsMobile();

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Refresh counter: incrementing it causes message to be re-read from storage.
  const [refreshCount, setRefreshCount] = useState(0);
  // Mobile tab state: "lyrics" | "chat"
  const [activeTab, setActiveTab] = useState<"lyrics" | "chat">("lyrics");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Current assistant message (the one whose lyrics are shown in the left panel).
  const [currentMessage, setCurrentMessage] = useState<Message | null>(
    () => (id ? getMessage(id) : null)
  );

  // Full ancestor path for chat display.
  const [ancestorPath, setAncestorPath] = useState<Message[]>(
    () => (id ? getAncestors(id) : [])
  );

  useEffect(() => {
    const msg = id ? getMessage(id) : null;
    setCurrentMessage(msg);
    setAncestorPath(id ? getAncestors(id) : []);
  }, [id, refreshCount]);

  // Scroll chat to bottom when ancestor path grows.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ancestorPath.length]);

  // Find the latest assistant message in the path for the left panel.
  const latestAssistant = [...ancestorPath].reverse().find(
    (m) => m.role === "assistant"
  ) ?? null;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = userInput.trim();
      if (!trimmed || isLoading) return;
      if (!guardAction()) return;

      setIsLoading(true);

      // Determine the parentId for the new user message.
      // If there is a current message, the user message is a child of it.
      // If this is /lyrics/new, start a new root message.
      const parentId = id && currentMessage ? id : null;

      // Create the user message first.
      const userMsg = createMessage({
        role: "user",
        content: trimmed,
        parentId,
      });

      setUserInput("");

      try {
        // Build LLM history from ancestors + new user message.
        const history: LLMChatMessage[] = [
          { role: "system" as const, content: LYRICS_SYSTEM_PROMPT },
          ...ancestorPath.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: trimmed },
        ];

        const settings = getSettings();
        const client = createLLMClient(settings?.poeApiKey ?? undefined);
        const responseText = await client.chat(history);

        const parsed = parseLyricsResponse(responseText);
        const assistantMsg = createMessage({
          role: "assistant",
          content: responseText,
          parentId: userMsg.id,
          ...(parsed ?? {}),
        });

        // Navigate to the new assistant message.
        navigate(`/lyrics/${assistantMsg.id}`, { replace: !id });
      } catch {
        // On error, still navigate to the user message so the state is saved.
        navigate(`/lyrics/${userMsg.id}`, { replace: !id });
      } finally {
        setIsLoading(false);
        if (id) setRefreshCount((c) => c + 1);
      }
    },
    [userInput, id, currentMessage, ancestorPath, isLoading, guardAction, navigate]
  );

  function handleGenerateSongs() {
    if (!id) return;
    navigate(`/lyrics/${id}/songs`);
  }

  /** Left panel: frontmatter + lyrics body. */
  const LyricsPanel = (
    <section
      className="flex flex-col overflow-auto p-6 flex-1 min-h-0"
      aria-label="Lyrics"
      data-testid="lyrics-panel"
    >
      <h2 className="text-lg font-semibold mb-4">Lyrics</h2>
      {latestAssistant ? (
        <>
          {/* Frontmatter block */}
          <div
            className="mb-4 rounded-md bg-muted p-4 font-mono text-sm"
            data-testid="lyrics-frontmatter"
          >
            <p>
              <span className="text-muted-foreground">title:</span>{" "}
              <span data-testid="lyrics-title">{latestAssistant.title}</span>
            </p>
            <p>
              <span className="text-muted-foreground">style:</span>{" "}
              <span data-testid="lyrics-style">{latestAssistant.style}</span>
            </p>
            <p>
              <span className="text-muted-foreground">commentary:</span>{" "}
              <span data-testid="lyrics-commentary">{latestAssistant.commentary}</span>
            </p>
            {latestAssistant.duration !== undefined && (
              <p>
                <span className="text-muted-foreground">duration:</span>{" "}
                <span data-testid="lyrics-duration">
                  {formatDuration(latestAssistant.duration)}
                </span>
              </p>
            )}
          </div>
          {/* Lyrics body */}
          <pre
            className="font-mono text-sm whitespace-pre-wrap flex-1"
            data-testid="lyrics-body"
          >
            {latestAssistant.lyricsBody}
          </pre>
        </>
      ) : (
        <p className="text-muted-foreground text-sm" data-testid="lyrics-empty">
          {id
            ? "Message not found."
            : "Select or create a lyrics entry to get started."}
        </p>
      )}
    </section>
  );

  /** Chat history list. */
  const ChatHistory = (
    <div
      className="flex-1 overflow-y-auto space-y-3 mb-4"
      data-testid="chat-history"
      aria-live="polite"
    >
      {ancestorPath.length === 0 ? (
        <p className="text-muted-foreground text-sm" data-testid="chat-empty">
          No messages yet. Ask Claude to write or refine your lyrics.
        </p>
      ) : (
        ancestorPath.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-md px-3 py-2 text-sm max-w-[85%] ${
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
            data-testid={`chat-message-${msg.role}`}
          >
            {msg.content}
          </div>
        ))
      )}
      {isLoading && (
        <div
          className="rounded-md px-3 py-2 text-sm max-w-[85%] bg-muted animate-pulse"
          data-testid="chat-loading"
          aria-label="Claude is thinking…"
        >
          Claude is thinking…
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );

  /** Chat input form. */
  const ChatForm = (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 items-end"
      data-testid="chat-form"
    >
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
          }
        }}
        placeholder="Type a message… (Shift+Enter for newline)"
        aria-label="Chat message"
        disabled={isLoading}
        rows={3}
        className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
        data-testid="chat-input"
      />
      <Button type="submit" disabled={isLoading} data-testid="chat-submit">
        {isLoading ? "Sending…" : "Send"}
      </Button>
    </form>
  );

  /** Right panel: chat history + input. */
  const ChatPanel = (
    <section
      className="flex flex-col overflow-hidden p-6 flex-1 min-h-0"
      aria-label="Chat"
      data-testid="chat-panel"
    >
      <h2 className="text-lg font-semibold mb-4">Chat</h2>
      {ChatHistory}
      {ChatForm}
    </section>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {isMobile ? (
        <>
          {/* ── Mobile: tab bar + active tab panel ─────────────────────── */}
          <div
            className="flex border-b shrink-0"
            data-testid="mobile-tab-bar"
            role="tablist"
            aria-label="Editor panels"
          >
            <button
              role="tab"
              aria-selected={activeTab === "lyrics"}
              aria-controls="lyrics-tab-panel"
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "lyrics"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("lyrics")}
              data-testid="tab-lyrics"
            >
              Lyrics
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "chat"}
              aria-controls="chat-tab-panel"
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("chat")}
              data-testid="tab-chat"
            >
              Chat
            </button>
          </div>

          {/* Active tab content */}
          <div
            id={activeTab === "lyrics" ? "lyrics-tab-panel" : "chat-tab-panel"}
            role="tabpanel"
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {activeTab === "lyrics" ? (
              LyricsPanel
            ) : (
              <section
                className="flex flex-col overflow-hidden p-4 pb-0 flex-1 min-h-0"
                aria-label="Chat"
                data-testid="chat-panel"
              >
                <h2 className="text-lg font-semibold mb-4">Chat</h2>
                {ChatHistory}
                {/* Chat input pinned to bottom of viewport on mobile */}
                <div className="sticky bottom-0 bg-background pt-2 pb-4 shrink-0">
                  {ChatForm}
                </div>
              </section>
            )}
          </div>
        </>
      ) : (
        /* ── Desktop: side-by-side split panels ─────────────────────────── */
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panel */}
          <div className="w-1/2 border-r flex flex-col overflow-hidden">
            {LyricsPanel}
          </div>
          {/* Right panel */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {ChatPanel}
          </div>
        </div>
      )}

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div className="border-t p-4 flex justify-end shrink-0">
        <Button
          onClick={handleGenerateSongs}
          disabled={!id}
          data-testid="generate-songs-btn"
        >
          Generate Songs
        </Button>
      </div>

      {isModalOpen && <ApiKeyMissingModal onClose={closeModal} />}
    </div>
  );
}
