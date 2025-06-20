import React, { useState, useEffect } from 'react';
import { web3SocialService } from '../../services/web3SocialService';

export const FarcasterTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testAddresses = [
    '0xd7029bdea1c17493893aafe29aad69ef892b8ff2', // dwr.eth
    '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
  ];

  const runTests = async () => {
    setLoading(true);
    const results = [];

    for (const address of testAddresses) {
      try {
        console.log(`Testing Farcaster profile for ${address}...`);
        const profile = await web3SocialService.getFarcasterProfile(address);
        
        results.push({
          address,
          success: !!profile,
          profile,
          error: null
        });
      } catch (error) {
        results.push({
          address,
          success: false,
          profile: null,
          error: error.message
        });
      }
    }

    // Test search functionality
    try {
      console.log('Testing Farcaster search...');
      const searchResults = await web3SocialService.searchFarcasterUsers('vitalik', 3);
      results.push({
        address: 'search:vitalik',
        success: searchResults.length > 0,
        profile: searchResults,
        error: null
      });
    } catch (error) {
      results.push({
        address: 'search:vitalik',
        success: false,
        profile: null,
        error: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Farcaster Integration Test</h2>
      <p>API Key: {process.env.VITE_NEYNAR_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
      
      <button 
        onClick={runTests} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          backgroundColor: '#8A63D2',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div>
        {testResults.map((result, index) => (
          <div 
            key={index} 
            style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              border: `2px solid ${result.success ? '#10b981' : '#ef4444'}`,
              borderRadius: '8px',
              backgroundColor: result.success ? '#f0fdf4' : '#fef2f2'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>
              {result.success ? '✅' : '❌'} {result.address}
            </h3>
            
            {result.error && (
              <p style={{ color: '#ef4444', margin: '5px 0' }}>
                <strong>Error:</strong> {result.error}
              </p>
            )}
            
            {result.profile && (
              <div style={{ fontSize: '12px' }}>
                {Array.isArray(result.profile) ? (
                  <div>
                    <strong>Search Results ({result.profile.length}):</strong>
                    {result.profile.map((user, i) => (
                      <div key={i} style={{ marginLeft: '10px', marginTop: '5px' }}>
                        • {user.displayName} (@{user.username}) - {user.followerCount} followers
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <strong>Profile Found:</strong><br/>
                    • Display Name: {result.profile.displayName}<br/>
                    • Username: @{result.profile.username}<br/>
                    • FID: {result.profile.fid}<br/>
                    • Followers: {result.profile.followerCount.toLocaleString()}<br/>
                    • Bio: {result.profile.bio}<br/>
                    • Power Badge: {result.profile.powerBadge ? '⚡ Yes' : 'No'}<br/>
                    • Verifications: {result.profile.verifications.length}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarcasterTest;
