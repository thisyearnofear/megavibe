// FilCDN Dashboard - Monitor migration and storage status

import React, { useState, useEffect } from 'react';
import { createDecentralizedApiService, ApiStats } from '../../services/decentralizedApiService';
import './FilCDNDashboard.css';

const decentralizedApiService = createDecentralizedApiService();

const FilCDNDashboard: React.FC = () => {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const apiStats = await decentralizedApiService.getStats();
      setStats(apiStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setError(null);
      await decentralizedApiService.initialize();
      alert('✅ FilCDN connection successful!');
    } catch (err) {
      alert('❌ FilCDN connection failed. Please check your configuration.');
      setError(err instanceof Error ? err.message : 'Connection test failed');
    }
  };

  if (isLoading) {
    return (
      <div className="filcdn-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading FilCDN Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="filcdn-dashboard">
      <div className="dashboard-header">
        <h2>🌐 FilCDN Dashboard</h2>
        <p>Monitor decentralized storage migration and status</p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Service Status */}
      <div className="status-grid">
        <div className="status-card">
          <h3>🔗 Service Status</h3>
          <div className="status-items">
            <div className={`status-item ${stats?.isReady ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span>FilCDN Service Ready: {stats?.isReady ? 'Yes' : 'No'}</span>
            </div>
            <div className={`status-item ${stats?.filcdn?.isReady ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span>Synapse Ready: {stats?.filcdn?.isReady ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <button onClick={handleTestConnection} className="test-connection-btn">
            🔍 Test Connection
          </button>
        </div>

        {/* Storage Stats */}
        {stats?.events && (
          <div className="status-card">
            <h3>📦 Storage Statistics</h3>
            <div className="storage-stats">
              <div className="stat-item">
                <span className="stat-label">Total Events:</span>
                <span className="stat-value">{stats.events.totalEvents}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cached Events:</span>
                <span className="stat-value">{stats.events.cachedEvents}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Speakers:</span>
                <span className="stat-value">{stats.speakers.totalSpeakers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Tips:</span>
                <span className="stat-value">{stats.tips.totalTips}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>🛠️ Quick Actions</h3>
        <div className="action-buttons">
          <button onClick={loadDashboardData} className="refresh-btn">
            🔄 Refresh Status
          </button>
          <button 
            onClick={() => window.open('https://calibration.filscan.io/', '_blank')}
            className="explorer-btn"
          >
            🔍 View on Filscan
          </button>
          <button 
            onClick={() => alert('This feature is not yet implemented.')}
            className="toggle-btn"
          >
            {stats?.isReady ? '⏸️ Disable FilCDN' : '▶️ Enable FilCDN'}
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="configuration-section">
        <h3>⚙️ Configuration</h3>
        <div className="config-grid">
          <div className="config-item">
            <label>FilCDN Service Ready:</label>
            <span className={stats?.isReady ? 'enabled' : 'disabled'}>
              {stats?.isReady ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="config-item">
            <label>Fallback to Backend:</label>
            <span className="enabled">Yes</span>
          </div>
          <div className="config-item">
            <label>Cache Timeout:</label>
            <span>5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilCDNDashboard;