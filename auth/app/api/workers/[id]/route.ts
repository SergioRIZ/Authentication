import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";

// GET - Fetch a single worker with assigned tasks and customers
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

    // Admin-only access
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    const worker = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        jobFunction: true,
        emailVerified: true,
        createdAt: true,
        assignedTasks: {
          include: {
            customer: {
              select: { id: true, name: true },
            },
            workers: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: [
            { status: "asc" },
            { priority: "desc" },
            { dueDate: "asc" },
          ],
        },
        assignedCustomers: {
          include: {
            workers: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ worker }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo trabajador:", error);
    return NextResponse.json(
      { error: "Error al obtener trabajador" },
      { status: 500 }
    );
  }
}

// PATCH - Update worker department and/or function
export async function PATCH(
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

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    const workerExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!workerExists) {
      return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
    }

    const body = await request.json();

    // Build update data from allowed fields
    const updateData: { department?: string | null; jobFunction?: string | null } = {};

    if ("department" in body) {
      updateData.department = body.department?.trim() || null;
    }
    if ("jobFunction" in body) {
      updateData.jobFunction = body.jobFunction?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    const worker = await prisma.user.update({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        jobFunction: true,
      },
    data: updateData,
    });

    // Audit log
    logAuditEvent({
      userId: currentUser.id,
      action: "WORKER_PROFILE_UPDATED",
      details: `Updated worker ${worker.name || worker.email}: ${JSON.stringify(updateData)}`,
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({ worker }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando trabajador:", error);
    return NextResponse.json(
      { error: "Error al actualizar trabajador" },
      { status: 500 }
    );
  }
}
