"use client";

import type { CalendarTask } from "./calendar-client";

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface CalendarGridProps {
  year: number;
  month: number;
  tasksByDay: Map<number, CalendarTask[]>;
  onTaskClick: (task: CalendarTask) => void;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_STYLES: Record<string, { border: string; bg: string }> = {
  PENDING: {
    border: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/15",
  },
  IN_PROGRESS: {
    border: "border-l-cyan-600 dark:border-l-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/15",
  },
  COMPLETED: {
    border: "border-l-green-500",
    bg: "bg-green-50 dark:bg-green-900/15",
  },
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-gray-400",
};

function isOverdue(task: CalendarTask): boolean {
  if (task.status === "COMPLETED" || !task.dueDate) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < now;
}

function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday-first: (getDay() + 6) % 7 → Mon=0, Tue=1, ..., Sun=6
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: d, month: m, year: y, isCurrentMonth: false, isToday: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: d,
      month,
      year,
      isCurrentMonth: true,
      isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
    });
  }

  // Next month leading days
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({ date: d, month: m, year: y, isCurrentMonth: false, isToday: false });
    }
  }

  return days;
}

export default function CalendarGrid({ year, month, tasksByDay, onTaskClick }: CalendarGridProps) {
  const days = generateCalendarDays(year, month);
  const MAX_VISIBLE = 3;

  return (
    <div className="bg-background border border-section-tasks-border rounded-2xl overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-section-tasks-light">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2.5 text-center text-xs font-semibold text-section-tasks uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 border-t border-section-tasks-border">
        {days.map((day) => {
          const dayTasks = day.isCurrentMonth ? tasksByDay.get(day.date) || [] : [];
          const hasOverflow = dayTasks.length > MAX_VISIBLE;
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE);

          return (
            <div
              key={`${day.year}-${day.month}-${day.date}`}
              className={`min-h-[110px] border-b border-r border-border p-1.5 transition-colors ${
                day.isCurrentMonth ? "bg-background" : "bg-muted/30"
              } ${day.isToday ? "ring-2 ring-inset ring-section-tasks bg-section-tasks-light/60 shadow-sm shadow-section-tasks/10" : ""}`}
            >
              {/* Day number + task count */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    day.isToday
                      ? "bg-section-tasks text-white"
                      : day.isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground opacity-40"
                  }`}
                >
                  {day.date}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-semibold text-section-tasks bg-section-tasks-light rounded-full px-1.5 py-0.5 leading-none">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Tasks */}
              <div className="space-y-0.5">
                {visibleTasks.map((task) => {
                  const styles = STATUS_STYLES[task.status] || STATUS_STYLES.PENDING;
                  const overdue = isOverdue(task);

                  return (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`block w-full text-left px-1.5 py-0.5 text-[11px] leading-tight rounded border-l-2 ${
                        styles.border
                      } ${styles.bg} hover:brightness-95 dark:hover:brightness-125 transition-all truncate group cursor-pointer`}
                      title={task.title}
                    >
                      <span className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            PRIORITY_DOT[task.priority] || PRIORITY_DOT.LOW
                          }`}
                        />
                        {overdue && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" title="Vencida" />
                        )}
                        <span className={`truncate ${
                          task.status === "COMPLETED"
                            ? "text-muted-foreground line-through"
                            : "text-foreground group-hover:text-section-tasks"
                        }`}>
                          {task.title}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {hasOverflow && (
                  <p className="text-[10px] text-muted-foreground px-1.5">
                    +{dayTasks.length - MAX_VISIBLE} mas
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
