"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">SerTEC</span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/customers"
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Clientes
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/settings"
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Configuración
              </Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {/* Profile link */}
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                  <span className="text-xs font-medium text-primary">
                    {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden sm:inline">{user.name || "Mi perfil"}</span>
            </Link>

            {/* Role badge */}
            {isSuperAdmin && (
              <span className="hidden sm:inline px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                SUPER ADMIN
              </span>
            )}
            {user.role === "ADMIN" && !isSuperAdmin && (
              <span className="hidden sm:inline px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                ADMIN
              </span>
            )}

            {/* Sign out */}
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 font-medium transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
