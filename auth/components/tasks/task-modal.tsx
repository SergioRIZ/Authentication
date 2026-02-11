"use client";

import { useState } from "react";
import Button from "@/components/ui/buttons";
import Input from "@/components/ui/input";

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
  workers: Worker[];
  customerId: string | null;
}

interface TaskModalProps {
  task: Task | null;
  workers: Worker[];
  customers: Customer[];
  onClose: () => void;
  onSaved: (task: any) => void;
}

export default function TaskModal({
  task,
  workers,
  customers,
  onClose,
  onSaved,
}: TaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Format date for input
  function formatDateForInput(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  }

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "PENDING",
    priority: task?.priority || "MEDIUM",
    dueDate: formatDateForInput(task?.dueDate || null),
    startDate: formatDateForInput(task?.startDate || null),
    customerId: task?.customerId || "",
    workerIds: task?.workers.map((w) => w.id) || [],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const url = "/api/tasks";
      const method = task ? "PATCH" : "POST";
      const body = task
        ? { id: task.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        onSaved(data.task);
      } else {
        setError(data.error || "Error al guardar tarea");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  function handleWorkerToggle(workerId: string) {
    setFormData((prev) => ({
      ...prev,
      workerIds: prev.workerIds.includes(workerId)
        ? prev.workerIds.filter((id) => id !== workerId)
        : [...prev.workerIds, workerId],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {task ? "Editar Tarea" : "Nueva Tarea"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Información de la Tarea
            </h3>

            <Input
              label="Título *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nombre de la tarea"
              required
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los detalles de la tarea..."
                rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-tasks resize-none"
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Estado y Prioridad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-tasks"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-tasks"
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Fechas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Fecha de inicio"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />

              <Input
                label="Fecha límite"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Cliente Asociado
            </h3>

            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-tasks"
            >
              <option value="">Sin cliente asociado</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Workers Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trabajadores Asignados
            </h3>

            <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto">
              {workers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay trabajadores disponibles
                </p>
              ) : (
                <div className="space-y-2">
                  {workers.map((worker) => (
                    <label
                      key={worker.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.workerIds.includes(worker.id)}
                        onChange={() => handleWorkerToggle(worker.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {worker.image ? (
                          <img
                            src={worker.image}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(worker.name || worker.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {worker.name || "Sin nombre"}
                          </p>
                          <p className="text-xs text-muted-foreground">{worker.email}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.workerIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {formData.workerIds.length} trabajador(es) seleccionado(s)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {task ? "Guardar Cambios" : "Crear Tarea"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
