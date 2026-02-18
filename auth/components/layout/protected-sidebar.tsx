"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  MenuIcon,
  CloseIcon,
  CompanyLogo,
  CompanyBanner,
  BarChartIcon,
  UsersIcon,
  ClipboardIcon,
  CalendarIcon,
  AdminUsersIcon,
  SettingsIcon,
  LogOutIcon,
  UserIcon,
} from "@/components/ui/icons";

interface ProtectedSidebarProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
    role?: string;
  };
  signOutAction: () => void;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ProtectedSidebar({ user, signOutAction }: ProtectedSidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  // Close on ESC
  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobile();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, closeMobile]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const navLinks: NavLink[] = [
    { href: "/dashboard", label: "Dashboard", icon: BarChartIcon },
    { href: "/customers", label: "Clientes", icon: UsersIcon },
    { href: "/tasks", label: "Tareas", icon: ClipboardIcon },
    { href: "/calendar", label: "Calendario", icon: CalendarIcon },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: AdminUsersIcon }]
      : []),
    { href: "/settings", label: "Configuracion", icon: SettingsIcon },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // ─── Shared sidebar content ───
  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo section */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
        <Link
          href="/dashboard"
          onClick={isMobile ? closeMobile : undefined}
          className="flex items-center shrink-0"
        >
          <CompanyBanner className="h-10 w-auto max-w-[200px] rounded-lg shadow-md shadow-primary/20" />
        </Link>
        {isMobile && (
          <button
            onClick={closeMobile}
            className="ml-auto p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar menu"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 min-h-0">
        <div className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={isMobile ? closeMobile : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  active
                    ? "bg-primary/10 text-primary border-l-3 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-4 space-y-3 shrink-0">
        {/* Theme toggle */}
        <div className="flex items-center gap-3 px-3 py-1">
          <ThemeToggle />
          <span className="text-xs text-muted-foreground">Tema</span>
        </div>

        {/* Profile link */}
        <Link
          href="/profile"
          onClick={isMobile ? closeMobile : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
            isActive("/profile")
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted"
          }`}
        >
          {user.image ? (
            <img
              src={user.image}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-border shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-border shrink-0">
              <span className="text-sm font-semibold text-primary">
                {user.name?.charAt(0)?.toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name || "Mi perfil"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </Link>

        {/* Sign out */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOutIcon className="w-5 h-5 shrink-0" />
            Cerrar Sesion
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* ─── Desktop sidebar (≥lg) ─── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-background z-40">
        {sidebarContent(false)}
      </aside>
      {/* Spacer to push main content right */}
      <div className="hidden lg:block lg:w-64 shrink-0" />

      {/* ─── Mobile top bar (<lg) ─── */}
      <div className="lg:hidden sticky top-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menu de navegacion"
        >
          <MenuIcon />
        </button>
        <Link href="/dashboard" className="flex items-center shrink-0">
          <CompanyLogo className="w-8 h-8 shadow-sm shadow-primary/20" />
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* ─── Mobile drawer (<lg) via portal ─── */}
      {mobileOpen &&
        portalRoot &&
        createPortal(
          <div
            className="fixed inset-0 lg:hidden"
            style={{ zIndex: 9999 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={closeMobile}
              aria-hidden="true"
            />
            {/* Slide-out drawer */}
            <aside className="absolute top-0 left-0 bottom-0 w-72 bg-background border-r border-border shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
              {sidebarContent(true)}
            </aside>
          </div>,
          portalRoot
        )}
    </>
  );
}
