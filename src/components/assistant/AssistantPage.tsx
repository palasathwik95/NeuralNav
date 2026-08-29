"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Compass, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import ChatMessage, { type ChatMessageItem } from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import SuggestedQuestions from "./SuggestedQuestions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

type AIStatus = "idle" | "loading" | "unavailable" | "error";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [aiStatus, setAiStatus] = useState<AIStatus>("idle");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages or typing status changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, aiStatus]);

  // ---------------------------------------------------------------------------
  // Load persisted history on mount
  // ---------------------------------------------------------------------------

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/chat/history");
      if (!res.ok) throw new Error("History fetch failed");
      const data: { messages: HistoryMessage[] } = await res.json();
      const loaded: ChatMessageItem[] = (data.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      }));
      setMessages(loaded);
    } catch {
      // Not fatal — simply starts with an empty conversation.
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ---------------------------------------------------------------------------
  // Send a message
  // ---------------------------------------------------------------------------

  const send = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || aiStatus === "loading") return;

      // Optimistic user message bubble
      const userMsg: ChatMessageItem = {
        id: `opt-user-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLastUserMessage(text);
      setAiStatus("loading");

      try {
        // 30-second client-side timeout so the UI never hangs indefinitely.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let res: Response;
        try {
          res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const data: { reply: string; error?: string } = await res.json();

        if (data.reply === "__AI_UNAVAILABLE__" || data.error === "ai_unavailable") {
          setAiStatus("unavailable");
          return;
        }

        const assistantMsg: ChatMessageItem = {
          id: `opt-asst-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setAiStatus("idle");
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        const errorMsg: ChatMessageItem = {
          id: `opt-err-${Date.now()}`,
          role: "assistant",
          content: isAbort
            ? "The request timed out. Please try again."
            : "Something went wrong reaching the server. Check your connection and try again.",
          createdAt: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
        setAiStatus("error");
      }
    },
    [input, aiStatus],
  );

  // ---------------------------------------------------------------------------
  // Retry last user message
  // ---------------------------------------------------------------------------

  const retry = useCallback(() => {
    if (!lastUserMessage) return;
    // Remove the last assistant error bubble before retrying
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && (last.isError || aiStatus === "unavailable")) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setAiStatus("idle");
    send(lastUserMessage);
  }, [lastUserMessage, aiStatus, send]);

  // ---------------------------------------------------------------------------
  // Clear conversation — deletes from the database, not just React state
  // ---------------------------------------------------------------------------

  const clearConversation = useCallback(async () => {
    if (clearing) return;
    setClearing(true);
    try {
      const res = await fetch("/api/chat/history", { method: "DELETE" });
      if (!res.ok) throw new Error("Clear failed");
      setMessages([]);
      setAiStatus("idle");
      setLastUserMessage("");
    } catch {
      // Silently absorb — conversation is still usable
    } finally {
      setClearing(false);
    }
  }, [clearing]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isTyping = aiStatus === "loading";
  const isEmpty = !historyLoading && messages.length === 0;

  // Show suggested questions in empty state, and as a nudge after a short convo
  const showSuggestionsInline =
    !historyLoading &&
    messages.length >= 2 &&
    messages.length <= 4 &&
    !isTyping &&
    aiStatus === "idle";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-trail-bg">
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col"
        style={{ minHeight: "100svh" }}
      >
        {/* ── Header ── */}
        <header className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-trail-surface2 border border-trail-border"
              aria-hidden="true"
            >
              <Compass size={20} className="text-trail-amber" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-trail-text leading-tight">
                AI Learning Mentor
              </h1>
              <p className="font-sans text-xs text-trail-muted leading-tight mt-0.5">
                Your personal guide for learning, projects, skills, and career goals.
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              disabled={clearing || isTyping}
              aria-label="Clear conversation history"
              title="Clear conversation"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-sans text-[12.5px] text-trail-muted border border-trail-border hover:border-trail-borderStrong hover:text-trail-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-trail-amber disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {clearing ? (
                <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={13} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </header>

        {/* ── AI Unavailable Banner ── */}
        {aiStatus === "unavailable" && (
          <div
            role="alert"
            className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3 bg-trail-surface border border-trail-amberDark"
          >
            <AlertTriangle
              size={16}
              className="text-trail-amber shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[13.5px] text-trail-text leading-relaxed">
                Your AI mentor is temporarily unavailable. Your personalized
                recommendations and learning path are still available on the dashboard.
              </p>
            </div>
            <button
              onClick={retry}
              className="font-sans text-[12.5px] text-trail-amber underline underline-offset-2 shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-trail-amber rounded"
              aria-label="Retry connecting to AI mentor"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Message List ── */}
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-4 py-2 pr-1 -mr-1"
          aria-label="Conversation"
          aria-live="polite"
          aria-atomic="false"
        >
          {/* Loading skeleton while history is fetched */}
          {historyLoading && (
            <div className="flex flex-col gap-3 py-4" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {i % 2 !== 0 && (
                    <div className="w-7 h-7 rounded-full bg-trail-surface2 border border-trail-border shrink-0" />
                  )}
                  <div
                    className="rounded-2xl bg-trail-surface2 border border-trail-border"
                    style={{ height: 40, width: `${38 + i * 15}%`, opacity: 0.45 }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty state with suggested questions */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center flex-1 py-10 gap-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-trail-surface2 border border-trail-border">
                <Compass size={28} className="text-trail-amber" aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-lg text-trail-text">
                  How can I help you today?
                </p>
                <p className="font-sans text-sm text-trail-muted mt-1 max-w-sm mx-auto">
                  I know your learning path, skill gaps, and progress. Ask me anything.
                </p>
              </div>
              <SuggestedQuestions onSelect={send} disabled={isTyping} />
            </div>
          )}

          {/* Rendered messages */}
          {!historyLoading &&
            messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                onRetry={m.isError ? retry : undefined}
              />
            ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          {/* Inline suggested questions nudge after a short conversation */}
          {showSuggestionsInline && (
            <div className="pt-1 pl-9">
              <p className="font-sans text-[11.5px] text-trail-faint mb-2">
                You might also ask:
              </p>
              <SuggestedQuestions onSelect={send} disabled={isTyping} />
            </div>
          )}
        </main>

        {/* ── Chat Input ── */}
        <div className="mt-2">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={send}
            disabled={isTyping}
          />
          <p className="font-sans text-[11px] text-trail-faint text-center mt-2 select-none">
            Enter to send&nbsp;&nbsp;·&nbsp;&nbsp;Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
