import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { BCRYPT_SALT_ROUNDS } from "@/lib/constants";
 
export async function POST(request: Request) {
  try {
    // Rate limit: 5 reset attempts per IP per 15 minutes
    const ip = getClientIp(request);
    const rl = rateLimit(`reset-password:${ip}`, { maxRequests: 5, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
      );
    }
 
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);
 
    // Buscar token válido
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });
 
    if (!resetToken) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      );
    }
 
    // Verificar expiración
    if (resetToken.expiresAt < new Date()) {
      // Eliminar token expirado
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });
 
      return NextResponse.json(
        { error: "El enlace ha expirado. Solicita uno nuevo." },
        { status: 400 }
      );
    }
 
    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
 
    // Actualizar contraseña y eliminar token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
    ]);
 
    return NextResponse.json(
      { message: "Contraseña actualizada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
 
    console.error("Reset-password error");
    ;
  }
}