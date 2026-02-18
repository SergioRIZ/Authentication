import { ButtonHTMLAttributes, forwardRef } from "react";
import { SpinnerIcon } from "@/components/ui/icons";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-md shadow-primary/20",
      secondary:
        "bg-muted text-foreground hover:bg-muted/80 focus:ring-muted",
      outline:
        "border border-border bg-background text-foreground hover:bg-muted focus:ring-primary",
      ghost:
        "text-foreground hover:bg-muted focus:ring-primary",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700 shadow-md shadow-red-600/20",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${widthStyle}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <SpinnerIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
