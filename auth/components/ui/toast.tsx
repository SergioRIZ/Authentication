"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, CloseIcon, InfoIcon } from "@/components/ui/icons";

// --- Types ---
type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// --- Provider ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {portalRoot && createPortal(
        <div
          className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none"
          style={{ zIndex: 10001 }}
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>,
        portalRoot
      )}
    </ToastContext.Provider>
  );
}

// --- Single Toast ---
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLeaving) return;
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 300);
    return () => clearTimeout(timer);
  }, [isLeaving, toast.id, onRemove]);

  const styles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-foreground text-background",
  };

  const icons = {
    success: <CheckIcon className="w-5 h-5 shrink-0" />,
    error: <CloseIcon className="w-5 h-5 shrink-0" />,
    info: <InfoIcon className="w-5 h-5 shrink-0" />,
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm
        ${styles[toast.type]}
        ${isLeaving ? "animate-[toastOut_0.3s_ease-in_forwards]" : "animate-[toastIn_0.3s_ease-out]"}
      `}
      role="alert"
    >
      {icons[toast.type]}
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => setIsLeaving(true)}
        className="ml-auto shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Cerrar notificacion"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
