"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  UsersGroupIcon, ClipboardIcon, UsersIcon, SpinnerIcon,
  ChevronLeftIcon, CheckCircleIcon,
} from "@/components/ui/icons";
import {
  RoleBadge, VerificationBadge, TaskStatusBadge,
  PriorityBadge, CategoryBadge, CustomerStatusBadge,
} from "@/components/ui/badges";
import { useToast } from "@/components/ui/toast";
import Button from "@/components/ui/buttons";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  department: string | null;
  jobFunction: string | null;
  emailVerified: string | null;
  createdAt: string;
  assignedTasks: Task[];
  assignedCustomers: Customer[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: { id: string; name: string } | null;
  workers: { id: string; name: string | null; email: string; image: string | null }[];
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: "PREMIUM" | "REGULAR" | "OCCASIONAL";
  status: "ACTIVE" | "INACTIVE";
  workers: { id: string; name: string | null; email: string; image: string | null }[];
}

interface WorkerDetailClientProps {
  workerId: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(task: Task): boolean {
  if (task.status === "COMPLETED" || !task.dueDate) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < now;
}

export default function WorkerDetailClient({ workerId }: WorkerDetailClientProps) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ department: "", jobFunction: "" });
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const fetchWorker = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/workers/${workerId}`, {
        signal: controller.signal,
      });
      const data = await response.json();

      if (response.ok) {
        setWorker(data.worker);
        setEditData({
          department: data.worker.department || "",
          jobFunction: data.worker.jobFunction || "",
        });
      } else {
        setError(data.error || "Error al cargar trabajador");
      }
    } catch (err) {
      if ((err as DOMException).name !== "AbortError") {
        setError("Error de conexion");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorker();
    return () => { abortRef.current?.abort(); };
  }, [fetchWorker]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/workers/${workerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await response.json();

      if (response.ok) {
        setWorker((prev) =>
          prev ? { ...prev, department: data.worker.department, jobFunction: data.worker.jobFunction } : prev
        );
        setIsEditing(false);
        showToast("Perfil actualizado correctamente", "success");
      } else {
        showToast(data.error || "Error al actualizar", "error");
      }
    } catch {
      showToast("Error de conexion", "error");
    } finally {
      setIsSaving(false);
    }
  }

  // Task stats
  const taskStats = useMemo(() => {
    if (!worker) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    const tasks = worker.assignedTasks;
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
    };
  }, [worker]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerIcon className="animate-spin h-8 w-8 text-section-workers" />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="space-y-4">
        <Link
          href="/workers"
          className="inline-flex items-center gap-1.5 text-sm text-section-workers hover:underline"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Volver a Trabajadores
        </Link>
        <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          {error || "Trabajador no encontrado"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/workers"
        className="inline-flex items-center gap-1.5 text-sm text-section-workers hover:underline"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Volver a Trabajadores
      </Link>

      {/* Profile Header */}
      <div className="bg-background border border-section-workers-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {worker.image ? (
            <img
              src={worker.image}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover border border-section-workers-border"
            />
          ) : (
            <span className="w-14 h-14 rounded-2xl bg-section-workers-light border border-section-workers-border flex items-center justify-center text-xl font-bold text-section-workers">
              {(worker.name || worker.email).charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {worker.name || "Sin nombre"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">{worker.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <RoleBadge role={worker.role} />
              <VerificationBadge verified={!!worker.emailVerified} />
            </div>
          </div>
          <Button
            variant={isEditing ? "outline" : "primary"}
            size="sm"
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                setEditData({
                  department: worker.department || "",
                  jobFunction: worker.jobFunction || "",
                });
              } else {
                setIsEditing(true);
              }
            }}
            className={!isEditing ? "!bg-section-workers hover:!bg-section-workers/90 !shadow-section-workers/20" : ""}
          >
            {isEditing ? "Cancelar" : "Editar Perfil"}
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Worker Info */}
        <div className="bg-section-workers-light border border-section-workers-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-workers uppercase tracking-wider mb-4">
            Informacion del Trabajador
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Departamento</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) => setEditData((prev) => ({ ...prev, department: e.target.value }))}
                  placeholder="Ej: Ingenieria, Ventas..."
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-section-workers/50"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {worker.department || <span className="text-muted-foreground">Sin asignar</span>}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funcion</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.jobFunction}
                  onChange={(e) => setEditData((prev) => ({ ...prev, jobFunction: e.target.value }))}
                  placeholder="Ej: Desarrollador, Gerente de Proyecto..."
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-section-workers/50"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {worker.jobFunction || <span className="text-muted-foreground">Sin asignar</span>}
                </p>
              )}
            </div>
            {isEditing && (
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                className="!bg-section-workers hover:!bg-section-workers/90 !shadow-section-workers/20 mt-2"
              >
                Guardar
              </Button>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Rol</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                <RoleBadge role={worker.role} />
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{worker.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha de registro</p>
              <p className="text-sm font-medium text-foreground">{formatDate(worker.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-section-workers-light border border-section-workers-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-workers uppercase tracking-wider mb-4">
            Resumen de Actividad
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl p-3 border border-border">
              <p className="text-2xl font-bold text-section-tasks">{taskStats.total}</p>
              <p className="text-xs text-muted-foreground">Tareas asignadas</p>
            </div>
            <div className="bg-background rounded-xl p-3 border border-border">
              <p className="text-2xl font-bold text-section-clients">{worker.assignedCustomers.length}</p>
              <p className="text-xs text-muted-foreground">Clientes asignados</p>
            </div>
            <div className="bg-background rounded-xl p-3 border border-border">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div className="bg-background rounded-xl p-3 border border-border">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{taskStats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </div>
          {taskStats.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progreso de tareas</span>
                <span>{Math.round((taskStats.completed / taskStats.total) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full border border-border overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assigned Tasks */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
          <span className="w-9 h-9 bg-section-tasks-light border border-section-tasks-border rounded-xl flex items-center justify-center">
            <ClipboardIcon className="w-5 h-5 text-section-tasks" />
          </span>
          Tareas Asignadas
          <span className="text-sm font-normal text-muted-foreground">
            ({taskStats.total})
          </span>
        </h2>

        {/* Task Stats */}
        {taskStats.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-section-tasks">{taskStats.total}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-3">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{taskStats.pending}</p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/30 rounded-2xl p-3">
              <p className="text-xs text-muted-foreground">En Progreso</p>
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{taskStats.inProgress}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-2xl p-3">
              <p className="text-xs text-muted-foreground">Completadas</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{taskStats.completed}</p>
            </div>
          </div>
        )}

        {/* Task Table */}
        <div className="bg-background border border-section-tasks-border rounded-2xl overflow-hidden">
          {worker.assignedTasks.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tiene tareas asignadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-section-tasks-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Tarea
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Fecha Limite
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Cliente
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {worker.assignedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`hover:bg-muted/50 transition-colors ${
                        isOverdue(task) ? "bg-red-50/50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/tasks/${task.id}`}
                          className={`text-sm font-medium hover:text-section-tasks transition-colors ${
                            task.status === "COMPLETED"
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm ${
                          isOverdue(task)
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-foreground"
                        }`}>
                          {formatDate(task.dueDate)}
                        </span>
                        {isOverdue(task) && (
                          <span className="ml-1 text-xs text-red-600 dark:text-red-400">(vencida)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.customer ? (
                          <Link
                            href={`/customers/${task.customer.id}`}
                            className="text-sm text-foreground hover:text-section-clients transition-colors"
                          >
                            {task.customer.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin cliente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assigned Customers */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
          <span className="w-9 h-9 bg-section-clients-light border border-section-clients-border rounded-xl flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-section-clients" />
          </span>
          Clientes Asignados
          <span className="text-sm font-normal text-muted-foreground">
            ({worker.assignedCustomers.length})
          </span>
        </h2>

        <div className="bg-background border border-section-clients-border rounded-2xl overflow-hidden">
          {worker.assignedCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tiene clientes asignados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-section-clients-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {worker.assignedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-sm font-medium text-foreground hover:text-section-clients transition-colors"
                        >
                          {customer.name}
                        </Link>
                        {customer.email && (
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CategoryBadge category={customer.category} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CustomerStatusBadge status={customer.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
