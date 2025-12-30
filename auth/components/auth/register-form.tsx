"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/buttons";
import PasswordStrength from "@/components/ui/password-strength";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { z } from "zod";

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput | "root", string>>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string || undefined,
    };

    // Validación cliente con Zod
    try {
      registerSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterInput] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }
    }

    // Enviar al API
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ root: result.error || "Error al registrar" });
        setIsLoading(false);
        return;
      }

      // Registro exitoso - redirigir al login
      router.push("/login?registered=true");
    } catch (error) {
      setErrors({ root: "Error de conexión" });
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.root && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {errors.root}
        </div>
      )}

      <Input
        name="name"
        type="text"
        label="Nombre (opcional)"
        placeholder="Tu nombre"
        error={errors.name}
        disabled={isLoading}
      />

      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        error={errors.email}
        disabled={isLoading}
        required
      />

      <div>
        <Input
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Crea una contraseña segura"
          error={errors.password}
          disabled={isLoading}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength password={password} />
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        {isLoading ? "Registrando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}