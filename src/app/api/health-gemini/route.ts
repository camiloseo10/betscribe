import { NextResponse } from "next/server"
import "@/lib/env-loader"
import { geminiClient, MODEL_ID } from "@/lib/gemini"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!geminiClient) {
      return NextResponse.json({ status: "error", message: "Gemini client not initialized (missing API Key)" }, { status: 500 })
    }

    // Usando la sintaxis del nuevo SDK @google/genai
    const response = await geminiClient.models.generateContent({
      model: MODEL_ID,
      contents: "Hello",
    });

    // CORRECCIÓN AQUÍ:
    // 'text' es un getter (propiedad), no una función. Se usa sin paréntesis.
    const text = response.text; 

    return NextResponse.json({ 
      status: "ok", 
      gemini: "connected", 
      model: MODEL_ID,
      response: text
    })
  } catch (e: any) {
    console.error("Gemini Error:", e);
    return NextResponse.json({ 
      status: "error", 
      message: e.message, 
      code: e.code || e.status,
      stack: e.stack 
    }, { status: 500 })
  }
}