"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/buttons";

export default function TwoFactorSetup() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "disable">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/2fa/status");
      const data = await res.json();
      if (res.ok) {
        setIsEnabled(data.twoFactorEnabled);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetup() {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/2fa/setup", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep("setup");
      } else {
        setError(data.error || "Error al iniciar configuración");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsEnabled(true);
        setStep("idle");
        setSuccess("2FA activado correctamente");
        setCode("");
      } else {
        setError(data.error || "Error al verificar código");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsEnabled(false);
        setStep("idle");
        setSuccess("2FA desactivado correctamente");
        setCode("");
      } else {
        setError(data.error || "Error al desactivar 2FA");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Current status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">
            Estado: {isEnabled ? (
              <span className="text-green-600 dark:text-green-400">Activado</span>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-400">Desactivado</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {isEnabled
              ? "Tu cuenta está protegida con autenticación de dos factores."
              : "Activa 2FA para mayor seguridad en tu cuenta."}
          </p>
        </div>
      </div>

      {/* Idle state */}
      {step === "idle" && (
        <div>
          {!isEnabled ? (
            <Button onClick={handleSetup} isLoading={actionLoading}>
              Activar 2FA
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => { setStep("disable"); setError(""); setSuccess(""); setCode(""); }}
            >
              Desactivar 2FA
            </Button>
          )}
        </div>
      )}

      {/* Setup step - show QR code */}
      {step === "setup" && (
        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Paso 1: Escanea el código QR</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Usa una app de autenticación como Google Authenticator, Authy o 1Password para escanear este código.
            </p>
            <div className="flex justify-center bg-white p-4 rounded-lg border border-border">
              {qrCode && (
                <img src={qrCode} alt="Código QR para 2FA" className="w-48 h-48" />
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Si no puedes escanear el código, ingresa esta clave manualmente en tu app:
            </p>
            <code className="block p-3 bg-muted rounded-lg text-sm font-mono break-all text-center text-foreground">
              {secret}
            </code>
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <h4 className="font-medium text-foreground mb-2">Paso 2: Ingresa el código de verificación</h4>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" isLoading={actionLoading} disabled={code.length !== 6}>
                Verificar y activar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep("idle"); setCode(""); setError(""); }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Disable step */}
      {step === "disable" && (
        <form onSubmit={handleDisable} className="space-y-3 border-t border-border pt-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Ingresa tu código 2FA para confirmar</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Para desactivar 2FA, ingresa un código de tu app de autenticación.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="danger" isLoading={actionLoading} disabled={code.length !== 6}>
              Confirmar desactivación
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setStep("idle"); setCode(""); setError(""); }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
