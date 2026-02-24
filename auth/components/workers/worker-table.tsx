"use client";

import Link from "next/link";
import { RoleBadge } from "@/components/ui/badges";
import { UsersGroupIcon } from "@/components/ui/icons";

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

interface WorkerTableProps {
  workers: WorkerListItem[];
}

export default function WorkerTable({ workers }: WorkerTableProps) {
  if (workers.length === 0) {
    return (
      <div className="bg-background border border-section-workers-border rounded-2xl p-12 text-center">
        <UsersGroupIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No se encontraron trabajadores</p>
      </div>
    );
  }

  return (
    <div className="bg-background border border-section-workers-border rounded-2xl overflow-hidden">
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-section-workers-light border-b border-section-workers-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-section-workers uppercase tracking-wider">
                Trabajador
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-section-workers uppercase tracking-wider">
                Rol
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-section-workers uppercase tracking-wider">
                Departamento
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-section-workers uppercase tracking-wider">
                Funcion
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-section-workers uppercase tracking-wider">
                Tareas
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-section-workers uppercase tracking-wider">
                Clientes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {workers.map((worker) => (
              <tr
                key={worker.id}
                className="hover:bg-section-workers-light/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/workers/${worker.id}`}
                    className="flex items-center gap-3 group"
                  >
                    {worker.image ? (
                      <img
                        src={worker.image}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-section-workers-light border border-section-workers-border flex items-center justify-center text-sm font-bold text-section-workers">
                        {(worker.name || worker.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-section-workers transition-colors truncate">
                        {worker.name || "Sin nombre"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {worker.email}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={worker.role} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">
                    {worker.department || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">
                    {worker.jobFunction || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-section-tasks">
                    {worker._count.assignedTasks}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-section-clients">
                    {worker._count.assignedCustomers}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden divide-y divide-border">
        {workers.map((worker) => (
          <Link
            key={worker.id}
            href={`/workers/${worker.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-section-workers-light/50 transition-colors"
          >
            {worker.image ? (
              <img
                src={worker.image}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-10 h-10 rounded-full bg-section-workers-light border border-section-workers-border flex items-center justify-center text-sm font-bold text-section-workers shrink-0">
                {(worker.name || worker.email).charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {worker.name || "Sin nombre"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {worker.department || worker.email}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RoleBadge role={worker.role} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
