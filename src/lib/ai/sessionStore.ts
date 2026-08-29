// In-memory chat history store.
// Lives in the Next.js server process — survives across requests within one
// server session, resets on server restart.
// No database required.

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const MAX_MESSAGES = 100;

class SessionHistory {
  private messages: StoredMessage[] = [];

  getAll(): StoredMessage[] {
    return [...this.messages];
  }

  /** Returns the most recent N messages as OpenAI-compatible pairs. */
  getRecent(limit = 50): StoredMessage[] {
    return this.messages.slice(-limit);
  }

  push(role: "user" | "assistant", content: string): StoredMessage {
    const msg: StoredMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      content,
      created_at: new Date().toISOString(),
    };
    this.messages.push(msg);
    // Keep the store from growing unbounded
    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }
    return msg;
  }

  clear(): void {
    this.messages = [];
  }
}

// Singleton — shared across all API route invocations in the same process.
export const sessionHistory = new SessionHistory();
