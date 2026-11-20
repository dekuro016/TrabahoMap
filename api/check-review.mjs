// Vercel serverless function (used only when deployed to Vercel).
import { checkReview } from "../server/ai.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  res.status(200).json(await checkReview(req.body?.text || "", req.body?.rating || 0));
}
