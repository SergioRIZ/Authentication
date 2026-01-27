import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET - Listar todos los usuarios
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que es admin o super_admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      users,
      currentUserRole: currentUser.role 
    }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar rol de usuario
const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar rol del usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = updateRoleSchema.parse(body);

    // Obtener usuario objetivo
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // === REGLAS DE PERMISOS ===

    // No permitir que nadie se modifique a sí mismo
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "No puedes modificar tu propio rol" },
        { status: 400 }
      );
    }

    // Solo SUPER_ADMIN puede:
    // - Crear/modificar otros SUPER_ADMIN
    // - Modificar ADMIN
    // - Asignar rol SUPER_ADMIN o ADMIN
    if (currentUser.role === "ADMIN") {
      // Admin no puede tocar a otros admins o super_admins
      if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "No tienes permisos para modificar a este usuario" },
          { status: 403 }
        );
      }
      // Admin no puede asignar rol ADMIN o SUPER_ADMIN
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "No tienes permisos para asignar este rol" },
          { status: 403 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    console.error("Error actualizando rol:", error);
    return NextResponse.json(
      { error: "Error al actualizar rol" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar rol del usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId requerido" },
        { status: 400 }
      );
    }

    // No permitir que nadie se elimine a sí mismo
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "No puedes eliminarte a ti mismo" },
        { status: 400 }
      );
    }

    // Obtener usuario objetivo
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // === REGLAS DE ELIMINACIÓN ===

    // ADMIN solo puede eliminar USER
    if (currentUser.role === "ADMIN") {
      if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "No tienes permisos para eliminar a este usuario" },
          { status: 403 }
        );
      }
    }

    // SUPER_ADMIN puede eliminar a cualquiera (excepto a sí mismo, ya verificado)

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { message: "Usuario eliminado" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}