import { NextResponse } from "next/server"
import "@/lib/env-loader"
import { geminiClient, MODEL_ID } from "@/lib/gemini"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!geminiClient) {
      return NextResponse.json({ status: "error", message: "Gemini client not initialized (missing API Key)" }, { status: 500 })
    }

    const response = await geminiClient.models.generateContent({
      model: MODEL_ID,
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    });

    // Handle different response structures from new SDK
    const text = response.response?.text() || JSON.stringify(response);

    return NextResponse.json({ 
      status: "ok", 
      gemini: "connected", 
      model: MODEL_ID,
      response: text
    })
  } catch (e: any) {
    return NextResponse.json({ 
      status: "error", 
      message: e.message, 
      code: e.code || e.status,
      stack: e.stack 
    }, { status: 500 })
  }
}
