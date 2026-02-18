import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch a single task with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        workers: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            category: true,
            status: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Authorization: admin sees all, regular user must be creator or assigned worker
    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";
    const isCreator = task.createdById === currentUser.id;
    const isAssigned = task.workers.some((w) => w.id === currentUser.id);

    if (!isAdmin && !isCreator && !isAssigned) {
      return NextResponse.json(
        { error: "No tienes permiso para ver esta tarea" },
        { status: 403 }
      );
    }

    return NextResponse.json({ task, isAdmin }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo tarea:", error);
    return NextResponse.json(
      { error: "Error al obtener tarea" },
      { status: 500 }
    );
  }
}
