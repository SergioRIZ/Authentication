import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// GET - List workers (two modes: default for assignment dropdowns, ?view=list for admin workers page)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const view = request?.url ? new URL(request.url).searchParams.get("view") : null;

    // Admin list view — returns all workers with department, function, and counts
    if (view === "list") {
      if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }

      const workers = await prisma.user.findMany({
        where: { emailVerified: { not: null } },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          department: true,
          jobFunction: true,
          createdAt: true,
          _count: {
            select: {
              assignedTasks: true,
              assignedCustomers: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ workers }, { status: 200 });
    }

    // Default mode — assignment dropdowns (existing behavior)
    let allowedRoles: Role[] = ["USER"];

    if (currentUser.role === "SUPER_ADMIN") {
      allowedRoles = ["USER", "ADMIN"];
    }

    const canAssignToSelf = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

    const workers = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        OR: [
          { role: { in: allowedRoles } },
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
