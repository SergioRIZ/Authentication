"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./buttons";
import { WarningIcon, InfoCircleIcon } from "@/components/ui/icons";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = modal.querySelectorAll<HTMLElement>(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus the cancel button by default (safer action)
    lastFocusable?.focus();

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
      style={{ zIndex: 10000 }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={modalRef}
        className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md m-4 p-6"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
          variant === "danger"
            ? "bg-red-100 dark:bg-red-900/30"
            : "bg-primary/10"
        }`}>
          {variant === "danger" ? (
            <WarningIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          ) : (
            <InfoCircleIcon className="w-6 h-6 text-primary" />
          )}
        </div>

        <h3 id="confirm-dialog-title" className="text-lg font-bold text-foreground text-center mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="text-sm text-muted-foreground text-center mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            fullWidth
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!portalRoot) return content;
  return createPortal(content, portalRoot);
}
