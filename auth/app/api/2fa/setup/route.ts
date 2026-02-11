import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTwoFactorSecret } from "@/lib/two-factor";
import QRCode from "qrcode";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, twoFactorEnabled: true } as any,
    }) as any;

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA ya está activado en tu cuenta" },
        { status: 400 }
      );
    }

    // Generate secret and URI
    const { encryptedSecret, plainSecret, uri } = generateTwoFactorSecret(user.email);

    // Store encrypted secret (not enabled yet until user verifies)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: encryptedSecret } as any,
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(uri);

    return NextResponse.json({
      secret: plainSecret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Error al configurar 2FA" },
      { status: 500 }
    );
  }
}
