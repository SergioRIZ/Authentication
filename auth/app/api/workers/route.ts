import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all workers (verified users)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get all verified users as potential workers
    const workers = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
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
