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
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">Registro de Auditoría</h1>
              <span className="px-2 py-1 text-xs font-medium bg-section-admin-light text-section-admin border border-section-admin-border rounded-full whitespace-nowrap">
                AUDIT LOG
              </span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="text-sm text-section-admin hover:opacity-80 font-medium transition-colors"
              >
                Gestión de usuarios
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-background border border-section-admin-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-section-admin-border bg-section-admin-light">
            <h2 className="text-xl font-bold text-foreground">Actividad del Sistema</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Registro de todas las acciones de seguridad realizadas en el sistema
            </p>
          </div>
          <AuditLogTable />
        </div>
      </main>
    </div>
  );
}
