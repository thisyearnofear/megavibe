import React from "react";

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg";
  variant?: "default" | "elevated";
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  className = "",
  onClick,
  hoverable = false,
  padding = "md",
  variant = "default",
}) => {
  const baseClasses = [
    "card-base",
    hoverable && "card-hoverable",
    onClick && "card-clickable",
    `card-padding-${padding}`,
    variant === "elevated" && "shadow-lg",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = "",
}) => (
  <div className={`card-header ${className}`}>
    <div>
      <h3 className="card-title">{title}</h3>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
}) => <div className={`card-content ${className}`}>{children}</div>;

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = "",
}) => <div className={`card-footer ${className}`}>{children}</div>;