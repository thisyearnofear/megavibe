import React from 'react';
import '../../styles/design-system.css';

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = false, className = '' }) => {
  return (
    <div className={`card${hoverable ? ' card-hover' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
};
