/**
 * LyricsGenerator page (US-009).
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
 * For `/lyrics/:id` the entry is read from localStorage via useMemo.
 *
 * Chat submission is guarded by the API key check (US-007). Actual LLM
 * integration is wired up in US-010; the handler here is a stub that validates
 * the API key and clears the input.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApiKeyMissingModal } from "@/components/ApiKeyMissingModal";
import { useApiKeyGuard } from "@/hooks/useApiKeyGuard";
import { getLyricsEntry } from "@/lib/storage/storageService";
import type { ChatMessage } from "@/lib/storage/types";

export default function LyricsGenerator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isModalOpen, guardAction, closeModal } = useApiKeyGuard();

  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derive entry from storage whenever the route id changes.
  const entry = useMemo(
    () => (id ? getLyricsEntry(id) : null),
    [id]
  );

  // Scroll chat to bottom when chat history grows.
  const chatLength = entry?.chatHistory.length ?? 0;
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLength]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guardAction()) return;
    // TODO (US-010): send message to LLM client and update entry
    setMessage("");
  }

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
            <div ref={chatEndRef} />
          </div>

          {/* Message input + send */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2"
            data-testid="chat-form"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message…"
              aria-label="Chat message"
              className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="chat-input"
            />
            <Button type="submit" data-testid="chat-submit">
              Send
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
