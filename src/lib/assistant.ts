// Browser side of the AI Assistant: talks to /api/assistant (Gemini on the server).
// If the server can't be reached (e.g. the one-file preview), the same rule-based assistant runs locally.
import { assistantFallback, type AssistantReply, type AssistantSummary } from "../../shared/assistant.js";

export type { AssistantReply, AssistantSummary };

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  stage?: string;
  emergency?: string | null;
  quickReplies?: string[];
  summary?: AssistantSummary | null;
  source?: "gemini" | "fallback";
}

export async function askAssistant(history: ChatMessage[]): Promise<AssistantReply> {
  const messages = history.map(({ role, text, stage }) => ({ role, text, stage }));
  if (window.location.protocol !== "file:") {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok && (res.headers.get("content-type") || "").includes("json")) {
        const r = (await res.json()) as AssistantReply;
        if (r && typeof r.reply === "string") return r;
      }
    } catch {
      /* fall through to the local assistant */
    }
  }
  return assistantFallback(messages);
}
