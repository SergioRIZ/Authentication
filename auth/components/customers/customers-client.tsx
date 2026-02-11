"use client";

import { useState, useEffect } from "react";
import CustomerTable from "./customer-table";
import CustomerModal from "./customer-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

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

export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const { showToast } = useToast();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchCustomers();
    fetchWorkers();
  }, []);

  async function fetchCustomers() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/customers?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers);
      } else {
        setError(data.error || "Error al cargar clientes");
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

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [statusFilter, categoryFilter, searchQuery]);

  function handleAddCustomer() {
    setEditingCustomer(null);
    setIsModalOpen(true);
  }

  function handleEditCustomer(customer: Customer) {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  }

  function handleDeleteCustomer(customerId: string, customerName: string) {
    setConfirmAction({
      title: "Eliminar cliente",
      message: `¿Estás seguro de eliminar a ${customerName}?`,
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const response = await fetch(`/api/customers?id=${customerId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            setCustomers(customers.filter((c) => c.id !== customerId));
            showToast("Cliente eliminado correctamente", "success");
          } else {
            const data = await response.json();
            showToast(data.error || "Error al eliminar cliente", "error");
          }
        } catch (err) {
          showToast("Error de conexion", "error");
        }
      },
    });
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setEditingCustomer(null);
  }

  function handleCustomerSaved(customer: Customer) {
    if (editingCustomer) {
      setCustomers(customers.map((c) => (c.id === customer.id ? customer : c)));
      showToast("Cliente actualizado correctamente", "success");
    } else {
      setCustomers([customer, ...customers]);
      showToast("Cliente creado correctamente", "success");
    }
    handleModalClose();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-9 h-9 bg-section-clients-light border border-section-clients-border rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-section-clients" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los clientes de SerTEC
          </p>
        </div>
        <button
          onClick={handleAddCustomer}
          className="inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2.5 text-sm text-white bg-section-clients hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-section-clients shadow-md transition-all"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Buscar por nombre, email, telefono o DNI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-clients focus:border-section-clients transition-all"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-clients"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-section-clients"
          >
            <option value="">Todas las categorias</option>
            <option value="PREMIUM">Premium</option>
            <option value="REGULAR">Regular</option>
            <option value="OCCASIONAL">Ocasional</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Total Clientes</p>
          <p className="text-2xl font-bold text-section-clients">{customers.length}</p>
        </div>
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {customers.filter((c) => c.status === "ACTIVE").length}
          </p>
        </div>
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Premium</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {customers.filter((c) => c.category === "PREMIUM").length}
          </p>
        </div>
        <div className="bg-section-clients-light border border-section-clients-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Inactivos</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {customers.filter((c) => c.status === "INACTIVE").length}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-background border border-section-clients-border rounded-2xl overflow-hidden">
        <CustomerTable
          customers={customers}
          isLoading={isLoading}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          workers={workers}
          onClose={handleModalClose}
          onSaved={handleCustomerSaved}
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
