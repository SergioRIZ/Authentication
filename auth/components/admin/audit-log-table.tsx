"use client";

import { useState, useEffect } from "react";
import { SpinnerIcon } from "@/components/ui/icons";

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  LOGIN_SUCCESS: { label: "Inicio de sesión", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" },
  LOGIN_FAILED: { label: "Login fallido", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" },
  LOGIN_BLOCKED_LOCKOUT: { label: "Login bloqueado", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" },
  LOGOUT: { label: "Cierre de sesión", color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300" },
  REGISTER: { label: "Registro", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300" },
  EMAIL_VERIFIED: { label: "Email verificado", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" },
  PASSWORD_CHANGED: { label: "Contraseña cambiada", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" },
  PASSWORD_RESET_REQUESTED: { label: "Reset solicitado", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" },
  PASSWORD_RESET_COMPLETED: { label: "Reset completado", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" },
  ACCOUNT_DELETED: { label: "Cuenta eliminada", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" },
  ACCOUNT_LOCKED: { label: "Cuenta bloqueada", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" },
  ACCOUNT_UNLOCKED: { label: "Cuenta desbloqueada", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" },
  ROLE_CHANGED: { label: "Rol cambiado", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300" },
  PROFILE_UPDATED: { label: "Perfil actualizado", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300" },
  TWO_FACTOR_ENABLED: { label: "2FA activado", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" },
  TWO_FACTOR_DISABLED: { label: "2FA desactivado", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" },
  TWO_FACTOR_FAILED: { label: "2FA fallido", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" },
};

export default function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  async function fetchLogs(page: number) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
      } else {
        setError(data.error || "Error al cargar registros");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  function getActionBadge(action: string) {
    const info = ACTION_LABELS[action] || { label: action, color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.color}`}>
        {info.label}
      </span>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">{error}</div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="p-4 border-b border-border">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-sm border border-border bg-background text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-section-admin"
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <SpinnerIcon className="h-8 w-8 text-section-admin mx-auto" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-section-admin-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Detalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-foreground">{log.user.name || "Sin nombre"}</p>
                          <p className="text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sistema</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                      {log.ipAddress || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No hay registros de auditoría
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-border text-foreground rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm border border-border text-foreground rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
