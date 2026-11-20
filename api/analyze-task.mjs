// Vercel serverless function (used only when deployed to Vercel).
import { analyzeTask } from "../server/ai.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const result = await analyzeTask(req.body?.text, req.body?.image);
  res.status(result.error ? 400 : 200).json(result);
}
