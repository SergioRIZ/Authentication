"use client";

import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo((): StrengthResult => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };

    let score = 0;
    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.symbol) score++;

    const levels: Record<number, { label: string; color: string }> = {
      0: { label: "", color: "bg-muted" },
      1: { label: "Muy débil", color: "bg-red-500" },
      2: { label: "Débil", color: "bg-orange-500" },
      3: { label: "Regular", color: "bg-yellow-500" },
      4: { label: "Fuerte", color: "bg-lime-500" },
      5: { label: "Muy fuerte", color: "bg-green-500" },
    };

    return { score, checks, ...levels[score] };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de progreso */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength.score ? strength.color : "bg-muted"
            }`}      />
        ))}
      </div>

      {/* Label */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{strength.label}</span>
      </div>

      {/* Checklist */}
      <ul className="text-xs space-y-1">
        <li className={strength.checks.length ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
          {strength.checks.length ? "✓" : "○"} Mínimo 8 caracteres
        </li>
        <li className={strength.checks.uppercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
          {strength.checks.uppercase ? "✓" : "○"} Una mayúscula
        </li>
        <li className={strength.checks.lowercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
          {strength.checks.lowercase ? "✓" : "○"} Una minúscula
        </li>
        <li className={strength.checks.number ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
          {strength.checks.number ? "✓" : "○"} Un número
        </li>
        <li className={strength.checks.symbol ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
          {strength.checks.symbol ? "✓" : "○"} Un símbolo (!@#$%...)
        </li>
      </ul>
    </div>
  );
}