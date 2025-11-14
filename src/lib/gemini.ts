import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_GEMINI_API_KEY no está configurada en las variables de entorno");
}

export const geminiClient = new GoogleGenAI({
  apiKey,
});

export const MODEL_ID = "gemini-2.5-pro";

export interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}