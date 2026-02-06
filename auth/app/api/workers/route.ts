import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List workers that can be assigned by the current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Determine which roles the current user can assign work to:
    // - USER can only assign to USER
    // - ADMIN can only assign to USER and themselves (not other ADMIN)
    // - SUPER_ADMIN can assign to USER, ADMIN, and themselves (not other SUPER_ADMIN)
    let allowedRoles: string[] = ["USER"];

    if (currentUser.role === "SUPER_ADMIN") {
      allowedRoles = ["USER", "ADMIN"];
    }

    // Get workers filtered by allowed roles
    // ADMIN and SUPER_ADMIN can also assign to themselves
    const canAssignToSelf = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

    const workers = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        OR: [
          { role: { in: allowedRoles } },
          // ADMIN and SUPER_ADMIN can also assign to themselves
          ...(canAssignToSelf ? [{ id: currentUser.id }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ workers }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo trabajadores:", error);
    return NextResponse.json(
      { error: "Error al obtener trabajadores" },
      { status: 500 }
    );
  }
}
