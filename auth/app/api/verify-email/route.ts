import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token requerido").max(256),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`verify-email:${ip}`, { maxRequests: 10, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
      );
    }

    const body = await request.json();
    const { token } = verifyEmailSchema.parse(body);

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });
      return NextResponse.json(
        { error: "El enlace ha expirado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() }
      }),
      prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      })
    ]);

    await logAuditEvent({
      userId: verificationToken.userId,
      action: "EMAIL_VERIFIED",
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json(
      { message: "Email verificado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }

    console.error("Verify-email error");
    return NextResponse.json(
      { error: "Error al verificar el email" },
      { status: 500 }
    );
  }
}
