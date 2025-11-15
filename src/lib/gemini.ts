import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || null;

export const geminiClient: GoogleGenAI | null = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const MODEL_ID = "gemini-2.5-pro";

export interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}