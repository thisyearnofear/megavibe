import React from 'react';

interface ModalErrorBannerProps {
  error: string;
  onDismiss?: () => void;
}

const ModalErrorBanner: React.FC<ModalErrorBannerProps> = ({ error, onDismiss }) => (
  <div className="error-banner" role="alert">
    <span className="error-icon">⚠️</span>
    <span className="error-text">{error}</span>
    {onDismiss && (
      <button className="error-dismiss" onClick={onDismiss} aria-label="Dismiss error">
        ×
      </button>
    )}
  </div>
);

export default ModalErrorBanner;
