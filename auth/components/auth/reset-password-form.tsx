"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/input";
import Button from "@/components/ui/buttons";
import PasswordStrength from "@/components/ui/password-strength";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { z } from "zod";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordInput | "root", string>>>({});
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-300">
            Enlace inválido. Solicita un nuevo enlace de recuperación.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-block text-primary hover:text-primary/80 font-medium"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      token: token!,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    // Validación cliente
    try {
      resetPasswordSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ResetPasswordInput] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ root: result.error || "Error al restablecer la contraseña" });
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 2000);
    } catch (error) {
      setErrors({ root: "Error de conexión" });
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300">
            ¡Contraseña actualizada correctamente!
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirigiendo al login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.root && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {errors.root}
        </div>
      )}

      <div>
        <Input
          name="password"
          type="password"
          label="Nueva contraseña"
          placeholder="Crea una contraseña segura"
          error={errors.password}
          disabled={isLoading}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength password={password} />
      </div>

      <Input
        name="confirmPassword"
        type="password"
        label="Confirmar contraseña"
        placeholder="Repite la contraseña"
        error={errors.confirmPassword}
        disabled={isLoading}
        required
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
      </Button>
    </form>
  );
}
