"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { WarningIcon, ClockIcon, CloseIcon } from "@/components/ui/icons";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AlertTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  customer?: { id: string; name: string } | null;
}

type UrgencyGroup = "overdue" | "dueToday" | "dueWeek";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(dateStr: string): number {
  const now = today();
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function priorityDot(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "bg-red-500";
    case "MEDIUM":
      return "bg-amber-500";
    default:
      return "bg-green-500";
  }
}

const MAX_PER_GROUP = 5;
const SESSION_KEY = "deadline-alert-shown";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DeadlineAlert() {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [overdue, setOverdue] = useState<AlertTask[]>([]);
  const [dueToday, setDueToday] = useState<AlertTask[]>([]);
  const [dueWeek, setDueWeek] = useState<AlertTask[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  /* --- Dismiss --------------------------------------------------- */
  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "true");
  }, []);

  /* --- Fetch on mount -------------------------------------------- */
  useEffect(() => {
    setPortalRoot(document.body);

    // Already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const controller = new AbortController();

    const now = today();
    // 14 days back to catch overdue, 7 days forward for upcoming
    const from = new Date(now);
    from.setDate(from.getDate() - 14);
    const to = new Date(now);
    to.setDate(to.getDate() + 7);

    fetch(`/api/tasks?from=${from.toISOString()}&to=${to.toISOString()}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.tasks) return;

        const tasks: AlertTask[] = data.tasks.filter(
          (t: AlertTask) => t.status !== "COMPLETED" && t.dueDate
        );

        const overdueArr: AlertTask[] = [];
        const todayArr: AlertTask[] = [];
        const weekArr: AlertTask[] = [];

        for (const task of tasks) {
          const diff = diffDays(task.dueDate);
          if (diff < 0) overdueArr.push(task);
          else if (diff <= 1) todayArr.push(task);
          else weekArr.push(task);
        }

        if (overdueArr.length === 0 && todayArr.length === 0 && weekArr.length === 0) {
          return;
        }

        setOverdue(overdueArr);
        setDueToday(todayArr);
        setDueWeek(weekArr);
        setVisible(true);
      })
      .catch((err: unknown) => {
        if ((err as DOMException).name !== "AbortError") {
          /* silent — user will see tasks normally in the calendar */
        }
      });

    return () => { controller.abort(); };
  }, []);

  /* --- ESC key --------------------------------------------------- */
  useEffect(() => {
    if (!visible) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, dismiss]);

  /* --- Focus trap ------------------------------------------------ */
  useEffect(() => {
    if (!visible) return;
    const modal = modalRef.current;
    if (!modal) return;

    const sel = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const elements = modal.querySelectorAll<HTMLElement>(sel);
    const first = elements[0];
    const last = elements[elements.length - 1];
    first?.focus();

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [visible]);

  /* --- Body scroll lock ------------------------------------------ */
  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  /* --- Render a group -------------------------------------------- */
  function renderGroup(
    label: string,
    tasks: AlertTask[],
    group: UrgencyGroup
  ) {
    if (tasks.length === 0) return null;

    const styles: Record<UrgencyGroup, { header: string; card: string; dot: string }> = {
      overdue: {
        header: "text-red-700 dark:text-red-400",
        card: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20",
        dot: "bg-red-500 animate-pulse",
      },
      dueToday: {
        header: "text-amber-700 dark:text-amber-400",
        card: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20",
        dot: "bg-amber-500",
      },
      dueWeek: {
        header: "text-section-tasks",
        card: "border-section-tasks-border bg-section-tasks-light",
        dot: "bg-section-tasks",
      },
    };

    const s = styles[group];
    const shown = tasks.slice(0, MAX_PER_GROUP);
    const extra = tasks.length - shown.length;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          <h4 className={`text-sm font-semibold ${s.header}`}>
            {label}{" "}
            <span className="font-normal opacity-75">({tasks.length})</span>
          </h4>
        </div>

        <div className="space-y-1.5">
          {shown.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              onClick={dismiss}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors hover:opacity-80 ${s.card}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot(task.priority)}`} />
              <span className="truncate flex-1 text-foreground font-medium">
                {task.title}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(task.dueDate)}
              </span>
            </Link>
          ))}
          {extra > 0 && (
            <p className={`text-xs pl-7 ${s.header} opacity-75`}>
              +{extra} mas
            </p>
          )}
        </div>
      </div>
    );
  }

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9998 }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="deadline-alert-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={modalRef}
        className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl m-4 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <WarningIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="deadline-alert-title"
              className="text-lg font-bold text-foreground"
            >
              Tareas Pendientes
            </h3>
            <p className="text-xs text-muted-foreground">
              Tienes tareas que requieren atencion
            </p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {renderGroup("Vencidas", overdue, "overdue")}
          {renderGroup("Vencen hoy / manana", dueToday, "dueToday")}
          {renderGroup("Proximos 7 dias", dueWeek, "dueWeek")}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <button
            onClick={dismiss}
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );

  if (!portalRoot) return content;
  return createPortal(content, portalRoot);
}
