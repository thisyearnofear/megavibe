import React from 'react';
import '../../styles/design-system.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
