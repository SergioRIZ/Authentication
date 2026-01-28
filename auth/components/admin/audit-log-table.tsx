"use client";

import { useState, useEffect } from "react";

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
  LOGIN_SUCCESS: { label: "Inicio de sesión", color: "bg-green-100 text-green-800" },
  LOGIN_FAILED: { label: "Login fallido", color: "bg-red-100 text-red-800" },
  LOGIN_BLOCKED_LOCKOUT: { label: "Login bloqueado", color: "bg-red-100 text-red-800" },
  LOGOUT: { label: "Cierre de sesión", color: "bg-gray-100 text-gray-800" },
  REGISTER: { label: "Registro", color: "bg-blue-100 text-blue-800" },
  EMAIL_VERIFIED: { label: "Email verificado", color: "bg-green-100 text-green-800" },
  PASSWORD_CHANGED: { label: "Contraseña cambiada", color: "bg-yellow-100 text-yellow-800" },
  PASSWORD_RESET_REQUESTED: { label: "Reset solicitado", color: "bg-yellow-100 text-yellow-800" },
  PASSWORD_RESET_COMPLETED: { label: "Reset completado", color: "bg-yellow-100 text-yellow-800" },
  ACCOUNT_DELETED: { label: "Cuenta eliminada", color: "bg-red-100 text-red-800" },
  ACCOUNT_LOCKED: { label: "Cuenta bloqueada", color: "bg-red-100 text-red-800" },
  ACCOUNT_UNLOCKED: { label: "Cuenta desbloqueada", color: "bg-green-100 text-green-800" },
  ROLE_CHANGED: { label: "Rol cambiado", color: "bg-purple-100 text-purple-800" },
  PROFILE_UPDATED: { label: "Perfil actualizado", color: "bg-blue-100 text-blue-800" },
  TWO_FACTOR_ENABLED: { label: "2FA activado", color: "bg-green-100 text-green-800" },
  TWO_FACTOR_DISABLED: { label: "2FA desactivado", color: "bg-yellow-100 text-yellow-800" },
  TWO_FACTOR_FAILED: { label: "2FA fallido", color: "bg-red-100 text-red-800" },
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
    const info = ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.color}`}>
        {info.label}
      </span>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">{error}</div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="p-4 border-b">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          <p className="font-medium text-gray-900">{log.user.name || "Sin nombre"}</p>
                          <p className="text-gray-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sistema</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.ipAddress || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No hay registros de auditoría
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
