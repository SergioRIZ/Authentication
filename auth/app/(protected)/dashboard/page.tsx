import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  UserIcon, SettingsIcon, AdminUsersIcon, UsersIcon,
  CheckCircleIcon, StarIcon, ClockIcon, LightningIcon,
  ClipboardIcon, CheckIcon, CompanyBanner,
} from "@/components/ui/icons";
import { CategoryBadge, PriorityBadge } from "@/components/ui/badges";

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

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  // Filter for regular users - only see assigned customers/tasks
  const customerFilter = isAdmin ? {} : { workers: { some: { id: user.id } } };
  const taskFilter = isAdmin ? {} : { OR: [{ workers: { some: { id: user.id } } }, { createdById: user.id }] };

  // Fetch customer stats (filtered for regular users)
  const [totalCustomers, activeCustomers, premiumCustomers, recentCustomers] = await Promise.all([
    prisma.customer.count({ where: customerFilter }),
    prisma.customer.count({ where: { ...customerFilter, status: "ACTIVE" } }),
    prisma.customer.count({ where: { ...customerFilter, category: "PREMIUM" } }),
    prisma.customer.findMany({
      where: customerFilter,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        workers: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
  ]);

  // Fetch task stats (filtered for regular users)
  const [pendingTasks, inProgressTasks, completedTasks, recentTasks] = await Promise.all([
    prisma.task.count({ where: { ...taskFilter, status: "PENDING" } }),
    prisma.task.count({ where: { ...taskFilter, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { ...taskFilter, status: "COMPLETED" } }),
    prisma.task.findMany({
      where: taskFilter,
      take: 5,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      include: {
        workers: {
          select: { id: true, name: true, image: true },
        },
        customer: {
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Welcome card */}
        <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden mb-8">
          {/* Company banner header */}
          <div className="bg-linear-to-r from-primary/5 to-accent/5 border-b border-border px-6 py-4 flex items-center justify-between">
            <CompanyBanner className="h-10 w-auto max-w-[200px] rounded-lg" />
            <span className="text-xs text-muted-foreground hidden sm:block">Panel de Control</span>
          </div>

          <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {user.image ? (
              <img
                src={user.image}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover ring-4 ring-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-4 ring-border">
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
                className="flex items-center gap-3 p-4 border border-border rounded-2xl hover:bg-muted/50 transition-all hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Editar perfil</p>
                  <p className="text-sm text-muted-foreground">Cambia tu nombre y foto</p>
                </div>
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className="flex items-center gap-3 p-4 border border-border rounded-2xl hover:bg-muted/50 transition-all hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                  className="flex items-center gap-3 p-4 border border-section-admin-border rounded-2xl hover:bg-section-admin-light transition-all hover:shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-section-admin-light flex items-center justify-center">
                    <AdminUsersIcon className="w-5 h-5 text-section-admin" />
                  </div>
                  <div>
                    <p className="font-medium text-section-admin">Panel Admin</p>
                    <p className="text-sm text-muted-foreground">Gestionar usuarios</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-section-clients-border">
                <UsersIcon className="w-5 h-5 text-section-clients" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-green-200 dark:border-green-800">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-purple-200 dark:border-purple-800">
                <StarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{premiumCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactivos</p>
                <p className="text-2xl font-bold text-muted-foreground">{totalCustomers - activeCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-background border border-section-clients-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-section-clients-border bg-section-clients-light flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Clientes Recientes</h3>
              <p className="text-sm text-muted-foreground">Ultimos clientes añadidos</p>
            </div>
            <Link
              href="/customers"
              className="px-4 py-2 text-sm font-medium text-section-clients hover:opacity-80 transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {recentCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                <Link key={customer.id} href={`/customers/${customer.id}`} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-section-clients transition-colors">{customer.name}</p>
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
                    <CategoryBadge category={customer.category} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-8">
          <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-section-tasks-border">
                <LightningIcon className="w-5 h-5 text-section-tasks" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold text-section-tasks">{inProgressTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-green-200 dark:border-green-800">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background flex items-center justify-center border border-section-tasks-border">
                <ClipboardIcon className="w-5 h-5 text-section-tasks" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tareas</p>
                <p className="text-2xl font-bold text-foreground">{pendingTasks + inProgressTasks + completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-background border border-section-tasks-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-section-tasks-border bg-section-tasks-light flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Tareas Recientes</h3>
              <p className="text-sm text-muted-foreground">Control de equipos y progreso</p>
            </div>
            <Link
              href="/tasks"
              className="px-4 py-2 text-sm font-medium text-section-tasks hover:opacity-80 transition-colors"
            >
              Ver todas →
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No hay tareas todavía</p>
              <Link
                href="/tasks"
                className="inline-flex px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Crear primera tarea
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      task.status === "COMPLETED"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : task.status === "IN_PROGRESS"
                        ? "bg-teal-100 dark:bg-teal-900/30"
                        : "bg-amber-100 dark:bg-amber-900/30"
                    }`}>
                      {task.status === "COMPLETED" ? (
                        <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : task.status === "IN_PROGRESS" ? (
                        <LightningIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      ) : (
                        <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium group-hover:text-section-tasks transition-colors ${task.status === "COMPLETED" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.customer ? task.customer.name : "Sin cliente asignado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Workers */}
                    {task.workers.length > 0 && (
                      <div className="flex -space-x-2">
                        {task.workers.slice(0, 3).map((worker) => (
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
                    {/* Priority badge */}
                    <PriorityBadge priority={task.priority} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
