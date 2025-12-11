import { ButtonHTMLAttributes, forwardRef, RefAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>{
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        children,
        variant = "primary",
        size = "md",
        isLoading = false,
        fullWidth = false,
        className = "",
        disabled,
        ...props
    }, ref) => {
        
        const baseStyles = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

        const variantStyles = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
            secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
            outline: "border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
            ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
        };
        const sizeStyles = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-base",
            lg: "px-6 py-3 text-lg",
        };
        const witdhStyle = fullWidth ? "w-full" : "";

        return (
            <button
            ref={ref}
            disabled={disabled || isLoading}
            className={`
                ${baseStyles}
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${witdhStyle}
                ${className}
            `}
            {...props}
            >
            {isLoading && (
                <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                >
                <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                />
                </svg>
                )}
                {children}
            </button>
                )
                }
)

Button.displayName = "Button";

export default Button;