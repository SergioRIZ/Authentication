import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Periodic cleanup of expired tokens.
 * Call via cron job (e.g., Vercel Cron, external scheduler).
 * Protected by a shared secret in the Authorization header.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();

    const [emailTokens, passwordTokens] = await Promise.all([
      prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    return NextResponse.json({
      deleted: {
        emailVerificationTokens: emailTokens.count,
        passwordResetTokens: passwordTokens.count,
      },
    });
  } catch (error) {
    console.error("Token cleanup error:", error);
    return NextResponse.json(
      { error: "Error durante la limpieza de tokens" },
      { status: 500 }
    );
  }
}
