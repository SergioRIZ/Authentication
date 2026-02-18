// --- Base badge style ---
const base = "px-2.5 py-1 text-xs font-semibold rounded-full";

// Color definitions: [lightBg, lightText, lightBorder, darkBg, darkText, darkBorder]
type BadgeColor = {
  lightBg: string;
  lightText: string;
  lightBorder: string;
  darkBg: string;
  darkText: string;
  darkBorder: string;
};

const COLORS = {
  green: {
    lightBg: "#dcfce7",
    lightText: "#15803d",
    lightBorder: "#86efac",
    darkBg: "rgba(34,197,94,0.15)",
    darkText: "#86efac",
    darkBorder: "rgba(34,197,94,0.3)",
  },
  red: {
    lightBg: "#fee2e2",
    lightText: "#b91c1c",
    lightBorder: "#fca5a5",
    darkBg: "rgba(239,68,68,0.15)",
    darkText: "#fca5a5",
    darkBorder: "rgba(239,68,68,0.3)",
  },
  blue: {
    lightBg: "#dbeafe",
    lightText: "#1d4ed8",
    lightBorder: "#93c5fd",
    darkBg: "rgba(59,130,246,0.15)",
    darkText: "#93c5fd",
    darkBorder: "rgba(59,130,246,0.3)",
  },
  amber: {
    lightBg: "#fef3c7",
    lightText: "#b45309",
    lightBorder: "#fcd34d",
    darkBg: "rgba(245,158,11,0.15)",
    darkText: "#fcd34d",
    darkBorder: "rgba(245,158,11,0.3)",
  },
  purple: {
    lightBg: "#f3e8ff",
    lightText: "#7e22ce",
    lightBorder: "#d8b4fe",
    darkBg: "rgba(168,85,247,0.15)",
    darkText: "#d8b4fe",
    darkBorder: "rgba(168,85,247,0.3)",
  },
  orange: {
    lightBg: "#ffedd5",
    lightText: "#c2410c",
    lightBorder: "#fdba74",
    darkBg: "rgba(249,115,22,0.15)",
    darkText: "#fdba74",
    darkBorder: "rgba(249,115,22,0.3)",
  },
  yellow: {
    lightBg: "#fef9c3",
    lightText: "#a16207",
    lightBorder: "#fde047",
    darkBg: "rgba(234,179,8,0.15)",
    darkText: "#fde047",
    darkBorder: "rgba(234,179,8,0.3)",
  },
  gray: {
    lightBg: "#f3f4f6",
    lightText: "#374151",
    lightBorder: "#d1d5db",
    darkBg: "rgba(107,114,128,0.15)",
    darkText: "#9ca3af",
    darkBorder: "rgba(107,114,128,0.3)",
  },
} satisfies Record<string, BadgeColor>;

function BadgeSpan({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
  return (
    <span
      className={`${base} badge-pill`}
      style={{
        "--badge-bg-light": color.lightBg,
        "--badge-text-light": color.lightText,
        "--badge-border-light": color.lightBorder,
        "--badge-bg-dark": color.darkBg,
        "--badge-text-dark": color.darkText,
        "--badge-border-dark": color.darkBorder,
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
}

// ============================================================
// Task Status Badge (PENDING / IN_PROGRESS / COMPLETED)
// ============================================================
const taskStatusColors: Record<string, BadgeColor> = {
  COMPLETED: COLORS.green,
  IN_PROGRESS: COLORS.blue,
  PENDING: COLORS.amber,
};

const taskStatusLabels: Record<string, string> = {
  COMPLETED: "Completada",
  IN_PROGRESS: "En Progreso",
  PENDING: "Pendiente",
};

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <BadgeSpan color={taskStatusColors[status] || COLORS.amber}>
      {taskStatusLabels[status] || "Pendiente"}
    </BadgeSpan>
  );
}

// ============================================================
// Priority Badge (HIGH / MEDIUM / LOW)
// ============================================================
const priorityColors: Record<string, BadgeColor> = {
  HIGH: COLORS.red,
  MEDIUM: COLORS.amber,
  LOW: COLORS.gray,
};

const priorityLabels: Record<string, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <BadgeSpan color={priorityColors[priority] || COLORS.gray}>
      {priorityLabels[priority] || "Baja"}
    </BadgeSpan>
  );
}

// ============================================================
// Customer Category Badge (PREMIUM / REGULAR / OCCASIONAL)
// ============================================================
const categoryColors: Record<string, BadgeColor> = {
  PREMIUM: COLORS.purple,
  OCCASIONAL: COLORS.amber,
  REGULAR: COLORS.blue,
};

const categoryLabels: Record<string, string> = {
  PREMIUM: "Premium",
  OCCASIONAL: "Ocasional",
  REGULAR: "Regular",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <BadgeSpan color={categoryColors[category] || COLORS.blue}>
      {categoryLabels[category] || "Regular"}
    </BadgeSpan>
  );
}

// ============================================================
// Customer Status Badge (ACTIVE / INACTIVE)
// ============================================================
const customerStatusColors: Record<string, BadgeColor> = {
  ACTIVE: COLORS.green,
  INACTIVE: COLORS.gray,
};

const customerStatusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

export function CustomerStatusBadge({ status }: { status: string }) {
  return (
    <BadgeSpan color={customerStatusColors[status] || COLORS.gray}>
      {customerStatusLabels[status] || "Inactivo"}
    </BadgeSpan>
  );
}

// ============================================================
// Role Badge (SUPER_ADMIN / ADMIN / USER)
// ============================================================
const roleColors: Record<string, BadgeColor> = {
  SUPER_ADMIN: COLORS.purple,
  ADMIN: COLORS.orange,
  USER: COLORS.gray,
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  USER: "Usuario",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <BadgeSpan color={roleColors[role] || COLORS.gray}>
      {roleLabels[role] || "Usuario"}
    </BadgeSpan>
  );
}

// ============================================================
// Email Verification Badge
// ============================================================
export function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <BadgeSpan color={COLORS.green}>Verificado</BadgeSpan>
  ) : (
    <BadgeSpan color={COLORS.yellow}>Pendiente</BadgeSpan>
  );
}
