import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const buttonClassName = `
    btn
    btn-${variant}
    btn-${size}
    ${fullWidth ? 'btn-full-width' : ''}
    ${loading ? 'btn-loading' : ''}
    ${className}
  `.trim();

  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className="btn-spinner" aria-hidden="true">
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
          </span>
          <span className="btn-text">
            {loadingText || children}
          </span>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <span className="btn-icon btn-icon-left" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="btn-text">{children}</span>
        {icon && iconPosition === 'right' && (
          <span className="btn-icon btn-icon-right" aria-hidden="true">
            {icon}
          </span>
        )}
      </>
    );
  };

  return (
    <button
      className={buttonClassName}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
};