import { handlers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export const { GET } = handlers

export async function POST(request: NextRequest) {
  // Rate limit credential login attempts (10 per IP per 15 minutes)
  if (request.url.includes("/callback/credentials")) {
    const ip = getClientIp(request)
    const rl = await rateLimit(`login:${ip}`, { maxRequests: 10, windowSeconds: 900 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
      )
    }
  }

  return handlers.POST(request)
}
