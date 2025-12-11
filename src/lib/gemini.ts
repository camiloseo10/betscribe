import { GoogleGenAI } from "@google/genai";
import "./env-loader";

const apiKey = process.env.BETSCRIBE_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || null;

export const geminiClient: GoogleGenAI | null = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const MODEL_ID = process.env.GENAI_MODEL_ID || "gemini-1.5-pro";

export interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

function num(v: string | undefined, def: number) {
  const n = v ? parseFloat(v) : def
  return Number.isFinite(n) ? n : def
}

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: num(process.env.GENAI_TEMPERATURE, 0.7),
  maxOutputTokens: Math.max(512, Math.min(8192, Math.floor(num(process.env.GENAI_MAX_OUTPUT_TOKENS, 4000)))),
  topP: num(process.env.GENAI_TOP_P, 0.9),
  topK: Math.floor(num(process.env.GENAI_TOP_K, 40)),
};

class ConcurrencyPool {
  private capacity: number
  private current: number
  private queue: Array<() => void>
  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity)
    this.current = 0
    this.queue = []
  }
  async acquire(): Promise<() => void> {
    if (this.current < this.capacity) {
      this.current++
      return () => this.release()
    }
    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.current++
        resolve(() => this.release())
      })
    })
  }
  private release() {
    this.current = Math.max(0, this.current - 1)
    const next = this.queue.shift()
    if (next) next()
  }
}

export const genaiPool = new ConcurrencyPool(Math.max(1, parseInt(process.env.GENAI_CONCURRENCY || "2", 10)))
