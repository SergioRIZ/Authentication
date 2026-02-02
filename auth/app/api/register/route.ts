import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationEmail } from "@/lib/email";
import { validateEmailForRegistration } from "@/lib/email-validation";
import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  BCRYPT_SALT_ROUNDS,
  EMAIL_VERIFICATION_TOKEN_EXPIRY_MS,
  TOKEN_BYTE_LENGTH,
} from "@/lib/constants";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 registration attempts per IP per 15 minutes
    const ip = getClientIp(request);
    const rl = await rateLimit(`register:${ip}`, { maxRequests: 5, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Normalize email
    const normalizedEmail = validatedData.email.toLowerCase().trim();

    // Validate email domain (disposable + MX check)
    const emailValidation = await validateEmailForRegistration(normalizedEmail);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.reason },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);

    // In development mode, auto-verify accounts
    const isDevelopment = process.env.NODE_ENV === "development";

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: validatedData.name,
        password: hashedPassword,
        emailVerified: isDevelopment ? new Date() : null,
      },
    });

    // Only send verification email in production
    if (!isDevelopment) {
      // Create verification token
      const token = randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_MS);

      await prisma.emailVerificationToken.create({
        data: { token, userId: user.id, expiresAt }
      });

      // Send verification email
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
      await sendVerificationEmail(normalizedEmail, verifyUrl);
    }

    // Audit log
    await logAuditEvent({
      userId: user.id,
      action: "REGISTER",
      details: isDevelopment
        ? "Registro con email y contraseña (auto-verificado en desarrollo)"
        : "Registro con email y contraseña",
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json(
      {
        message: isDevelopment
          ? "Usuario creado y verificado automáticamente (modo desarrollo)."
          : "Usuario creado. Revisa tu email para verificar tu cuenta.",
        user: { id: user.id, email: user.email, name: user.name },
        autoVerified: isDevelopment,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error");
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
