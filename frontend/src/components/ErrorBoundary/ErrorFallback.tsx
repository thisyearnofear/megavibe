import React from 'react';
import { Button } from '../UI/Button';
import '../../styles/design-system.css';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="error-fallback">
    <div className="error-content card">
      <h2 className="heading-2">Something went wrong</h2>
      <p>We encountered an error while loading this page.</p>
      <pre style={{ color: 'var(--error)', margin: 'var(--space-4) 0' }}>{error.message}</pre>
      <div className="error-actions" style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <Button variant="primary" onClick={resetError}>Try Again</Button>
        <Button variant="secondary" onClick={() => window.location.href = '/'}>Go Home</Button>
      </div>
    </div>
  </div>
);
