// Design System Card Component
// Unified card component that consolidates all card patterns

"use client";

import React from "react";
import {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
} from "./types";

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  clickable = false,
  padding = "md",
  variant = "default",
  className = "",
  testId,
  onClick,
  ...props
}) => {
  const baseClasses = [
    "card-base",
    hoverable && "card-hoverable",
    clickable && "card-clickable",
    onClick && "card-clickable",
    `card-padding-${padding}`,
    variant !== "default" && `card-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick && !props.role) {
      onClick(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      // Create a synthetic mouse event for keyboard activation
      const syntheticEvent = new MouseEvent('click', { bubbles: true }) as any;
      onClick(syntheticEvent);
    }
  };

  return (
    <div
      className={baseClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = "",
  testId,
  children,
}) => (
  <div className={`card-header ${className}`} data-testid={testId}>
    <div className="card-header-content">
      <h3 className="card-title">{title}</h3>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      {children}
    </div>
    {action && <div className="card-header-action">{action}</div>}
  </div>
);

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
  testId,
}) => (
  <div className={`card-content ${className}`} data-testid={testId}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = "",
  testId,
}) => (
  <div className={`card-footer ${className}`} data-testid={testId}>
    {children}
  </div>
);

export default Card;
