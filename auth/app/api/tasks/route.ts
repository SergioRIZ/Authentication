import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema, updateTaskSchema } from "@/lib/validations/task";
import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";
import { validateWorkerAssignment } from "@/lib/worker-assignment";
import { z } from "zod";

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
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

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

    // Pagination (opt-in: only when ?page= is provided)
    const paginate = pageParam !== null;
    const page = Math.max(1, parseInt(pageParam || "1"));
    const limit = Math.min(Math.max(1, parseInt(limitParam || "50")), 100);
    const skip = paginate ? (page - 1) * limit : undefined;
    const take = paginate ? limit : undefined;

    const findArgs = {
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
        { status: "asc" as const },
        { priority: "desc" as const },
        { dueDate: "asc" as const },
        { createdAt: "desc" as const },
      ],
      ...(paginate ? { skip, take } : {}),
    };

    if (paginate) {
      const [tasks, total] = await Promise.all([
        prisma.task.findMany(findArgs),
        prisma.task.count({ where }),
      ]);
      return NextResponse.json({
        tasks,
        isAdmin,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, { status: 200 });
    }

    const tasks = await prisma.task.findMany(findArgs);
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
