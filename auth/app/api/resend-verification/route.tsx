import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  EMAIL_VERIFICATION_TOKEN_EXPIRY_MS,
  TOKEN_BYTE_LENGTH,
} from "@/lib/constants";

export async function POST(request: Request) {
  try {
    // Rate limit: 3 resend attempts per IP per 15 minutes
    const ip = getClientIp(request);
    const rl = rateLimit(`resend-verification:${ip}`, { maxRequests: 3, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Responder igual para evitar enumeration
    const successResponse = NextResponse.json(
      { message: "Si el email existe y no está verificado, recibirás un nuevo enlace." },
      { status: 200 }
    );

    if (!user) {
      return successResponse;
    }

    // Si ya está verificado
    if (user.emailVerified) {
      return successResponse;
    }

    // Eliminar tokens anteriores
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id }
    });

    // Crear nuevo token
    const token = randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_MS);

    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      }
    });

    // Enviar email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    await sendVerificationEmail(normalizedEmail, verifyUrl);

    return successResponse;
  } catch (error) {
    console.error("Resend-verification error");
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 }
    );
  }
}