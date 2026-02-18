"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MenuIcon, CompanyLogo, CompanyBanner, CloseIcon } from "@/components/ui/icons";

interface ProtectedNavProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
    role?: string;
  };
  signOutAction: () => void;
}

export function ProtectedNav({ user, signOutAction }: ProtectedNavProps) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Get portal root on mount (client-side only)
  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  // Close on ESC key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileMenu();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, closeMobileMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/customers", label: "Clientes" },
    { href: "/tasks", label: "Tareas" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    { href: "/settings", label: "Configuracion" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Nav */}
            <div className="flex items-center gap-6">
              {/* Hamburger button - visible below md */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Abrir menu de navegacion"
              >
                <MenuIcon />
              </button>

              <Link href="/dashboard" className="flex items-center shrink-0">
                {/* Banner on desktop, logo on small screens */}
                <CompanyBanner className="hidden sm:block h-10 w-auto max-w-[220px] rounded-lg shadow-md shadow-primary/20" />
                <CompanyLogo className="sm:hidden w-9 h-9 shadow-md shadow-primary/20" />
              </Link>

              {/* Desktop navigation links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {/* Profile link */}
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-xl hover:bg-muted"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-border">
                    <span className="text-xs font-semibold text-primary">
                      {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden sm:inline font-medium">{user.name || "Mi perfil"}</span>
              </Link>

              {/* Sign out */}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 font-medium transition-colors px-2 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu - rendered via portal to escape nav stacking context */}
      {mobileMenuOpen && portalRoot && createPortal(
        <div className="fixed inset-0 md:hidden" style={{ zIndex: 9999 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Slide-out drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-background border-r border-border shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0">
              <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center">
                <CompanyBanner className="h-10 w-auto max-w-[200px] rounded-lg shadow-md shadow-primary/20" />
              </Link>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Cerrar menu"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto py-4 px-3 min-h-0">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Drawer footer - profile & sign out */}
            <div className="border-t border-border p-4 space-y-3 shrink-0">
              <Link
                href="/profile"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
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
                      {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name || "Mi perfil"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  Cerrar Sesion
                </button>
              </form>
            </div>
          </div>
        </div>,
        portalRoot
      )}
    </>
  );
}
