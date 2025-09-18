// Design System Button Component
// Unified button component that consolidates all button patterns

"use client";

import React from "react";
import { ButtonProps } from "./types";
import { useHapticFeedback, useReducedMotion } from "./hooks";

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  success = false,
  hapticFeedback = true,
  disabled,
  className = "",
  onClick,
  testId,
  ...props
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const prefersReducedMotion = useReducedMotion();

  const baseClasses = [
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

    // Haptic feedback for mobile devices
    if (hapticFeedback && !prefersReducedMotion) {
      triggerHaptic(50);
    }

    onClick?.(e);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <LoadingSpinner size="sm" />
          Loading...
        </>
      );
    }

    if (success) {
      return (
        <>
          <SuccessIcon />
          Success!
        </>
      );
    }

    return (
      <>
        {leftIcon && <span className="btn-icon btn-icon-left">{leftIcon}</span>}
        {children}
        {rightIcon && (
          <span className="btn-icon btn-icon-right">{rightIcon}</span>
        )}
      </>
    );
  };

  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      onClick={handleClick}
      data-testid={testId}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

// Icon Button variant for square buttons with just icons
export interface IconButtonProps
  extends Omit<ButtonProps, "leftIcon" | "rightIcon" | "children"> {
  icon: React.ReactNode;
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
    "btn-icon-only",
    `btn-${variant}`,
    size !== "md" && `btn-${size}`,
    (disabled || isLoading) && "btn-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={baseClasses} disabled={disabled || isLoading} {...props}>
      {isLoading ? <LoadingSpinner size="sm" /> : icon}
    </button>
  );
};

// Loading Spinner Component (internal)
const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => <div className={`loading-spinner loading-spinner-${size}`} />;

// Success Icon Component (internal)
const SuccessIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default Button;
