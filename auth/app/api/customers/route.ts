import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema, updateCustomerSchema } from "@/lib/validations/customer";
import { logAuditEvent, getAuditIp, getAuditUserAgent } from "@/lib/audit";
import { z } from "zod";

// GET - List customers (filtered by assignment for regular users)
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
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};

    // Regular users can only see customers assigned to them
    if (!isAdmin) {
      where.workers = {
        some: {
          id: currentUser.id,
        },
      };
    }

    if (status && (status === "ACTIVE" || status === "INACTIVE")) {
      where.status = status;
    }

    if (category && ["PREMIUM", "REGULAR", "OCCASIONAL"].includes(category)) {
      where.category = category;
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { dni: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const customers = await prisma.customer.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers, isAdmin }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

// POST - Create new customer
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Clean empty strings to null
    const cleanData = {
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      dni: validatedData.dni || null,
      address: validatedData.address || null,
      notes: validatedData.notes || null,
      category: validatedData.category,
      status: validatedData.status,
      createdById: currentUser.id,
    };

    const customer = await prisma.customer.create({
      data: {
        ...cleanData,
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
      },
    });

    await logAuditEvent({
      userId: currentUser.id,
      action: "CUSTOMER_CREATED",
      details: `Cliente "${customer.name}" creado`,
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creando cliente:", error);
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    );
  }
}

// PATCH - Update customer
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.dni !== undefined) updateData.dni = validatedData.dni || null;
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    // Handle workers update
    if (validatedData.workerIds !== undefined) {
      updateData.workers = {
        set: validatedData.workerIds.map((id) => ({ id })),
      };
    }

    const customer = await prisma.customer.update({
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
      },
    });

    await logAuditEvent({
      userId: currentUser.id,
      action: "CUSTOMER_UPDATED",
      details: `Cliente "${customer.name}" actualizado`,
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error actualizando cliente:", error);
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer
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
    const customerId = searchParams.get("id");

    if (!customerId) {
      return NextResponse.json({ error: "ID de cliente requerido" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    await logAuditEvent({
      userId: currentUser.id,
      action: "CUSTOMER_DELETED",
      details: `Cliente "${customer.name}" eliminado`,
      ipAddress: getAuditIp(request),
      userAgent: getAuditUserAgent(request),
    });

    return NextResponse.json({ message: "Cliente eliminado" }, { status: 200 });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    );
  }
}
