"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  emailVerified: string | null;
  createdAt: string;
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setCurrentUserRole(data.currentUserRole);
      } else {
        setError(data.error || "Error al cargar usuarios");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: "USER" | "ADMIN" | "SUPER_ADMIN") {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
      } else {
        alert(data.error || "Error al actualizar rol");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`¿Estás seguro de eliminar a ${email}?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert(data.error || "Error al eliminar usuario");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleVerify(userId: string, email: string) {
    if (!confirm(`¿Verificar manualmente a ${email}?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, emailVerified: new Date().toISOString() } : u
        ));
      } else {
        alert(data.error || "Error al verificar usuario");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(userId: string, email: string) {
    if (!confirm(`¿Rechazar y eliminar a ${email}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert(data.error || "Error al rechazar usuario");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  // Determinar si puede editar el rol de un usuario
  function canEditRole(targetRole: string): boolean {
    if (currentUserRole === "SUPER_ADMIN") return true;
    if (currentUserRole === "ADMIN" && targetRole === "USER") return true;
    return false;
  }

  // Determinar si puede eliminar a un usuario
  function canDelete(targetRole: string): boolean {
    if (currentUserRole === "SUPER_ADMIN") return true;
    if (currentUserRole === "ADMIN" && targetRole === "USER") return true;
    return false;
  }

  // Obtener opciones de rol disponibles
  function getRoleOptions(): { value: string; label: string }[] {
    if (currentUserRole === "SUPER_ADMIN") {
      return [
        { value: "USER", label: "Usuario" },
        { value: "ADMIN", label: "Admin" },
        { value: "SUPER_ADMIN", label: "Super Admin" },
      ];
    }
    // Admin solo puede asignar USER
    return [{ value: "USER", label: "Usuario" }];
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
            Super Admin
          </span>
        );
      case "ADMIN":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
            Admin
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            Usuario
          </span>
        );
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <svg className="animate-spin h-8 w-8 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Email verificado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Registro
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                      <span className="text-sm font-medium text-primary">
                        {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{user.name || "Sin nombre"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.emailVerified ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                    Verificado
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                    Pendiente
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {canEditRole(user.role) ? (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as "USER" | "ADMIN" | "SUPER_ADMIN")}
                    disabled={actionLoading === user.id}
                    className="text-sm border border-border bg-background text-foreground rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {currentUserRole === "SUPER_ADMIN" ? (
                      <>
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </>
                    ) : (
                      <option value="USER">Usuario</option>
                    )}
                  </select>
                ) : (
                  getRoleBadge(user.role)
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString("es-ES")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  {/* Verify/Reject buttons for unverified users */}
                  {!user.emailVerified && canDelete(user.role) && (
                    <>
                      <button
                        onClick={() => handleVerify(user.id, user.email)}
                        disabled={actionLoading === user.id}
                        className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === user.id ? "..." : "Verificar"}
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        onClick={() => handleReject(user.id, user.email)}
                        disabled={actionLoading === user.id}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === user.id ? "..." : "Rechazar"}
                      </button>
                    </>
                  )}
                  {/* Delete button for verified users */}
                  {user.emailVerified && canDelete(user.role) && (
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={actionLoading === user.id}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === user.id ? "..." : "Eliminar"}
                    </button>
                  )}
                  {/* No actions available */}
                  {!canDelete(user.role) && (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">
          No hay usuarios
        </div>
      )}
    </div>
  );
}