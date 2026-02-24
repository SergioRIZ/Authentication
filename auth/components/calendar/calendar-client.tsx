"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CalendarGrid from "./calendar-grid";
import CalendarMobileList from "./calendar-mobile-list";
import CalendarTaskPreview from "./calendar-task-preview";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, SpinnerIcon } from "@/components/ui/icons";

interface Worker {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  createdAt: string;
  customerId: string | null;
  workers: Worker[];
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  customer: {
    id: string;
    name: string;
  } | null;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function CalendarClient() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchTasksForMonth = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError("");
    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

      const response = await fetch(`/api/tasks?from=${from}&to=${to}`, {
        signal: controller.signal,
      });
      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks);
      } else {
        setError(data.error || "Error al cargar tareas");
      }
    } catch (err) {
      if ((err as DOMException).name !== "AbortError") {
        setError("Error de conexion");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [year, month]);

  useEffect(() => {
    fetchTasksForMonth();
    return () => { abortRef.current?.abort(); };
  }, [fetchTasksForMonth]);

  function goToPrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  const tasksByDay = useMemo(() => {
    const map = new Map<number, CalendarTask[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      // Only include tasks whose dueDate falls in the current month
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(task);
      }
    }
    return map;
  }, [tasks, year, month]);

  // Stats
  const totalTasks = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  const isCurrentMonth = (() => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-9 h-9 bg-section-tasks-light border border-section-tasks-border rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-section-tasks" />
            </span>
            Calendario
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualiza las fechas limite de tus tareas
          </p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-section-tasks-light border border-section-tasks-border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-2.5 rounded-xl bg-background border border-border text-foreground hover:bg-muted transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">
              {MONTH_NAMES[month]} {year}
            </h2>
            {!isCurrentMonth && (
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-section-tasks text-white hover:opacity-90 transition-colors"
              >
                Hoy
              </button>
            )}
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2.5 rounded-xl bg-background border border-border text-foreground hover:bg-muted transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Mini stats */}
        {!isLoading && totalTasks > 0 && (
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-section-tasks-border">
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-amber-600 dark:text-amber-400">{pendingCount}</span> pendientes
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-section-tasks">{inProgressCount}</span> en progreso
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-green-600 dark:text-green-400">{completedCount}</span> completadas
            </span>
          </div>
        )}

        {/* Color legend */}
        {!isLoading && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2 pt-2 border-t border-section-tasks-border/50">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2.5 h-1 rounded-full bg-amber-500" /> Pendiente
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2.5 h-1 rounded-full bg-cyan-500" /> En Progreso
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2.5 h-1 rounded-full bg-green-500" /> Completada
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Vencida
            </span>
          </div>
        )}
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
          <SpinnerIcon className="animate-spin h-8 w-8 text-section-tasks" />
        </div>
      ) : (
        <>
          {/* Desktop Grid */}
          <div className="hidden lg:block">
            <CalendarGrid year={year} month={month} tasksByDay={tasksByDay} onTaskClick={setSelectedTask} />
          </div>

          {/* Mobile List */}
          <div className="lg:hidden">
            <CalendarMobileList year={year} month={month} tasksByDay={tasksByDay} onTaskClick={setSelectedTask} />
          </div>
        </>
      )}

      {/* Task preview modal */}
      {selectedTask && (
        <CalendarTaskPreview
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
