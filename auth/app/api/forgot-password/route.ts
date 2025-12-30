import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
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
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

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
    
    await sendPasswordResetEmail(email, resetUrl);

    return successResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}