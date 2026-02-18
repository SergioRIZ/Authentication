"use client";

/**
 * Global error boundary — catches errors thrown inside the root layout.
 * Must include its own <html> and <body> tags because the root layout
 * has already unmounted at this point.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center px-4 font-sans text-gray-900 dark:text-gray-100">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Error critico</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            La aplicacion ha encontrado un error grave. Por favor, intenta
            recargar la pagina.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
            >
              Recargar pagina
            </button>
            <a
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
