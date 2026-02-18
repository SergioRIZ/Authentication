"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomerModal from "./customer-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  CategoryBadge,
  CustomerStatusBadge,
  TaskStatusBadge,
  PriorityBadge,
} from "@/components/ui/badges";
import { SpinnerIcon, UsersIcon, ClipboardIcon } from "@/components/ui/icons";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
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
  workers: Worker[];
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dni: string | null;
  address: string | null;
  notes: string | null;
  category: "PREMIUM" | "REGULAR" | "OCCASIONAL";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  workers: Worker[];
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  tasks: Task[];
}

interface CustomerDetailClientProps {
  customerId: string;
}

export default function CustomerDetailClient({ customerId }: CustomerDetailClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchCustomer();
    fetchWorkers();
  }, [customerId]);

  async function fetchCustomer() {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      const data = await response.json();

      if (response.ok) {
        setCustomer(data.customer);
      } else if (response.status === 404) {
        setError("Cliente no encontrado");
      } else if (response.status === 403) {
        setError("No tienes permiso para ver este cliente");
      } else {
        setError(data.error || "Error al cargar cliente");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchWorkers() {
    try {
      const response = await fetch("/api/workers");
      const data = await response.json();
      if (response.ok) {
        setWorkers(data.workers);
      }
    } catch {
      // silently fail — workers are only needed for the edit modal
    }
  }

  function handleEdit() {
    setIsModalOpen(true);
  }

  function handleDelete() {
    if (!customer) return;
    setConfirmAction({
      title: "Eliminar cliente",
      message: `¿Estas seguro de eliminar a ${customer.name}? Se eliminaran tambien todas sus tareas asociadas.`,
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const response = await fetch(`/api/customers?id=${customer.id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            showToast("Cliente eliminado correctamente", "success");
            router.push("/customers");
          } else {
            const data = await response.json();
            showToast(data.error || "Error al eliminar cliente", "error");
          }
        } catch {
          showToast("Error de conexion", "error");
        }
      },
    });
  }

  function handleCustomerSaved(updatedCustomer: any) {
    setCustomer((prev) =>
      prev ? { ...prev, ...updatedCustomer, tasks: prev.tasks } : prev
    );
    setIsModalOpen(false);
    showToast("Cliente actualizado correctamente", "success");
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatShortDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  }

  function isOverdue(task: Task) {
    if (!task.dueDate || task.status === "COMPLETED") return false;
    return new Date(task.dueDate) < new Date();
  }

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerIcon className="animate-spin h-8 w-8 text-section-clients" />
      </div>
    );
  }

  // --- Error ---
  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm text-section-clients hover:opacity-80 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Clientes
        </Link>
        <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="text-red-600 dark:text-red-400 font-medium">
            {error || "Cliente no encontrado"}
          </p>
        </div>
      </div>
    );
  }

  const taskStats = {
    total: customer.tasks.length,
    pending: customer.tasks.filter((t) => t.status === "PENDING").length,
    inProgress: customer.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: customer.tasks.filter((t) => t.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm text-section-clients hover:opacity-80 font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Clientes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-section-clients-light border border-section-clients-border flex items-center justify-center">
            <span className="text-xl font-bold text-section-clients">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <CategoryBadge category={customer.category} />
              <CustomerStatusBadge status={customer.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2.5 text-sm text-white bg-section-clients hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-section-clients shadow-md transition-all"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-clients uppercase tracking-wider mb-3">
            Contacto
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">
                {customer.email || <span className="text-muted-foreground">No proporcionado</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefono</p>
              <p className="text-sm font-medium text-foreground">
                {customer.phone || <span className="text-muted-foreground">No proporcionado</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-clients uppercase tracking-wider mb-3">
            Detalles
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">DNI/NIF</p>
              <p className="text-sm font-medium text-foreground">
                {customer.dni || <span className="text-muted-foreground">No proporcionado</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Direccion</p>
              <p className="text-sm font-medium text-foreground">
                {customer.address || <span className="text-muted-foreground">No proporcionada</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Classification & Dates */}
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-clients uppercase tracking-wider mb-3">
            Clasificacion
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Categoria</p>
              <div className="mt-1">
                <CategoryBadge category={customer.category} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <div className="mt-1">
                <CustomerStatusBadge status={customer.status} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha de creacion</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Created by & Workers */}
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-clients uppercase tracking-wider mb-3">
            Equipo
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Creado por</p>
              <p className="text-sm font-medium text-foreground">
                {customer.createdBy.name || customer.createdBy.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Trabajadores asignados</p>
              {customer.workers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {customer.workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center gap-2 bg-background rounded-xl px-3 py-1.5 border border-border"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-border">
                        {worker.image ? (
                          <img
                            src={worker.image}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-primary">
                            {(worker.name || worker.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-foreground">
                        {worker.name || worker.email}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin trabajadores asignados</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-clients uppercase tracking-wider mb-3">
            Notas
          </h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            <span className="w-9 h-9 bg-section-tasks-light border border-section-tasks-border rounded-xl flex items-center justify-center">
              <ClipboardIcon className="w-5 h-5 text-section-tasks" />
            </span>
            Tareas
            <span className="text-sm font-normal text-muted-foreground">
              ({taskStats.total})
            </span>
          </h2>
        </div>

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
          {customer.tasks.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay tareas asociadas a este cliente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crea una tarea y asociala a este cliente desde la seccion de Tareas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-section-tasks-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Tarea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Fecha Limite
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
                      Asignados
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {customer.tasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`hover:bg-muted/50 transition-colors ${
                        isOverdue(task) ? "bg-red-50/50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/tasks/${task.id}`}
                            className={`font-medium hover:text-section-tasks transition-colors ${
                              task.status === "COMPLETED"
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </Link>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            isOverdue(task)
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : "text-foreground"
                          }`}
                        >
                          {formatShortDate(task.dueDate)}
                        </span>
                        {isOverdue(task) && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                            (vencida)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {task.workers.length > 0 ? (
                          <div className="flex -space-x-2">
                            {task.workers.slice(0, 3).map((worker) => (
                              <div
                                key={worker.id}
                                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background"
                                title={worker.name || worker.email}
                              >
                                {worker.image ? (
                                  <img
                                    src={worker.image}
                                    alt=""
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-primary">
                                    {(worker.name || worker.email).charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                            {task.workers.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                                <span className="text-xs font-medium text-muted-foreground">
                                  +{task.workers.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
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

      {/* Edit Modal */}
      {isModalOpen && customer && (
        <CustomerModal
          customer={customer}
          workers={workers}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleCustomerSaved}
        />
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Eliminar"
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
