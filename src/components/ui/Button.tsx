import React, { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = "left",
  className = "",
  ...props
}) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant styles
  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    secondary:
      "bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary",
    outline:
      "border border-primary text-primary hover:bg-primary-light focus:ring-primary",
    ghost: "text-primary hover:bg-primary-light focus:ring-primary",
    danger:
      "bg-error-border text-white hover:bg-error-text focus:ring-error-border",
  };

  // Size styles
  const sizeStyles = {
    sm: "text-sm py-1 px-3",
    md: "text-base py-2 px-4",
    lg: "text-lg py-3 px-6",
  };

  // Width styles
  const widthStyles = fullWidth ? "w-full" : "";

  // Disabled and loading styles
  const stateStyles =
    props.disabled || loading
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer";

  // Combined styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${stateStyles} ${className}`;

  return (
    <button
      className={combinedStyles}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}

      {icon && iconPosition === "left" && !loading && (
        <span className="mr-2">{icon}</span>
      )}

      {children}

      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </button>
  );
};

export default Button;
