import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  fullScreen = false,
  className = '',
}) => {
  const spinnerClassName = `
    loading-spinner
    loading-spinner-${size}
    loading-spinner-${variant}
    ${fullScreen ? 'loading-spinner-fullscreen' : ''}
    ${className}
  `.trim();

  const renderSpinner = () => (
    <div className="spinner-container">
      <svg className="spinner" viewBox="0 0 24 24">
        <circle
          className="spinner-track"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
        />
        <circle
          className="spinner-circle"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
        />
      </svg>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={spinnerClassName} role="status" aria-label="Loading">
        {renderSpinner()}
      </div>
    );
  }

  return (
    <div className={spinnerClassName} role="status" aria-label="Loading">
      {renderSpinner()}
    </div>
  );
};

// Inline spinner for buttons and small spaces
export const InlineSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
}> = ({ size = 'sm', variant = 'primary', className = '' }) => {
  return (
    <svg
      className={`inline-spinner inline-spinner-${size} inline-spinner-${variant} ${className}`}
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="spinner-circle"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        strokeWidth="2"
      />
    </svg>
  );
};