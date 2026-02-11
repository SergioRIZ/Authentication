"use client";

import { useState } from "react";
import Button from "@/components/ui/buttons";
import Input from "@/components/ui/input";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
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
  workers: Worker[];
}

interface CustomerModalProps {
  customer: Customer | null;
  workers: Worker[];
  onClose: () => void;
  onSaved: (customer: any) => void;
}

export default function CustomerModal({
  customer,
  workers,
  onClose,
  onSaved,
}: CustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    dni: customer?.dni || "",
    address: customer?.address || "",
    notes: customer?.notes || "",
    category: customer?.category || "REGULAR",
    status: customer?.status || "ACTIVE",
    workerIds: customer?.workers.map((w) => w.id) || [],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const url = "/api/customers";
      const method = customer ? "PATCH" : "POST";
      const body = customer
        ? { id: customer.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        onSaved(data.customer);
      } else {
        setError(data.error || "Error al guardar cliente");
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
            {customer ? "Editar Cliente" : "Nuevo Cliente"}
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
              Información Básica
            </h3>

            <Input
              label="Nombre completo *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del cliente"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />

              <Input
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>

            <Input
              label="DNI/NIF"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              placeholder="12345678A"
            />

            <Input
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, número, ciudad..."
            />
          </div>

          {/* Category & Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Clasificación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-clients"
                >
                  <option value="PREMIUM">Premium</option>
                  <option value="REGULAR">Regular</option>
                  <option value="OCCASIONAL">Ocasional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-clients"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
            </div>
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

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Notas
            </h3>

            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Añade notas u observaciones sobre el cliente..."
              rows={3}
              className="w-full px-4 py-2.5 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-clients resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {customer ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
