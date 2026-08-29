"use client";

import { useRef } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Ask Pathfinder anything about your learning path...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-resize up to ~5 lines
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 pt-3 border-t border-trail-border">
      <label htmlFor="assistant-input" className="sr-only">
        Message Pathfinder
      </label>
      <textarea
        id="assistant-input"
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Message Pathfinder"
        className="flex-1 resize-none rounded-xl px-4 py-2.5 outline-none bg-trail-surface2 text-trail-text border border-trail-border font-sans text-[14.5px] placeholder:text-trail-faint focus:border-trail-borderStrong transition-colors disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
        style={{ minHeight: "44px", maxHeight: "120px" }}
      />
      <button
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-trail-amber ${
          canSend
            ? "bg-trail-amber border-trail-amberDark hover:bg-trail-amberDark"
            : "bg-trail-surface2 border-trail-border"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <Send
          size={16}
          className={canSend ? "text-trail-amberText" : "text-trail-faint"}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
