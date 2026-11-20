export interface AssistantSummary {
  category: string; title: string; description: string; specificIssue: string;
  urgency: "Low" | "Medium" | "High"; safetyTip: string; townId: string | null; barangay: string | null;
  confidence: number; source: "gemini" | "fallback";
}
export interface AssistantReply {
  reply: string; quickReplies: string[]; emergency: string | null; summary: AssistantSummary | null; source: "gemini" | "fallback"; stage?: string;
}
export function assistantFallback(messages: { role: "user" | "assistant"; text: string; stage?: string }[]): AssistantReply;
export function buildSummary(userTexts: string[], overrides?: Partial<AssistantSummary>): AssistantSummary;
export function emergencyAdvice(text: string): string | null;
