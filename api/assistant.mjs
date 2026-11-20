// Vercel serverless function (used only when deployed to Vercel).
import { assistantTurn } from "../server/ai.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const result = await assistantTurn(req.body?.messages);
  res.status(result.error ? 400 : 200).json(result);
}
