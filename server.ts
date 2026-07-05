import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("Warning: GEMINI_API_KEY environment variable is not defined.");
}

app.post('/api/analyze-journal', async (req: any, res: any) => {
  try {
    if (!ai) {
      // Lazy initialization check
      const currentKey = process.env.GEMINI_API_KEY;
      if (currentKey) {
        ai = new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } else {
        return res.status(500).json({
          error: "Gemini API key is not configured. Please add it in Settings > Secrets."
        });
      }
    }

    const { entry } = req.body;
    if (!entry || typeof entry !== 'string' || entry.trim() === '') {
      return res.status(400).json({ error: "Journal entry is required and must be non-empty." });
    }

    const prompt = `Perform a supportive, mindful psychological analysis of the following personal journal entry.
    Understand the emotions, cognitive patterns (such as gratitude, growth mindset, resilient framing), and general mental state.
    Provide constructive, warm, non-judgmental guidance.
    
    Journal Entry:
    "${entry}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a highly empathetic, wise, and mindful AI journaling assistant. Your purpose is to act as a mirror, helping the writer reflect on their thoughts with kindness, self-compassion, and structural clarity. Avoid clinical diagnosis. Speak with gentle, humble, and inspiring language.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["moodProfile", "cognitiveStrengths", "reflectionFeedback", "suggestedIntention"],
          properties: {
            moodProfile: {
              type: Type.ARRAY,
              description: "A list of 2 to 3 dominant emotions detected in the entry.",
              items: {
                type: Type.OBJECT,
                required: ["emotion", "score", "description"],
                properties: {
                  emotion: { type: Type.STRING, description: "Name of the emotion (e.g., Hopeful, Overwhelmed, Peaceful)." },
                  score: { type: Type.INTEGER, description: "Percentage score of presence (e.g., 75)." },
                  description: { type: Type.STRING, description: "A very short explanation of how this emotion manifests in their text." }
                }
              }
            },
            cognitiveStrengths: {
              type: Type.ARRAY,
              description: "Healthy or adaptive cognitive styles seen in the text.",
              items: {
                type: Type.OBJECT,
                required: ["pattern", "evidence"],
                properties: {
                  pattern: { type: Type.STRING, description: "Name of the positive habit (e.g., Growth Mindset, Gratitude, Resilience)." },
                  evidence: { type: Type.STRING, description: "Brief snippet/evidence showing where or how they displayed this." }
                }
              }
            },
            reflectionFeedback: {
              type: Type.STRING,
              description: "A gentle, warm, and highly personalized paragraph of mindful reflection feedback."
            },
            suggestedIntention: {
              type: Type.STRING,
              description: "A single, clear intention or focus prompt for tomorrow to guide their focus."
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from the Gemini model.");
    }

    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Error during journal analysis:", error);
    res.status(500).json({ error: error?.message || "An unexpected error occurred during analysis." });
  }
});

// Setup Vite dev middleware or serve built frontend
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
  });
}

setupServer().catch(err => {
  console.error("Failed to start server:", err);
});
