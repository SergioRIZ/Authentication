import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuditLogTable from "@/components/admin/audit-log-table";

export default async function AuditLogsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Registro de Auditoría</h1>
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                AUDIT LOG
              </span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Gestión de usuarios
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-500 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Actividad del Sistema</h2>
            <p className="text-sm text-gray-500 mt-1">
              Registro de todas las acciones de seguridad realizadas en el sistema
            </p>
          </div>
          <AuditLogTable />
        </div>
      </main>
    </div>
  );
}
