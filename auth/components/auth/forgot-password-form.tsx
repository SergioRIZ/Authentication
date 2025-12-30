"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/input";
import Button from "@/components/ui/buttons";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { z } from "zod";

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    // Validación cliente
    try {
      forgotPasswordSchema.parse({ email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/forgot-password", {
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

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            Si el email existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Revisa tu bandeja de entrada y spam.
        </p>
        <Link
          href="/login"
          className="inline-block text-blue-600 hover:text-blue-500 font-medium"
        >
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        disabled={isLoading}
        required
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {isLoading ? "Enviando..." : "Enviar enlace"}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Volver al login
        </Link>
      </div>
    </form>
  );
}