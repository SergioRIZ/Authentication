"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Button from "@/components/ui/buttons";
import { CloseIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { TaskStatusBadge, PriorityBadge } from "@/components/ui/badges";
import type { CalendarTask } from "./calendar-client";

interface CalendarTaskPreviewProps {
  task: CalendarTask;
  onClose: () => void;
}

function isOverdue(task: CalendarTask): boolean {
  if (task.status === "COMPLETED" || !task.dueDate) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < now;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysLabel(task: CalendarTask): string {
  if (task.status === "COMPLETED") return "Completada";
  if (!task.dueDate) return "";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} dia(s) de retraso`;
  if (diff === 0) return "Vence hoy";
  if (diff === 1) return "Vence manana";
  return `${diff} dias restantes`;
}

function getDaysColor(task: CalendarTask): string {
  if (task.status === "COMPLETED") return "text-green-600 dark:text-green-400";
  if (!task.dueDate) return "text-muted-foreground";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "text-red-600 dark:text-red-400";
  if (diff <= 2) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export default function CalendarTaskPreview({ task, onClose }: CalendarTaskPreviewProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const focusableElements = modal.querySelectorAll<HTMLElement>(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-preview-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={modalRef}
        className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg m-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2
            id="task-preview-title"
            className="text-lg font-bold text-foreground truncate pr-4"
          >
            {task.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {isOverdue(task) && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                Vencida
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Descripcion
              </p>
              <p className="text-sm text-foreground line-clamp-3">
                {task.description}
              </p>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-foreground">
                {formatDate(task.dueDate)}
              </span>
              <span className={`text-xs font-medium ${getDaysColor(task)}`}>
                {getDaysLabel(task)}
              </span>
            </div>
          )}

          {/* Customer */}
          {task.customer && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-foreground">{task.customer.name}</span>
            </div>
          )}

          {/* Workers */}
          {task.workers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UsersIcon className="w-3.5 h-3.5" />
                Asignados
              </p>
              <div className="flex flex-wrap gap-2">
                {task.workers.map((worker) => (
                  <span
                    key={worker.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-muted rounded-lg"
                  >
                    {worker.image ? (
                      <img
                        src={worker.image}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-section-tasks/20 text-section-tasks flex items-center justify-center text-[10px] font-bold">
                        {(worker.name || worker.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="text-foreground">
                      {worker.name || worker.email}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Link href={`/tasks/${task.id}`}>
            <Button size="sm">Ver detalle</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  if (!portalRoot) return content;
  return createPortal(content, portalRoot);
}
