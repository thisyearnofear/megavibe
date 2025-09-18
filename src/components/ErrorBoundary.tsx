'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} reset={this.handleReset} />;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🚨 Something went wrong</h2>
            <p>An unexpected error occurred. Please try refreshing the page.</p>
            
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>{this.state.error?.message}</pre>
              {process.env.NODE_ENV === 'development' && (
                <pre>{this.state.error?.stack}</pre>
              )}
            </details>
            
            <button 
              onClick={this.handleReset}
              className="error-boundary-button"
            >
              Try Again
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="error-boundary-button"
            >
              Refresh Page
            </button>
          </div>
          
          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 2rem;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              margin: 1rem;
            }
            
            .error-boundary-content {
              text-align: center;
              max-width: 500px;
            }
            
            .error-boundary-content h2 {
              color: #dc3545;
              margin-bottom: 1rem;
            }
            
            .error-boundary-content p {
              color: #6c757d;
              margin-bottom: 1.5rem;
            }
            
            .error-details {
              text-align: left;
              margin: 1rem 0;
              padding: 1rem;
              background: #f1f3f4;
              border-radius: 4px;
            }
            
            .error-details pre {
              font-size: 0.875rem;
              color: #495057;
              white-space: pre-wrap;
              word-break: break-word;
            }
            
            .error-boundary-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              margin: 0 0.5rem;
              font-size: 0.875rem;
            }
            
            .error-boundary-button:hover {
              background: #0056b3;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;