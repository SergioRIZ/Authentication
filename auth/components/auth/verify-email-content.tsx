"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SpinnerIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token no proporcionado");
      return;
    }

    verifyEmail();
  }, [token]);

  async function verifyEmail() {
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("¡Tu email ha sido verificado correctamente!");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al verificar el email");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Error de conexión");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-background border border-border py-8 px-6 shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl text-center">
          {status === "loading" && (
            <>
              <SpinnerIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground">Verificando tu email...</h2>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{message}</h2>
              <p className="text-muted-foreground mb-6">Ya puedes iniciar sesión en tu cuenta.</p>
              <Link
                href="/login"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Iniciar sesión
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CloseIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Error de verificación</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/resend-verification"
                  className="block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Solicitar nuevo enlace
                </Link>
                <Link
                  href="/login"
                  className="block text-primary hover:text-primary/80"
                >
                  Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
