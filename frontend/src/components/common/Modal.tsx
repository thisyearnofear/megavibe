import React, { ReactNode, useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  title, 
  onClose, 
  children, 
  footer, 
  isOpen, 
  size = 'medium',
  className = ''
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content modal-${size} ${className}`} 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && (
          <footer className="modal-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default Modal;
