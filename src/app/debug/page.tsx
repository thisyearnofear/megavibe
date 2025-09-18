'use client';

import { useState, useEffect } from 'react';
import { detectWalletProviders } from '@/utils/ethereum';

interface HealthStatus {
  status: string;
  timestamp: string;
  environment?: any;
  services?: any;
  contracts?: any;
}

interface FilCDNStatus {
  status: string;
  initialized: boolean;
  error?: string;
  attempts?: number;
  environment?: any;
}

export default function DebugPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [filcdnStatus, setFilcdnStatus] = useState<FilCDNStatus | null>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load health status
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      setHealthStatus(healthData);

      // Load FilCDN status
      const filcdnResponse = await fetch('/api/filcdn');
      const filcdnData = await filcdnResponse.json();
      setFilcdnStatus(filcdnData);

      // Detect wallet providers
      const walletData = detectWalletProviders();
      setWalletInfo(walletData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testFilCDN = async () => {
    try {
      const response = await fetch('/api/filcdn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'getStats',
        }),
      });

      const data = await response.json();
      console.log('FilCDN test result:', data);
      alert(`FilCDN test result: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      console.error('FilCDN test error:', err);
      alert(`FilCDN test error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="debug-page">
        <h1>🔍 Debug Information</h1>
        <p>Loading debug information...</p>
      </div>
    );
  }

  return (
    <div className="debug-page">
      <h1>🔍 Debug Information</h1>
      
      {error && (
        <div className="error-section">
          <h2>❌ Error</h2>
          <pre>{error}</pre>
        </div>
      )}

      <div className="debug-section">
        <h2>🏥 Health Status</h2>
        <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
      </div>

      <div className="debug-section">
        <h2>💾 FilCDN Status</h2>
        <pre>{JSON.stringify(filcdnStatus, null, 2)}</pre>
        <button onClick={testFilCDN} className="test-button">
          Test FilCDN
        </button>
      </div>

      <div className="debug-section">
        <h2>🦊 Wallet Information</h2>
        <pre>{JSON.stringify(walletInfo, null, 2)}</pre>
      </div>

      <div className="debug-section">
        <h2>🌐 Browser Information</h2>
        <pre>{JSON.stringify({
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
          url: typeof window !== 'undefined' ? window.location.href : 'N/A',
          timestamp: new Date().toISOString(),
          windowEthereum: typeof window !== 'undefined' ? {
            available: !!(window as any).ethereum,
            isMetaMask: !!(window as any).ethereum?.isMetaMask,
            chainId: (window as any).ethereum?.chainId,
            selectedAddress: (window as any).ethereum?.selectedAddress,
          } : 'N/A'
        }, null, 2)}</pre>
      </div>

      <div className="debug-section">
        <h2>🔄 Actions</h2>
        <button onClick={loadDebugInfo} className="refresh-button">
          Refresh Debug Info
        </button>
        <button onClick={() => window.location.reload()} className="reload-button">
          Reload Page
        </button>
      </div>

      <style jsx>{`
        .debug-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: monospace;
        }

        .debug-page h1 {
          color: #333;
          margin-bottom: 2rem;
        }

        .debug-section {
          margin-bottom: 2rem;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .debug-section h2 {
          color: #555;
          margin-bottom: 1rem;
        }

        .debug-section pre {
          background: #fff;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .error-section {
          background: #fee;
          border-color: #fcc;
          color: #c33;
        }

        .test-button, .refresh-button, .reload-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin: 0.5rem 0.5rem 0 0;
          font-size: 0.875rem;
        }

        .test-button:hover, .refresh-button:hover, .reload-button:hover {
          background: #0056b3;
        }

        .reload-button {
          background: #dc3545;
        }

        .reload-button:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
}