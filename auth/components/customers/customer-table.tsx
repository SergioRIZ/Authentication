"use client";

import Link from "next/link";
import { SpinnerIcon, UsersGroupIcon } from "@/components/ui/icons";
import { CategoryBadge, CustomerStatusBadge } from "@/components/ui/badges";

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
  createdAt: string;
  workers: Worker[];
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string, customerName: string) => void;
}

export default function CustomerTable({
  customers,
  isLoading,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary mx-auto" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center">
        <UsersGroupIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay clientes</p>
        <p className="text-sm text-muted-foreground mt-1">
          Añade tu primer cliente haciendo clic en "Nuevo Cliente"
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-section-clients-light">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
              DNI/NIF
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-section-clients uppercase tracking-wider">
              Trabajadores
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-section-clients uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                    <span className="text-sm font-medium text-primary">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-foreground hover:text-section-clients transition-colors"
                    >
                      {customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm">
                  {customer.email && (
                    <p className="text-foreground">{customer.email}</p>
                  )}
                  {customer.phone && (
                    <p className="text-muted-foreground">{customer.phone}</p>
                  )}
                  {!customer.email && !customer.phone && (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {customer.dni || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <CategoryBadge category={customer.category} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <CustomerStatusBadge status={customer.status} />
              </td>
              <td className="px-6 py-4">
                {customer.workers.length > 0 ? (
                  <div className="flex -space-x-2">
                    {customer.workers.slice(0, 3).map((worker) => (
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
                    {customer.workers.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                        <span className="text-xs font-medium text-muted-foreground">
                          +{customer.workers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Sin asignar</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(customer)}
                    className="text-sm text-section-clients hover:opacity-80 font-medium transition-colors"
                  >
                    Editar
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => onDelete(customer.id, customer.name)}
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
