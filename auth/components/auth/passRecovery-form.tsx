"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";
import AuthForm from "./auth-form";
import Input from "../ui/input";
import Button from "../ui/buttons";

// Schema de validación solo para email
const passwordRecoverySchema = z.object({
  email: z.string().email("Email inválido"),
});

type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;

export default function PasswordRecoveryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordRecoveryInput>({
    resolver: zodResolver(passwordRecoverySchema),
  });

  const onSubmit = async (data: PasswordRecoveryInput) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Error al enviar el email");
        setIsLoading(false);
        return;
      }

      // Mostrar mensaje de éxito
      setSuccess(true);
    } catch (err) {
      setError("Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm 
      title="Recuperar contraseña" 
      subtitle="Te enviaremos un email para restablecer tu contraseña"
    >
      {/* Mensaje de éxito */}
      {success ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Email enviado
                </h3>
                <p className="mt-2 text-sm text-green-700">
                  Hemos enviado un email con las instrucciones para restablecer tu contraseña. 
                  Por favor revisa tu bandeja de entrada.
                </p>
                <p className="mt-2 text-xs text-green-600">
                  El enlace expirará en 1 hora.
                </p>
              </div>
            </div>
          </div>

          <Link 
            href="/login"
            className="block text-center text-sm text-blue-600 hover:text-blue-500"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <>
          {/* Mensaje de error */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              disabled={isLoading}
              {...register("email")}
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              Enviar email de recuperación
            </Button>
          </form>

          {/* Link de vuelta al login */}
          <p className="text-center text-sm text-gray-600">
            ¿Recordaste tu contraseña?{" "}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Inicia sesión
            </Link>
          </p>
        </>
      )}
    </AuthForm>
  );
}