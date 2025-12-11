import { NextResponse } from "next/server"
import "@/lib/env-loader"
import { db } from "@/db"
import { users } from "@/db/schema"
import { sql } from "drizzle-orm"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check Env Vars
    const url = process.env.BETSCRIBE_DB_URL ? "Set" : "Missing"
    const token = process.env.BETSCRIBE_DB_TOKEN ? "Set" : "Missing"
    
    // Check DB Connection
    if (!db) {
      return NextResponse.json({ status: "error", message: "DB client not initialized", env: { url, token } }, { status: 500 })
    }

    // Try query
    const result = await db.select({ count: sql<number>`count(*)` }).from(users)
    
    return NextResponse.json({ 
      status: "ok", 
      db: "connected", 
      userCount: result[0]?.count,
      env: { url, token }
    })
  } catch (e: any) {
    return NextResponse.json({ 
      status: "error", 
      message: e.message, 
      stack: e.stack 
    }, { status: 500 })
  }
}
