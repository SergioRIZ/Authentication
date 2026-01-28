import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTwoFactorCode } from "@/lib/two-factor";
import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";
import { z } from "zod";

const disableSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = disableSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true } as any,
    }) as any;

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA no está activado en tu cuenta" },
        { status: 400 }
      );
    }

    // Verify the code before disabling
    const isValid = verifyTwoFactorCode(user.twoFactorSecret, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Código incorrecto. Inténtalo de nuevo." },
        { status: 400 }
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      } as any,
    });

    await logAuditEvent({
      userId: user.id,
      action: "TWO_FACTOR_DISABLED",
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({
      message: "2FA desactivado correctamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Error al desactivar 2FA" },
      { status: 500 }
    );
  }
}
