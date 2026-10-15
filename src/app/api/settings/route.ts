import { NextResponse } from "next/server"
import { getSettings } from "@/lib/db-actions"

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
  }
}
