import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProtectedNav } from "@/components/layout/protected-nav";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Fetch customer stats
  const [totalCustomers, activeCustomers, premiumCustomers, recentCustomers] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.customer.count({ where: { category: "PREMIUM" } }),
    prisma.customer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        workers: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
  ]);

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <ProtectedNav
        user={user}
        signOutAction={handleSignOut}
      />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Welcome card */}
        <div className="bg-background border border-border rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            {user.image ? (
              <img
                src={user.image}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover ring-4 ring-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-border">
                <span className="text-2xl font-medium text-primary">
                  {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                ¡Bienvenido{user.name ? `, ${user.name}` : ""}!
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Acciones rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Edit profile */}
              <Link
                href="/profile"
                className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Editar perfil</p>
                  <p className="text-sm text-muted-foreground">Cambia tu nombre y foto</p>
                </div>
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Configuración</p>
                  <p className="text-sm text-muted-foreground">Seguridad y preferencias</p>
                </div>
              </Link>

              {/* Admin panel */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 p-4 border rounded-xl hover:bg-opacity-50 transition-colors ${
                    isSuperAdmin
                      ? "border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      : "border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSuperAdmin
                        ? "bg-purple-100 dark:bg-purple-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        isSuperAdmin
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        isSuperAdmin
                          ? "text-purple-700 dark:text-purple-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      Panel Admin
                    </p>
                    <p
                      className={`text-sm ${
                        isSuperAdmin
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Gestionar usuarios
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{premiumCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactivos</p>
                <p className="text-2xl font-bold text-muted-foreground">{totalCustomers - activeCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Clientes Recientes</h3>
              <p className="text-sm text-muted-foreground">Últimos clientes añadidos</p>
            </div>
            <Link
              href="/customers"
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {recentCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-muted-foreground mb-4">No hay clientes todavía</p>
              <Link
                href="/customers"
                className="inline-flex px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Añadir primer cliente
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.email || customer.phone || "Sin contacto"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Workers */}
                    {customer.workers.length > 0 && (
                      <div className="flex -space-x-2">
                        {customer.workers.slice(0, 3).map((worker) => (
                          <div
                            key={worker.id}
                            className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background"
                            title={worker.name || ""}
                          >
                            {worker.image ? (
                              <img src={worker.image} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium text-primary">
                                {(worker.name || "?").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Category badge */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.category === "PREMIUM"
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : customer.category === "OCCASIONAL"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    }`}>
                      {customer.category === "PREMIUM" ? "Premium" : customer.category === "OCCASIONAL" ? "Ocasional" : "Regular"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
