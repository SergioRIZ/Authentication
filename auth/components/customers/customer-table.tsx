"use client";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
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
  function getCategoryBadge(category: string) {
    switch (category) {
      case "PREMIUM":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
            Premium
          </span>
        );
      case "OCCASIONAL":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
            Ocasional
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
            Regular
          </span>
        );
    }
  }

  function getStatusBadge(status: string) {
    if (status === "ACTIVE") {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
          Activo
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
        Inactivo
      </span>
    );
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

  if (customers.length === 0) {
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
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
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              DNI/NIF
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Categoría
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Trabajadores
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                    <p className="font-medium text-foreground">{customer.name}</p>
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
                {getCategoryBadge(customer.category)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(customer.status)}
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
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
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
