// Shared Button Component - DRY principle implementation using utility classes
"use client";

import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "tip" | "bounty";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  success?: boolean;
  hapticFeedback?: boolean;
}

function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  disabled,
  success = false,
  hapticFeedback = true,
  onClick,
  ...props
}: ButtonProps) {
  const buttonClasses = [
    "btn-base",
    `btn-${variant}`,
    size !== "md" && `btn-${size}`,
    fullWidth && "w-full",
    (disabled || isLoading) && "btn-disabled",
    success && "btn-success",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    // Haptic feedback for mobile
    if (hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    onClick?.(e);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="loading-spinner loading-spinner-sm" />
          Loading...
        </>
      );
    }

    if (success) {
      return (
        <>
          <span>✨</span>
          Success!
        </>
      );
    }

    return (
      <>
        {leftIcon && <span>{leftIcon}</span>}
        {children}
        {rightIcon && <span>{rightIcon}</span>}
      </>
    );
  };

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
}

// Export named version as well for consistency
export { Button as ButtonComponent };

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  "aria-label": string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = "ghost",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseClasses = [
    "btn-base",
    `btn-${variant}`,
    size !== "md" && `btn-${size}`,
    (disabled || isLoading) && "btn-disabled",
    "aspect-square p-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={baseClasses} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <div className="loading-spinner loading-spinner-sm" />
      ) : (
        icon
      )}
    </button>
  );
};

export default Button;