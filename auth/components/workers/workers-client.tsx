"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import WorkerTable from "./worker-table";
import { UsersGroupIcon, SpinnerIcon, AdminUsersIcon, UserIcon, ClipboardIcon } from "@/components/ui/icons";

interface WorkerListItem {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  department: string | null;
  jobFunction: string | null;
  createdAt: string;
  _count: {
    assignedTasks: number;
    assignedCustomers: number;
  };
}

export default function WorkersClient() {
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch("/api/workers?view=list");
      const data = await response.json();

      if (response.ok) {
        setWorkers(data.workers);
      } else {
        setError(data.error || "Error al cargar trabajadores");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (roleFilter && w.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = w.name?.toLowerCase().includes(q);
        const matchesEmail = w.email.toLowerCase().includes(q);
        const matchesDept = w.department?.toLowerCase().includes(q);
        const matchesFunc = w.jobFunction?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesFunc) return false;
      }
      return true;
    });
  }, [workers, searchQuery, roleFilter]);

  // Stats
  const totalWorkers = workers.length;
  const adminCount = workers.filter((w) => w.role === "ADMIN" || w.role === "SUPER_ADMIN").length;
  const userCount = workers.filter((w) => w.role === "USER").length;
  const withTasks = workers.filter((w) => w._count.assignedTasks > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <span className="w-9 h-9 bg-section-workers-light border border-section-workers-border rounded-xl flex items-center justify-center">
            <UsersGroupIcon className="w-5 h-5 text-section-workers" />
          </span>
          Trabajadores
        </h1>
        <p className="text-muted-foreground mt-1">
          Directorio del equipo de trabajo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-section-workers-light border border-section-workers-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-section-workers-light border border-section-workers-border flex items-center justify-center shrink-0">
            <UsersGroupIcon className="w-5 h-5 text-section-workers" />
          </div>
          <div>
            <p className="text-2xl font-bold text-section-workers">{totalWorkers}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <AdminUsersIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{adminCount}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
        </div>
        <div className="bg-muted border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{userCount}</p>
            <p className="text-xs text-muted-foreground">Usuarios</p>
          </div>
        </div>
        <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
            <ClipboardIcon className="w-5 h-5 text-section-tasks" />
          </div>
          <div>
            <p className="text-2xl font-bold text-section-tasks">{withTasks}</p>
            <p className="text-xs text-muted-foreground">Con tareas</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, email, departamento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-section-workers/50 focus:border-section-workers transition-colors text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-section-workers/50 focus:border-section-workers transition-colors text-sm"
        >
          <option value="">Todos los roles</option>
          <option value="USER">Usuario</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <SpinnerIcon className="animate-spin h-8 w-8 text-section-workers" />
        </div>
      ) : (
        <WorkerTable workers={filteredWorkers} />
      )}
    </div>
  );
}
