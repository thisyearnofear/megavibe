import React from 'react';
import './Card.css';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'interactive';
  size?: 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  padding = 'md',
  children,
  className = '',
  onClick,
  header,
  footer,
  loading = false,
}) => {
  const cardClassName = `
    card
    card-${variant}
    card-${size}
    card-padding-${padding}
    ${onClick ? 'card-clickable' : ''}
    ${loading ? 'card-loading' : ''}
    ${className}
  `.trim();

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={cardClassName}
      onClick={onClick}
      disabled={loading}
      {...(onClick && { role: 'button', tabIndex: 0 })}
    >
      {loading && (
        <div className="card-loading-overlay">
          <div className="card-spinner">
            <svg className="spinner" viewBox="0 0 24 24">
              <circle
                className="spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      )}

      {header && (
        <div className="card-header">
          {header}
        </div>
      )}

      <div className="card-content">
        {children}
      </div>

      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </CardComponent>
  );
};