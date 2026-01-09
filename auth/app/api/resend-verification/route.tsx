import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
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
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

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
    
    await sendVerificationEmail(email, verifyUrl);

    return successResponse;
  } catch (error) {
    console.error("Error reenviando verificación:", error);
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 }
    );
  }
}