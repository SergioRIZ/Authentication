import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema, updateTaskSchema } from "@/lib/validations/task";
import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";
import { z } from "zod";

// Helper function to get allowed roles for task assignment
function getAllowedRolesForAssignment(userRole: string): string[] {
  if (userRole === "SUPER_ADMIN") {
    return ["USER", "ADMIN"];
  }
  // Both USER and ADMIN can only assign to USER
  return ["USER"];
}

// Validate that worker IDs only include users with allowed roles
// SUPER_ADMIN can also assign to themselves (but not other SUPER_ADMINs)
async function validateWorkerAssignment(
  workerIds: string[],
  userRole: string,
  currentUserId: string
): Promise<{ valid: boolean; error?: string }> {
  if (!workerIds || workerIds.length === 0) {
    return { valid: true };
  }

  const allowedRoles = getAllowedRolesForAssignment(userRole);

  // Check if any of the workers have roles that shouldn't be assigned
  const invalidWorkers = await prisma.user.findMany({
    where: {
      id: { in: workerIds },
      role: { notIn: allowedRoles },
      // SUPER_ADMIN can assign to themselves
      ...(userRole === "SUPER_ADMIN" ? { NOT: { id: currentUserId } } : {}),
    },
    select: { id: true, role: true, name: true },
  });

  if (invalidWorkers.length > 0) {
    return {
      valid: false,
      error: "No puedes asignar tareas a usuarios con roles superiores o iguales al tuyo",
    };
  }

  return { valid: true };
}

// GET - List tasks (filtered by assignment for regular users)
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get current user with role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const customerId = searchParams.get("customerId");

    const where: any = {};

    // Regular users can only see tasks assigned to them or created by them
    if (!isAdmin) {
      where.OR = [
        { workers: { some: { id: currentUser.id } } },
        { createdById: currentUser.id },
      ];
    }

    if (status && ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      where.status = status;
    }

    if (priority && ["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      where.priority = priority;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
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
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ tasks, isAdmin }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}

// POST - Create new task
export async function POST(request: Request) {
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

    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    // Validate worker assignments based on role hierarchy
    if (validatedData.workerIds && validatedData.workerIds.length > 0) {
      const validation = await validateWorkerAssignment(
        validatedData.workerIds,
        currentUser.role,
        currentUser.id
      );
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 403 });
      }
    }

    // Parse dates
    const dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status,
        priority: validatedData.priority,
        dueDate,
        startDate,
        customerId: validatedData.customerId || null,
        createdById: currentUser.id,
        workers: {
          connect: validatedData.workerIds?.map((id) => ({ id })) || [],
        },
      },
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
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await logAuditEvent({
      userId: currentUser.id,
      action: "TASK_CREATED",
      details: `Tarea "${task.title}" creada`,
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creando tarea:", error);
    return NextResponse.json(
      { error: "Error al crear tarea" },
      { status: 500 }
    );
  }
}

// PATCH - Update task
export async function PATCH(request: Request) {
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

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const existingTask = await prisma.task.findUnique({
      where: { id: validatedData.id },
      include: { workers: { select: { id: true } } },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Check permission: admin, creator, or assigned worker
    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";
    const isCreator = existingTask.createdById === currentUser.id;
    const isAssigned = existingTask.workers.some((w) => w.id === currentUser.id);

    if (!isAdmin && !isCreator && !isAssigned) {
      return NextResponse.json({ error: "No tienes permiso para editar esta tarea" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    const oldStatus = existingTask.status;

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // Set completedAt when task is completed
      if (validatedData.status === "COMPLETED" && oldStatus !== "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (validatedData.status !== "COMPLETED") {
        updateData.completedAt = null;
      }
    }
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    }
    if (validatedData.customerId !== undefined) {
      updateData.customerId = validatedData.customerId || null;
    }

    // Handle workers update (only admin or creator can change workers)
    if (validatedData.workerIds !== undefined && (isAdmin || isCreator)) {
      // Validate worker assignments based on role hierarchy
      if (validatedData.workerIds.length > 0) {
        const validation = await validateWorkerAssignment(
          validatedData.workerIds,
          currentUser.role,
          currentUser.id
        );
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 403 });
        }
      }
      updateData.workers = {
        set: validatedData.workerIds.map((id) => ({ id })),
      };
    }

    const task = await prisma.task.update({
      where: { id: validatedData.id },
      data: updateData,
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
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log status change specifically
    const auditAction = validatedData.status && validatedData.status !== oldStatus
      ? "TASK_STATUS_CHANGED"
      : "TASK_UPDATED";

    await logAuditEvent({
      userId: currentUser.id,
      action: auditAction,
      details: auditAction === "TASK_STATUS_CHANGED"
        ? `Tarea "${task.title}" cambió de ${oldStatus} a ${validatedData.status}`
        : `Tarea "${task.title}" actualizada`,
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error actualizando tarea:", error);
    return NextResponse.json(
      { error: "Error al actualizar tarea" },
      { status: 500 }
    );
  }
}

// DELETE - Delete task
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return NextResponse.json({ error: "ID de tarea requerido" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Only admin or creator can delete
    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";
    if (!isAdmin && task.createdById !== currentUser.id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta tarea" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await logAuditEvent({
      userId: currentUser.id,
      action: "TASK_DELETED",
      details: `Tarea "${task.title}" eliminada`,
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({ message: "Tarea eliminada" }, { status: 200 });
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    return NextResponse.json(
      { error: "Error al eliminar tarea" },
      { status: 500 }
    );
  }
}
