export function classifyTask(text: string): {
  category: string; specificIssue: string; urgency: "Low" | "Medium" | "High"; safetyTip: string;
  suggestedTitle: string; confidence: number; source: "fallback";
};
export function checkReviewTextFallback(text: string): { flagged: boolean; reasons: string[]; source: "fallback" };
