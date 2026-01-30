"use client";

import { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/buttons";
import PasswordStrength from "@/components/ui/password-strength";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validación básica
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Contraseña actualizada correctamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Error al cambiar la contraseña");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          {success}
        </div>
      )}

      <Input
        type="password"
        label="Contraseña actual"
        placeholder="Tu contraseña actual"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      <div>
        <Input
          type="password"
          label="Nueva contraseña"
          placeholder="Crea una contraseña segura"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
          required
        />
        <PasswordStrength password={newPassword} />
      </div>

      <Input
        type="password"
        label="Confirmar nueva contraseña"
        placeholder="Repite la nueva contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {isLoading ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}