"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, Send, Trash2 } from "lucide-react";
import { ChatMessage, Profile, ProfileDelta, PathSuggestionPayload } from "@/lib/types";
import { supabase, DEMO_USER_ID, isSupabaseConfigured } from "@/lib/supabaseClient";

interface ChatPanelProps {
  profile: Profile;
  onProfileDelta: (delta: ProfileDelta) => void;
  onPathSuggestion: (suggestion: PathSuggestionPayload) => void;
}

export default function ChatPanel({ profile, onProfileDelta, onPathSuggestion }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/chat");
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        } else {
          // First time - show greeting
          setMessages([
            {
              role: "assistant",
              content: `Hey ${profile.name.split(" ")[0]}, good to see you. You're working toward your goal to ${profile.goal.toLowerCase()}. How's the week gone — did you get through the React module, or did something get in the way?`,
            },
          ]);
        }
      } catch {
        // Fallback to greeting
        setMessages([
          {
            role: "assistant",
            content: `Hey ${profile.name.split(" ")[0]}, good to see you. You're working toward your goal to ${profile.goal.toLowerCase()}. How's the week gone — did you get through the React module, or did something get in the way?`,
          },
        ]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [profile.name, profile.goal]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, profile }),
      });
      const data = await res.json();
      if (data.profileDelta) onProfileDelta(data.profileDelta);
      if (data.pathSuggestion) onPathSuggestion(data.pathSuggestion);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I lost the trail for a second there — mind sending that again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = ["I finished it, felt pretty good", "I only got halfway", "Life got busy this week"];

  const clearChatHistory = async () => {
    if (confirm("Are you sure you want to clear your chat history? This cannot be undone.")) {
      if (isSupabaseConfigured) {
        await supabase.from("chat_messages").delete().eq("user_id", DEMO_USER_ID);
      }
      setMessages([
        {
          role: "assistant",
          content: `Hey ${profile.name.split(" ")[0]}, good to see you. You're working toward your goal to ${profile.goal.toLowerCase()}. How's the week gone — did you get through the React module, or did something get in the way?`,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[640px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-3">
        {loadingHistory && (
          <div className="text-center py-8 text-trail-faint text-sm">Loading chat history...</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-trail-surface2 border border-trail-border">
                <Compass size={14} className="text-trail-amber" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 font-sans text-[14.5px] leading-relaxed ${
                m.role === "user"
                  ? "bg-trail-teal text-trail-tealText"
                  : "bg-trail-surface2 text-trail-text border border-trail-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-trail-surface2 border border-trail-border">
              <Compass size={14} className="text-trail-amber" />
            </div>
            <div className="rounded-2xl px-4 py-3 flex gap-1 bg-trail-surface2 border border-trail-border">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-trail-faint"
                  style={{ animation: `trailhead-bounce 1.1s ${i * 0.15}s infinite ease-in-out` }}
                />
              ))}
            </div>
          </div>
        )}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 pl-9">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full px-3 py-1.5 font-sans text-[13px] text-trail-text border border-trail-borderStrong"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-trail-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tell Pathfinder how your week went..."
          className="flex-1 rounded-xl px-4 py-2.5 outline-none bg-trail-surface2 text-trail-text border border-trail-border font-sans text-[14.5px]"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 border ${
            input.trim() ? "bg-trail-amber border-trail-amberDark" : "bg-trail-surface2 border-trail-border"
          } ${loading ? "opacity-60" : ""}`}
        >
          <Send size={16} className={input.trim() ? "text-trail-amberText" : "text-trail-faint"} />
        </button>
        <button
          onClick={clearChatHistory}
          className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 border border-trail-border bg-trail-surface2 hover:bg-trail-surface hover:border-trail-borderStrong transition-colors"
          title="Clear chat history"
        >
          <Trash2 size={16} className="text-trail-muted" />
        </button>
      </div>
    </div>
  );
}
