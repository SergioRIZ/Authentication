"use client";

import Link from "next/link";
import { SpinnerIcon, ClipboardIcon } from "@/components/ui/icons";
import { TaskStatusBadge, PriorityBadge } from "@/components/ui/badges";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
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
  customerId: string | null;
  workers: Worker[];
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  customer: {
    id: string;
    name: string;
  } | null;
}

interface TaskTableProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskTitle: string) => void;
  onStatusChange: (taskId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => void;
}

export default function TaskTable({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskTableProps) {
  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  }

  function isOverdue(task: Task) {
    if (!task.dueDate || task.status === "COMPLETED") return false;
    return new Date(task.dueDate) < new Date();
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary mx-auto" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center">
        <ClipboardIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay tareas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primera tarea haciendo clic en "Nueva Tarea"
        </p>
      </div>
    );
  }

  return (
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
            <th className="px-6 py-3 text-left text-xs font-semibold text-section-tasks uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-section-tasks uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {tasks.map((task) => (
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
                    className={`font-medium hover:text-section-tasks transition-colors ${task.status === "COMPLETED" ? "text-muted-foreground line-through" : "text-foreground"}`}
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
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value as Task["status"])}
                  className="text-xs font-medium bg-muted/50 border border-border text-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-section-tasks cursor-pointer"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completada</option>
                </select>
                <div className="mt-1">
                  {<TaskStatusBadge status={task.status} />}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${isOverdue(task) ? "text-red-600 dark:text-red-400 font-medium" : "text-foreground"}`}>
                  {formatDate(task.dueDate)}
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
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {task.customer ? (
                  <Link
                    href={`/customers/${task.customer.id}`}
                    className="text-foreground hover:text-section-clients transition-colors font-medium"
                  >
                    {task.customer.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(task)}
                    className="text-sm text-section-tasks hover:opacity-80 font-medium transition-colors"
                  >
                    Editar
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => onDelete(task.id, task.title)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
