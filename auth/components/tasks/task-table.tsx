"use client";

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
  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
            Completada
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
            En Progreso
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
            Pendiente
          </span>
        );
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case "HIGH":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
            Alta
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
            Media
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            Baja
          </span>
        );
    }
  }

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
        <svg
          className="animate-spin h-8 w-8 text-primary mx-auto"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg
          className="w-12 h-12 text-muted-foreground mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
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
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tarea
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Prioridad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Fecha Límite
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Asignados
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                  <p className={`font-medium ${task.status === "COMPLETED" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {task.title}
                  </p>
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
                  onChange={(e) => onStatusChange(task.id, e.target.value as any)}
                  className="text-xs bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completada</option>
                </select>
                <div className="mt-1">
                  {getStatusBadge(task.status)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getPriorityBadge(task.priority)}
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
                  <span className="text-foreground">{task.customer.name}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(task)}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
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
