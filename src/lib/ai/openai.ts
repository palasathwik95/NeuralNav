// Server-only. Never import this from a "use client" component.
// The OpenAI API key is read exclusively from process.env here and
// is never forwarded to the browser.

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type { ChatCompletionMessageParam };

if (!process.env.OPENAI_API_KEY) {
  // Warn at module load time so the developer knows what's missing.
  // The error is caught gracefully in each API route.
  console.warn("[openai] OPENAI_API_KEY is not set. Assistant calls will fail.");
}

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "missing-key",
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/**
 * Send a chat completion request to OpenAI.
 * Returns the assistant's reply text, or throws on failure.
 */
export async function getChatCompletion(
  systemPrompt: string,
  conversationMessages: ChatCompletionMessageParam[],
  maxTokens = 600,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not configured.");
  }

  const completion = await openaiClient.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationMessages,
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    throw new Error("OpenAI returned an empty response.");
  }
  return reply.trim();
}
