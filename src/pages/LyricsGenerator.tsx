/**
 * LyricsGenerator page (US-009 + US-010).
 *
 * Split-panel layout:
 *   Left panel  – YAML frontmatter (title, style, commentary) + lyrics body
 *   Right panel – scrollable chat message history + text input / send button
 *
 * A "Generate Songs" button at the bottom navigates to the Song Generator for
 * the current entry, passing the entry id as a `?entryId=` query parameter so
 * US-011 can pick it up.
 *
 * For `/lyrics/new` the page has no entry yet; empty-state messages are shown.
 * For `/lyrics/:id` the entry is read from localStorage.
 *
 * Chat submission (US-010): calls createLLMClient().chat() with the full
 * conversation history, parses the frontmatter from the response, persists
 * the updated chatHistory + lyrics fields to localStorage, then re-reads the
 * entry to trigger a re-render.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiKeyMissingModal } from "@/components/ApiKeyMissingModal";
import { useApiKeyGuard } from "@/hooks/useApiKeyGuard";
import {
  createLyricsEntry,
  getLyricsEntry,
  getSettings,
  updateLyricsEntry,
} from "@/lib/storage/storageService";
import type { ChatMessage, LyricsEntry } from "@/lib/storage/types";
import { createLLMClient } from "@/lib/llm/factory";

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
  body: string;
} | null {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const body = match[2].trim();

  function extractField(name: string): string {
    const re = new RegExp(`^${name}:\\s*"?([^"\\n]+)"?`, "m");
    const m = frontmatter.match(re);
    return m ? m[1].trim() : "";
  }

  return {
    title: extractField("title"),
    style: extractField("style"),
    commentary: extractField("commentary"),
    body,
  };
}

export default function LyricsGenerator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isModalOpen, guardAction, closeModal } = useApiKeyGuard();

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Refresh counter: incrementing it causes entry to be re-read from storage.
  const [refreshCount, setRefreshCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Read entry from storage; re-reads whenever id or refreshCount changes.
  const [entry, setEntry] = useState<LyricsEntry | null>(
    () => (id ? getLyricsEntry(id) : null)
  );

  useEffect(() => {
    setEntry(id ? getLyricsEntry(id) : null);
  }, [id, refreshCount]);

  // Scroll chat to bottom when chat history grows.
  const chatLength = entry?.chatHistory.length ?? 0;
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLength]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = message.trim();
      if (!trimmed || isLoading) return;
      // Check API key first so modal shows even when there is no active entry.
      if (!guardAction()) return;

      // On /lyrics/new there is no entry yet — create one on first send.
      let entryId = id;
      let currentEntry = entryId ? getLyricsEntry(entryId) : null;
      if (!entryId || !currentEntry) {
        currentEntry = createLyricsEntry({
          title: "",
          style: "",
          commentary: "",
          body: "",
          chatHistory: [],
        });
        entryId = currentEntry.id;
      }

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const updatedHistory: ChatMessage[] = [
        ...currentEntry.chatHistory,
        userMessage,
      ];

      // Persist the user message immediately so it shows before the response.
      updateLyricsEntry(entryId, { chatHistory: updatedHistory });
      setMessage("");
      if (id) setRefreshCount((c) => c + 1);
      setIsLoading(true);

      try {
        const settings = getSettings();
        const client = createLLMClient(settings?.poeApiKey ?? undefined);
        const responseText = await client.chat([
          { role: "system" as const, content: LYRICS_SYSTEM_PROMPT },
          ...updatedHistory,
        ]);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: responseText,
        };
        // Replace any previous assistant message so only the latest response is stored.
        const finalHistory: ChatMessage[] = [
          ...updatedHistory.filter((m) => m.role !== "assistant"),
          assistantMessage,
        ];

        // Parse frontmatter from the assistant response and update the entry.
        const parsed = parseLyricsResponse(responseText);
        updateLyricsEntry(entryId, {
          chatHistory: finalHistory,
          ...(parsed ?? {}),
        });
      } finally {
        setIsLoading(false);
        if (id) {
          setRefreshCount((c) => c + 1);
        } else {
          // Navigate to the newly created entry so the URL reflects it.
          navigate(`/lyrics/${entryId}`, { replace: true });
        }
      }
    },
    [message, id, isLoading, guardAction, navigate]
  );

  function handleGenerateSongs() {
    if (!id) return;
    navigate(`/songs?entryId=${id}`);
  }

  const chatHistory: ChatMessage[] = entry?.chatHistory ?? [];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Lyrics Generator</h1>
      </div>

      {/* ── Main split panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel – frontmatter + lyrics body */}
        <section
          className="w-1/2 border-r flex flex-col overflow-auto p-6"
          aria-label="Lyrics frontmatter"
          data-testid="lyrics-panel"
        >
          <h2 className="text-lg font-semibold mb-4">Lyrics</h2>
          {entry ? (
            <>
              {/* Frontmatter block */}
              <div
                className="mb-4 rounded-md bg-muted p-4 font-mono text-sm"
                data-testid="lyrics-frontmatter"
              >
                <p>
                  <span className="text-muted-foreground">title:</span>{" "}
                  <span data-testid="lyrics-title">{entry.title}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">style:</span>{" "}
                  <span data-testid="lyrics-style">{entry.style}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">commentary:</span>{" "}
                  <span data-testid="lyrics-commentary">{entry.commentary}</span>
                </p>
              </div>
              {/* Lyrics body */}
              <pre
                className="font-mono text-sm whitespace-pre-wrap flex-1"
                data-testid="lyrics-body"
              >
                {entry.body}
              </pre>
            </>
          ) : (
            <p className="text-muted-foreground text-sm" data-testid="lyrics-empty">
              {id
                ? "Entry not found."
                : "Select or create a lyrics entry to get started."}
            </p>
          )}
        </section>

        {/* Right panel – chat history + input */}
        <section
          className="w-1/2 flex flex-col overflow-hidden p-6"
          aria-label="Chat interface"
          data-testid="chat-panel"
        >
          <h2 className="text-lg font-semibold mb-4">Chat</h2>

          {/* Scrollable message history */}
          <div
            className="flex-1 overflow-y-auto space-y-3 mb-4"
            data-testid="chat-history"
            aria-live="polite"
          >
            {chatHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="chat-empty">
                No messages yet. Ask Claude to write or refine your lyrics.
              </p>
            ) : (
              chatHistory.map((msg, i) => (
                <div
                  key={i}
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

          {/* Message input + send */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 items-end"
            data-testid="chat-form"
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
        </section>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div className="border-t p-4 flex justify-end">
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
