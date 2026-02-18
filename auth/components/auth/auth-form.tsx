"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanyLogo, CompanyBanner } from "@/components/ui/icons";

interface AuthFormProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthForm({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthFormProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center shrink-0">
          {/* Banner on larger screens, logo + text on small */}
          <CompanyBanner className="hidden sm:block h-10 w-auto max-w-[220px] rounded-lg shadow-md shadow-primary/20" />
          <div className="sm:hidden flex items-center gap-2.5">
            <CompanyLogo className="w-9 h-9 shadow-md shadow-primary/20" />
            <span className="text-xl font-bold text-foreground tracking-tight">SerTEC</span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{title}</h2>
            {subtitle && (
              <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="bg-background border border-border py-8 px-6 shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl">
            {children}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
