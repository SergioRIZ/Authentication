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

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-9 h-9 bg-section-admin-light border border-section-admin-border rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-section-admin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            Panel de Administracion
          </h1>
          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
            isSuperAdmin
              ? "bg-section-admin-light text-section-admin border border-section-admin-border"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          }`}>
            {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
          </span>
        </div>
        <Link
          href="/admin/audit-logs"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-section-admin bg-section-admin-light border border-section-admin-border rounded-xl hover:opacity-80 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Registro de Auditoria
        </Link>
      </div>

      <div className="bg-background border border-section-admin-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-section-admin-border bg-section-admin-light">
          <h2 className="text-xl font-bold text-foreground">Gestion de Usuarios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los usuarios y sus roles
          </p>
        </div>
        <AdminUsersTable />
      </div>
    </div>
  );
}
