import { GoogleGenAI } from "@google/genai";
import { getExpertLaundryResponse } from "../src/utils/laundryKnowledge";

export default async function handler(req: any, res: any) {
  // Support CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, model = "gemini-3.5-flash", systemInstruction } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user" || !m.role);
    const queryText = lastUserMessage?.text || lastUserMessage?.content || "";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const defaultSystemInstruction = `You are Sparkle AI, the friendly and expert Virtual Laundry Care Specialist for Sparkle Spins Laundry Co. (serving PCEA Tumutumu Hospital, Karatina Town, Mathira and nearby areas).

Your capabilities & core knowledge:
1. Operations & Pickups: We offer convenient doorstep laundry collection & delivery in Tumutumu Hospital & Karatina. Turnaround is 24-48 hours. Payments on delivery (M-Pesa/Cash).
2. Fabric Care & Stain Treatment: Immediate practical stain removal advice.
3. Communication Style: Warm, empathetic, professional, clear, and structured. Always sign off cheerfully!`;

        const contents = messages.map((m: { role: string; content?: string; text?: string }) => ({
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: m.text || m.content || "" }],
        }));

        const response = await ai.models.generateContent({
          model: model || "gemini-3.5-flash",
          contents,
          config: {
            systemInstruction: systemInstruction || defaultSystemInstruction,
          },
        });

        if (response.text) {
          return res.status(200).json({ reply: response.text });
        }
      } catch (geminiErr) {
        console.warn("[Vercel /api/chat] Gemini API note, using expert knowledge fallback:", geminiErr);
      }
    }

    // Fallback to built-in expert laundry knowledge
    const reply = getExpertLaundryResponse(queryText);
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error("[Vercel /api/chat] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process chat" });
  }
}
