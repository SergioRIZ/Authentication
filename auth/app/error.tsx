"use client";

import { useEffect } from "react";
import { WarningIcon } from "@/components/ui/icons";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
          <WarningIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Algo salio mal
        </h2>
        <p className="text-muted-foreground mb-8">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al
          inicio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium border border-border text-foreground rounded-xl hover:bg-muted transition-colors"
          >
            Volver al inicio
          </a>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Detalles del error
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-xl text-xs text-red-600 dark:text-red-400 overflow-auto max-h-48">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
