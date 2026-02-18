"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@/components/ui/icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 py-2.5
              bg-muted/50
              border rounded-xl
              text-foreground
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background
              disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-50
              transition-all
              ${isPassword ? "pr-10" : ""}
              ${error ? "border-red-500 dark:border-red-400" : "border-border"}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
