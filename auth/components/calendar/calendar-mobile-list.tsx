"use client";

import Link from "next/link";
import { CalendarIcon } from "@/components/ui/icons";
import { TaskStatusBadge, PriorityBadge } from "@/components/ui/badges";
import type { CalendarTask } from "./calendar-client";

interface CalendarMobileListProps {
  year: number;
  month: number;
  tasksByDay: Map<number, CalendarTask[]>;
}

function formatDayLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
}

export default function CalendarMobileList({ year, month, tasksByDay }: CalendarMobileListProps) {
  // Get sorted days that have tasks
  const daysWithTasks = Array.from(tasksByDay.keys()).sort((a, b) => a - b);

  if (daysWithTasks.length === 0) {
    return (
      <div className="bg-background border border-section-tasks-border rounded-2xl p-12 text-center">
        <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay tareas con fecha limite este mes</p>
        <p className="text-sm text-muted-foreground mt-1">
          Asigna fechas limite a tus tareas para verlas en el calendario
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {daysWithTasks.map((day) => {
        const tasks = tasksByDay.get(day) || [];
        const today = isToday(year, month, day);

        return (
          <div
            key={day}
            className={`bg-background border rounded-2xl overflow-hidden ${
              today
                ? "border-section-tasks ring-2 ring-section-tasks/20"
                : "border-section-tasks-border"
            }`}
          >
            {/* Day header */}
            <div className={`px-4 py-2.5 ${
              today ? "bg-section-tasks text-white" : "bg-section-tasks-light"
            }`}>
              <p className={`text-sm font-semibold capitalize ${
                today ? "text-white" : "text-section-tasks"
              }`}>
                {formatDayLabel(year, month, day)}
                {today && (
                  <span className="ml-2 text-xs font-normal opacity-90">
                    (hoy)
                  </span>
                )}
              </p>
            </div>

            {/* Tasks list */}
            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      task.status === "COMPLETED"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}>
                      {task.title}
                    </p>
                    {task.customer && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {task.customer.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <TaskStatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
