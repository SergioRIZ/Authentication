import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminUsersTable from "@/components/admin/admin-users-table";

export default async function AdminPage() {
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
              <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                ADMIN
              </span>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h2>
            <p className="text-sm text-gray-500 mt-1">
              Administra los usuarios y sus roles
            </p>
          </div>
          <AdminUsersTable />
        </div>
      </main>
    </div>
  );
}