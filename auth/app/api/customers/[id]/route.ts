import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch a single customer with associated tasks
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

    const customer = await prisma.customer.findUnique({
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
        tasks: {
          include: {
            workers: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [
            { status: "asc" },
            { priority: "desc" },
            { dueDate: "asc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Authorization: admin sees all, regular user must be creator or assigned worker
    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";
    const isCreator = customer.createdById === currentUser.id;
    const isAssigned = customer.workers.some((w) => w.id === currentUser.id);

    if (!isAdmin && !isCreator && !isAssigned) {
      return NextResponse.json(
        { error: "No tienes permiso para ver este cliente" },
        { status: 403 }
      );
    }

    return NextResponse.json({ customer, isAdmin }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    );
  }
}
