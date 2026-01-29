"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/input";
import Button from "@/components/ui/buttons";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { z } from "zod";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput | "root", string>>>({});
  const [showResendLink, setShowResendLink] = useState(false);

  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setShowResendLink(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      loginSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginInput] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          setErrors({ root: "Debes verificar tu email antes de iniciar sesión." });
          setShowResendLink(true);
        } else if (result.error.includes("TWO_FACTOR_REQUIRED")) {
          setNeeds2FA(true);
          setSavedCredentials(data);
          setErrors({});
        } else if (result.error.includes("TWO_FACTOR_INVALID")) {
          setErrors({ root: "Código 2FA incorrecto. Inténtalo de nuevo." });
        } else if (result.error.includes("ACCOUNT_LOCKED")) {
          setErrors({ root: "Tu cuenta está temporalmente bloqueada por demasiados intentos fallidos. Inténtalo en 15 minutos." });
        } else {
          setErrors({ root: "Email o contraseña incorrectos" });
        }
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrors({ root: "Error de conexión" });
      setIsLoading(false);
    }
  }

  async function onSubmit2FA(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!savedCredentials) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn("credentials", {
        email: savedCredentials.email,
        password: savedCredentials.password,
        totpCode,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("TWO_FACTOR_INVALID")) {
          setErrors({ root: "Código 2FA incorrecto. Inténtalo de nuevo." });
        } else if (result.error.includes("TWO_FACTOR_REQUIRED")) {
          setErrors({ root: "Código 2FA requerido." });
        } else {
          setErrors({ root: "Error de autenticación" });
        }
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrors({ root: "Error de conexión" });
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  // 2FA verification screen
  if (needs2FA) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Verificación en dos pasos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresa el código de tu app de autenticación
          </p>
        </div>

        <form onSubmit={onSubmit2FA} className="space-y-4">
          {errors.root && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {errors.root}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            autoFocus
            disabled={isLoading}
          />

          <Button type="submit" fullWidth isLoading={isLoading} disabled={totpCode.length !== 6}>
            Verificar
          </Button>

          <button
            type="button"
            onClick={() => {
              setNeeds2FA(false);
              setSavedCredentials(null);
              setTotpCode("");
              setErrors({});
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Volver al inicio de sesión
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {registered && (
        <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          ¡Cuenta creada! Revisa tu email para verificar tu cuenta.
        </div>
      )}

      {reset && (
        <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          ¡Contraseña actualizada! Ya puedes iniciar sesión.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {errors.root && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            {errors.root}
            {showResendLink && (
              <Link
                href="/resend-verification"
                className="block mt-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Reenviar email de verificación →
              </Link>
            )}
          </div>
        )}

        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          error={errors.email}
          disabled={isLoading || isGoogleLoading}
          required
        />

        <Input
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Tu contraseña"
          error={errors.password}
          disabled={isLoading || isGoogleLoading}
          required
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} disabled={isGoogleLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">O continúa con</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleGoogleSignIn}
        isLoading={isGoogleLoading}
        disabled={isLoading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isGoogleLoading ? "Conectando..." : "Google"}
      </Button>
    </div>
  );
}
