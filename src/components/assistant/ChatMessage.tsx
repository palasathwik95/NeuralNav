"use client";

import { Compass } from "lucide-react";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  /** When true, this message is in an error state and can be retried. */
  isError?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageItem;
  onRetry?: () => void;
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === "user";
  const time = formatTime(message.createdAt);

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={`${isUser ? "Your message" : "Pathfinder's message"}`}
    >
      {/* Avatar — only for assistant */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-trail-surface2 border border-trail-border"
          aria-hidden="true"
        >
          <Compass size={14} className="text-trail-amber" />
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[78%]">
        <div
          className={`rounded-2xl px-4 py-3 font-sans text-[14.5px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-trail-teal text-trail-tealText rounded-br-sm"
              : message.isError
                ? "bg-trail-surface2 text-trail-muted border border-trail-border rounded-bl-sm"
                : "bg-trail-surface2 text-trail-text border border-trail-border rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        <div
          className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}
        >
          {time && (
            <span className="font-sans text-[11px] text-trail-faint" aria-label={`Sent at ${time}`}>
              {time}
            </span>
          )}
          {message.isError && onRetry && (
            <button
              onClick={onRetry}
              className="font-sans text-[11px] text-trail-amber underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-trail-amber rounded"
              aria-label="Retry sending message"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
