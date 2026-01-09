import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 400 }
      );
    }

    // Buscar token válido
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

    // Verificar expiración
    if (verificationToken.expiresAt < new Date()) {
      // Eliminar token expirado
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });

      return NextResponse.json(
        { error: "El enlace ha expirado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    // Verificar email y eliminar token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() }
      }),
      prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      })
    ]);

    return NextResponse.json(
      { message: "Email verificado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verificando email:", error);
    return NextResponse.json(
      { error: "Error al verificar el email" },
      { status: 500 }
    );
  }
}