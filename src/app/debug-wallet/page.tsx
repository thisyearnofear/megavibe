'use client';

import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useEffect, useState } from 'react';

export default function DebugWalletPage() {
  const { walletInfo, connect, disconnect, switchNetwork } = useWalletConnection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Wallet Connection Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Environment Variables</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          WC_PROJECT_ID: {process.env.NEXT_PUBLIC_WC_PROJECT_ID ? 'Set' : 'Not Set'}
          BASE_URL: {process.env.NEXT_PUBLIC_BASE_URL || 'Not Set'}
          ENVIRONMENT: {process.env.NEXT_PUBLIC_ENVIRONMENT || 'Not Set'}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Wallet Info</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(walletInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        <button 
          onClick={() => connect('MetaMask')}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Connect Wallet
        </button>
        
        <button 
          onClick={disconnect}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Disconnect
        </button>

        <button 
          onClick={() => switchNetwork(5003)}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Switch to Mantle Sepolia
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Current URL</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {typeof window !== 'undefined' ? window.location.href : 'Server Side'}
        </pre>
      </div>
    </div>
  );
}