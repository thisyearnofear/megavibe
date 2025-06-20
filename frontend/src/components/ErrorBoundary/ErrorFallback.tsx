import React from 'react';
import './ErrorFallback.css';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const isDevelopment = process.env.DEV;

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="error-fallback">
      <div className="error-container">
        <div className="error-icon">
          <span>⚠️</span>
        </div>
        
        <div className="error-content">
          <h1 className="error-title">Something went wrong</h1>
          <p className="error-description">
            We encountered an unexpected error. This has been logged and we'll look into it.
          </p>
          
          {isDevelopment && (
            <details className="error-details">
              <summary>Error Details (Development)</summary>
              <pre className="error-stack">
                <code>{error.message}</code>
                {error.stack && (
                  <>
                    <br />
                    <code>{error.stack}</code>
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div className="error-actions">
            <button 
              className="btn btn-primary" 
              onClick={resetError}
            >
              Try Again
            </button>
            <button 
              className="btn btn-outline" 
              onClick={handleReload}
            >
              Reload Page
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={handleGoHome}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};