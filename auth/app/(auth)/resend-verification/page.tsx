"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/input";
import Button from "@/components/ui/buttons";
import { CheckIcon } from "@/components/ui/icons";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || "Error al enviar el email");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Reenviar verificación</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Introduce tu email para recibir un nuevo enlace de verificación
          </p>
        </div>

        <div className="bg-background border border-border py-8 px-6 shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-muted-foreground mb-6">
                Si el email existe y no está verificado, recibirás un nuevo enlace.
              </p>
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  {error}
                </div>
              )}

              <Input
                type="email"
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                {isLoading ? "Enviando..." : "Enviar enlace"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
