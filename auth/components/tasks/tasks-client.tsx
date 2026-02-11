"use client";

import { useState, useEffect } from "react";
import TaskTable from "./task-table";
import TaskModal from "./task-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Customer {
  id: string;
  name: string;
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
  customer: Customer | null;
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const { showToast } = useToast();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchTasks();
    fetchWorkers();
    fetchCustomers();
  }, []);

  async function fetchTasks() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks);
      } else {
        setError(data.error || "Error al cargar tareas");
      }
    } catch (err) {
      setError("Error de conexión");
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
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  }

  async function fetchCustomers() {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTasks();
    }, 300);

    return () => clearTimeout(debounce);
  }, [statusFilter, priorityFilter, searchQuery]);

  function handleAddTask() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  function handleDeleteTask(taskId: string, taskTitle: string) {
    setConfirmAction({
      title: "Eliminar tarea",
      message: `¿Estás seguro de eliminar la tarea "${taskTitle}"?`,
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const response = await fetch(`/api/tasks?id=${taskId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            setTasks(tasks.filter((t) => t.id !== taskId));
            showToast("Tarea eliminada correctamente", "success");
          } else {
            const data = await response.json();
            showToast(data.error || "Error al eliminar tarea", "error");
          }
        } catch (err) {
          showToast("Error de conexion", "error");
        }
      },
    });
  }

  async function handleStatusChange(taskId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(tasks.map((t) => (t.id === taskId ? data.task : t)));
        showToast("Estado actualizado", "success");
      } else {
        const data = await response.json();
        showToast(data.error || "Error al actualizar estado", "error");
      }
    } catch (err) {
      showToast("Error de conexion", "error");
    }
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setEditingTask(null);
  }

  function handleTaskSaved(task: Task) {
    if (editingTask) {
      setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
      showToast("Tarea actualizada correctamente", "success");
    } else {
      setTasks([task, ...tasks]);
      showToast("Tarea creada correctamente", "success");
    }
    handleModalClose();
  }

  // Stats calculations
  const pendingTasks = tasks.filter((t) => t.status === "PENDING").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "COMPLETED") return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-9 h-9 bg-section-tasks-light border border-section-tasks-border rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-section-tasks" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            Control de Equipos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tareas, monitorea el progreso y organiza tu equipo
          </p>
        </div>
        <button
          onClick={handleAddTask}
          className="inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2.5 text-sm text-white bg-section-tasks hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-section-tasks shadow-md transition-all"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Buscar por titulo o descripcion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-tasks focus:border-section-tasks transition-all"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-tasks"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="COMPLETED">Completada</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-tasks"
          >
            <option value="">Todas las prioridades</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingTasks}</p>
        </div>
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">En Progreso</p>
          <p className="text-2xl font-bold text-section-tasks">{inProgressTasks}</p>
        </div>
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Completadas</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks}</p>
        </div>
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Vencidas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueTasks}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-background border border-section-tasks-border rounded-2xl overflow-hidden">
        <TaskTable
          tasks={tasks}
          isLoading={isLoading}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          workers={workers}
          customers={customers}
          onClose={handleModalClose}
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
