"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TaskModal from "./task-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  TaskStatusBadge,
  PriorityBadge,
  CategoryBadge,
  CustomerStatusBadge,
} from "@/components/ui/badges";
import { SpinnerIcon, ClipboardIcon, UsersIcon } from "@/components/ui/icons";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: "PREMIUM" | "REGULAR" | "OCCASIONAL";
  status: "ACTIVE" | "INACTIVE";
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
  updatedAt: string;
  customerId: string | null;
  workers: Worker[];
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  customer: Customer | null;
}

interface TaskDetailClientProps {
  taskId: string;
}

export default function TaskDetailClient({ taskId }: TaskDetailClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchTask();
    fetchWorkers();
    fetchCustomers();
  }, [taskId]);

  async function fetchTask() {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (response.ok) {
        setTask(data.task);
      } else if (response.status === 404) {
        setError("Tarea no encontrada");
      } else if (response.status === 403) {
        setError("No tienes permiso para ver esta tarea");
      } else {
        setError(data.error || "Error al cargar tarea");
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

  async function fetchCustomers() {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.customers.map((c: Customer) => ({ id: c.id, name: c.name })));
      }
    } catch {
      // silently fail — customers are only needed for the edit modal
    }
  }

  function handleEdit() {
    setIsModalOpen(true);
  }

  function handleDelete() {
    if (!task) return;
    setConfirmAction({
      title: "Eliminar tarea",
      message: `¿Estas seguro de eliminar la tarea "${task.title}"?`,
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const response = await fetch(`/api/tasks?id=${task.id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            showToast("Tarea eliminada correctamente", "success");
            router.push("/tasks");
          } else {
            const data = await response.json();
            showToast(data.error || "Error al eliminar tarea", "error");
          }
        } catch {
          showToast("Error de conexion", "error");
        }
      },
    });
  }

  async function handleStatusChange(newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED") {
    if (!task) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        showToast("Estado actualizado", "success");
      } else {
        const data = await response.json();
        showToast(data.error || "Error al actualizar estado", "error");
      }
    } catch {
      showToast("Error de conexion", "error");
    }
  }

  function handleTaskSaved(updatedTask: any) {
    setTask(updatedTask);
    setIsModalOpen(false);
    showToast("Tarea actualizada correctamente", "success");
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isOverdue() {
    if (!task || !task.dueDate || task.status === "COMPLETED") return false;
    return new Date(task.dueDate) < new Date();
  }

  function getDaysRemaining() {
    if (!task?.dueDate) return null;
    const now = new Date();
    const due = new Date(task.dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerIcon className="animate-spin h-8 w-8 text-section-tasks" />
      </div>
    );
  }

  // --- Error ---
  if (error || !task) {
    return (
      <div className="space-y-4">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm text-section-tasks hover:opacity-80 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Tareas
        </Link>
        <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="text-red-600 dark:text-red-400 font-medium">
            {error || "Tarea no encontrada"}
          </p>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm text-section-tasks hover:opacity-80 font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Tareas
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-section-tasks-light border border-section-tasks-border flex items-center justify-center">
            <ClipboardIcon className="w-7 h-7 text-section-tasks" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${task.status === "COMPLETED" ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {task.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <TaskStatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {isOverdue() && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  Vencida
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2.5 text-sm text-white bg-section-tasks hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-section-tasks shadow-md transition-all"
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

      {/* Status Change Buttons */}
      <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-section-tasks uppercase tracking-wider mb-3">
          Cambiar Estado
        </p>
        <div className="flex flex-wrap gap-2">
          {(["PENDING", "IN_PROGRESS", "COMPLETED"] as const).map((s) => {
            const labels = { PENDING: "Pendiente", IN_PROGRESS: "En Progreso", COMPLETED: "Completada" };
            const isActive = task.status === s;
            return (
              <button
                key={s}
                onClick={() => !isActive && handleStatusChange(s)}
                disabled={isActive}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? "bg-section-tasks text-white shadow-md cursor-default"
                    : "bg-background border border-border text-foreground hover:bg-muted"
                }`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-section-tasks uppercase tracking-wider mb-3">
            Descripcion
          </h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {task.description || <span className="text-muted-foreground">Sin descripcion</span>}
          </p>
        </div>

        {/* Dates */}
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-tasks uppercase tracking-wider mb-3">
            Fechas
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Fecha de inicio</p>
              <p className="text-sm font-medium text-foreground">{formatDate(task.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha limite</p>
              <p className={`text-sm font-medium ${isOverdue() ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                {formatDate(task.dueDate)}
                {daysRemaining !== null && task.status !== "COMPLETED" && (
                  <span className={`ml-2 text-xs ${
                    daysRemaining < 0
                      ? "text-red-600 dark:text-red-400"
                      : daysRemaining <= 7
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  }`}>
                    ({daysRemaining < 0
                      ? `${Math.abs(daysRemaining)} dias de retraso`
                      : daysRemaining === 0
                      ? "Vence hoy"
                      : `${daysRemaining} dias restantes`})
                  </span>
                )}
              </p>
            </div>
            {task.completedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Completada el</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {formatDateTime(task.completedAt)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Creada el</p>
              <p className="text-sm font-medium text-foreground">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-section-tasks uppercase tracking-wider mb-3">
            Clasificacion
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <div className="mt-1">
                <TaskStatusBadge status={task.status} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prioridad</p>
              <div className="mt-1">
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Creado por</p>
              <p className="text-sm font-medium text-foreground">
                {task.createdBy.name || task.createdBy.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workers Section */}
      <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-section-tasks uppercase tracking-wider mb-3 flex items-center gap-2">
          <UsersIcon className="w-4 h-4" />
          Trabajadores Asignados
        </h3>
        {task.workers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {task.workers.map((worker) => (
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

      {/* Customer Section */}
      <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-section-clients uppercase tracking-wider mb-3">
          Cliente Asociado
        </h3>
        {task.customer ? (
          <Link
            href={`/customers/${task.customer.id}`}
            className="flex items-center gap-4 p-3 bg-background border border-border rounded-xl hover:bg-muted/50 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-section-clients-light border border-section-clients-border flex items-center justify-center">
              <span className="text-lg font-bold text-section-clients">
                {task.customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground group-hover:text-section-clients transition-colors">
                {task.customer.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.customer.email && (
                  <p className="text-sm text-muted-foreground truncate">{task.customer.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CategoryBadge category={task.customer.category} />
              <CustomerStatusBadge status={task.customer.status} />
            </div>
            <svg className="w-5 h-5 text-muted-foreground group-hover:text-section-clients transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Sin cliente asociado</p>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && task && (
        <TaskModal
          task={task}
          workers={workers}
          customers={customers}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleTaskSaved}
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
