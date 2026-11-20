// Vercel serverless function: public runtime settings for the browser.
export default function handler(req, res) {
  res.status(200).json({ googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || null, ai: process.env.GEMINI_API_KEY ? "gemini" : "fallback" });
}
