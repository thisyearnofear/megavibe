import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import './ScrapingDashboard.css';

interface ScrapingStatus {
  isRunning: boolean;
  currentJob: {
    id: string;
    status: string;
    progress: number;
    startTime: string;
    results: {
      webEvents: any[];
      socialEvents: any[];
      errors: any[];
      saved?: number;
    };
  } | null;
  stats: {
    totalRuns: number;
    lastRun: string | null;
    eventsFound: number;
    eventsCreated: number;
    errors: number;
  };
  services: {
    firecrawl: {
      requests: number;
      successes: number;
      failures: number;
      successRate: number;
    };
    masa: {
      requests: number;
      successes: number;
      failures: number;
      successRate: number;
    };
  };
}

interface ScrapingConfig {
  sources: {
    WEB3_EVENTS: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    SOCIAL_SOURCES: Array<{
      name: string;
      platform: string;
      queries: string[];
    }>;
  };
  environment: {
    scrapingEnabled: boolean;
    schedule: string;
    maxConcurrent: string;
    timeout: string;
  };
}

export const ScrapingDashboard: React.FC = () => {
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [config, setConfig] = useState<ScrapingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch status and config
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, configRes] = await Promise.all([
        api.get('/api/scraping/status'),
        api.get('/api/scraping/config')
      ]);
      
      setStatus(statusRes.data);
      setConfig(configRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scraping data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh status when job is running
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      if (status?.isRunning) {
        fetchData();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [status?.isRunning]);

  // Trigger scraping
  const handleTriggerScraping = async () => {
    try {
      setActionLoading('trigger');
      await api.post('/api/scraping/trigger');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger scraping');
    } finally {
      setActionLoading(null);
    }
  };

  // Stop scraping
  const handleStopScraping = async () => {
    try {
      setActionLoading('stop');
      await api.post('/api/scraping/stop');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to stop scraping');
    } finally {
      setActionLoading(null);
    }
  };

  // Test services
  const handleTestService = async (service: 'firecrawl' | 'masa') => {
    try {
      setActionLoading(`test-${service}`);
      
      if (service === 'firecrawl') {
        await api.post('/api/scraping/test/firecrawl', {
          url: 'https://goweb3.fyi/'
        });
      } else {
        await api.post('/api/scraping/test/masa', {
          query: 'web3 conference 2024',
          platform: 'twitter'
        });
      }
      
      alert(`${service} test completed successfully!`);
    } catch (err: any) {
      alert(`${service} test failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="scraping-dashboard">
        <LoadingSpinner text="Loading scraping dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="scraping-dashboard">
        <Card>
          <div className="error-state">
            <h3>❌ Error Loading Dashboard</h3>
            <p>{error}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="scraping-dashboard">
      <div className="dashboard-header">
        <h1>🕷️ Event Scraping Dashboard</h1>
        <p>Monitor and control automated event data collection</p>
      </div>

      {/* Current Status */}
      <Card className="status-card">
        <div className="card-header">
          <h2>📊 Current Status</h2>
          <div className={`status-indicator ${status?.isRunning ? 'running' : 'idle'}`}>
            {status?.isRunning ? '🟢 Running' : '⚪ Idle'}
          </div>
        </div>
        
        <div className="status-content">
          {status?.currentJob ? (
            <div className="current-job">
              <div className="job-info">
                <h3>Job: {status.currentJob.id}</h3>
                <p>Status: {status.currentJob.status}</p>
                <p>Started: {new Date(status.currentJob.startTime).toLocaleString()}</p>
              </div>
              
              {status.currentJob.status === 'running' && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${status.currentJob.progress}%` }}
                  />
                  <span className="progress-text">{status.currentJob.progress}%</span>
                </div>
              )}
              
              <div className="job-results">
                <div className="result-item">
                  <span>Web Events:</span>
                  <span>{status.currentJob.results.webEvents.length}</span>
                </div>
                <div className="result-item">
                  <span>Social Events:</span>
                  <span>{status.currentJob.results.socialEvents.length}</span>
                </div>
                <div className="result-item">
                  <span>Errors:</span>
                  <span>{status.currentJob.results.errors.length}</span>
                </div>
                {status.currentJob.results.saved !== undefined && (
                  <div className="result-item">
                    <span>Saved:</span>
                    <span>{status.currentJob.results.saved}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>No active scraping job</p>
          )}
        </div>
      </Card>

      {/* Controls */}
      <Card className="controls-card">
        <div className="card-header">
          <h2>🎮 Controls</h2>
        </div>
        
        <div className="controls-content">
          <div className="control-group">
            <h3>Scraping Actions</h3>
            <div className="button-group">
              <Button
                variant="primary"
                onClick={handleTriggerScraping}
                disabled={status?.isRunning || actionLoading === 'trigger'}
                loading={actionLoading === 'trigger'}
              >
                {status?.isRunning ? 'Scraping Running...' : 'Start Scraping'}
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleStopScraping}
                disabled={!status?.isRunning || actionLoading === 'stop'}
                loading={actionLoading === 'stop'}
              >
                Stop Scraping
              </Button>
            </div>
          </div>
          
          <div className="control-group">
            <h3>Service Tests</h3>
            <div className="button-group">
              <Button
                variant="outline"
                onClick={() => handleTestService('firecrawl')}
                disabled={!!actionLoading}
                loading={actionLoading === 'test-firecrawl'}
              >
                Test Firecrawl
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleTestService('masa')}
                disabled={!!actionLoading}
                loading={actionLoading === 'test-masa'}
              >
                Test Masa
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Card className="stats-card">
        <div className="card-header">
          <h2>📈 Statistics</h2>
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{status?.stats.totalRuns || 0}</div>
            <div className="stat-label">Total Runs</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-value">{status?.stats.eventsFound || 0}</div>
            <div className="stat-label">Events Found</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-value">{status?.stats.eventsCreated || 0}</div>
            <div className="stat-label">Events Created</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-value">{status?.stats.errors || 0}</div>
            <div className="stat-label">Errors</div>
          </div>
        </div>
        
        {status?.stats.lastRun && (
          <p className="last-run">
            Last run: {new Date(status.stats.lastRun).toLocaleString()}
          </p>
        )}
      </Card>

      {/* Service Performance */}
      <Card className="performance-card">
        <div className="card-header">
          <h2>⚡ Service Performance</h2>
        </div>
        
        <div className="service-stats">
          <div className="service-stat">
            <h3>🔥 Firecrawl</h3>
            <div className="service-metrics">
              <div className="metric">
                <span>Requests:</span>
                <span>{status?.services.firecrawl.requests || 0}</span>
              </div>
              <div className="metric">
                <span>Success Rate:</span>
                <span>{(status?.services.firecrawl.successRate || 0).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <span>Failures:</span>
                <span>{status?.services.firecrawl.failures || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="service-stat">
            <h3>🌊 Masa</h3>
            <div className="service-metrics">
              <div className="metric">
                <span>Requests:</span>
                <span>{status?.services.masa.requests || 0}</span>
              </div>
              <div className="metric">
                <span>Success Rate:</span>
                <span>{(status?.services.masa.successRate || 0).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <span>Failures:</span>
                <span>{status?.services.masa.failures || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuration */}
      <Card className="config-card">
        <div className="card-header">
          <h2>⚙️ Configuration</h2>
        </div>
        
        <div className="config-content">
          <div className="config-section">
            <h3>Environment</h3>
            <div className="config-items">
              <div className="config-item">
                <span>Scraping Enabled:</span>
                <span className={config?.environment.scrapingEnabled ? 'enabled' : 'disabled'}>
                  {config?.environment.scrapingEnabled ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="config-item">
                <span>Schedule:</span>
                <span>{config?.environment.schedule || 'Not set'}</span>
              </div>
              <div className="config-item">
                <span>Max Concurrent:</span>
                <span>{config?.environment.maxConcurrent || 'Default'}</span>
              </div>
            </div>
          </div>
          
          <div className="config-section">
            <h3>Sources</h3>
            <div className="sources-list">
              <div className="source-group">
                <h4>Web Sources ({config?.sources.WEB3_EVENTS.length || 0})</h4>
                {config?.sources.WEB3_EVENTS.map((source, index) => (
                  <div key={index} className="source-item">
                    <span className="source-name">{source.name}</span>
                    <span className="source-url">{source.url}</span>
                  </div>
                ))}
              </div>
              
              <div className="source-group">
                <h4>Social Sources ({config?.sources.SOCIAL_SOURCES.length || 0})</h4>
                {config?.sources.SOCIAL_SOURCES.map((source, index) => (
                  <div key={index} className="source-item">
                    <span className="source-name">{source.name}</span>
                    <span className="source-platform">{source.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};