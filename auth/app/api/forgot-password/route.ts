import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
  TOKEN_BYTE_LENGTH,
} from "@/lib/constants";

export async function POST(request: Request) {
  try {
    // Rate limit: 3 forgot-password attempts per IP per 15 minutes
    const ip = getClientIp(request);
    const rl = rateLimit(`forgot-password:${ip}`, { maxRequests: 3, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
      );
    }

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Siempre responder igual para evitar enumeration attacks
    const successResponse = NextResponse.json(
      { message: "Si el email existe, recibirás un enlace para restablecer tu contraseña" },
      { status: 200 }
    );

    if (!user) {
      return successResponse;
    }

    // Si el usuario no tiene password (login con Google), no puede resetear
    if (!user.password) {
      return successResponse;
    }

    // Eliminar tokens anteriores del usuario
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Crear nuevo token
    const token = randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      }
    });

    // Enviar email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    return successResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    console.error("Forgot-password error");
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}