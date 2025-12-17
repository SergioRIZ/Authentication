import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

// Schema de validación
const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar con Zod
    const { email } = forgotPasswordSchema.parse(body);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // IMPORTANTE: Por seguridad, siempre devolvemos el mismo mensaje
    // No revelamos si el email existe o no (evita enumeración de usuarios)
    const successMessage = {
      message: "Si el email existe, recibirás un enlace de recuperación",
    };

    // Si el usuario no existe, devolvemos éxito pero no hacemos nada
    if (!user) {
      return NextResponse.json(successMessage, { status: 200 });
    }

    // Si el usuario existe pero no tiene password (login con Google)
    if (!user.password) {
      return NextResponse.json(successMessage, { status: 200 });
    }

    // Generar token único y seguro (32 bytes = 64 caracteres hex)
    const token = crypto.randomBytes(32).toString("hex");

    // Calcular fecha de expiración (1 hora desde ahora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Guardar token en la base de datos
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Enviar email
    const emailResult = await sendPasswordResetEmail(user.email, token);

    if (!emailResult.success) {
      console.error("Error sending email:", emailResult.error);
      return NextResponse.json(
        { error: "Error al enviar el email" },
        { status: 500 }
      );
    }

    return NextResponse.json(successMessage, { status: 200 });
  } catch (error) {
    // Errores de validación de Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    console.error("Error in forgot-password endpoint:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}