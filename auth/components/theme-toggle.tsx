"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl border border-border bg-background hover:bg-muted transition-all duration-200 group"
      aria-label={resolvedTheme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {/* Sun icon - visible in light mode */}
      <svg
        className={`w-5 h-5 transition-all duration-300 ${
          resolvedTheme === "light"
            ? "text-amber-500 rotate-0 scale-100"
            : "text-amber-500 rotate-90 scale-0 absolute inset-0 m-auto"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      {/* Moon icon - visible in dark mode */}
      <svg
        className={`w-5 h-5 transition-all duration-300 ${
          resolvedTheme === "dark"
            ? "text-teal-400 rotate-0 scale-100"
            : "text-teal-400 -rotate-90 scale-0 absolute inset-0 m-auto"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
