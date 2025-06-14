import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import '../../styles/OrganizerTools.css';

interface OrganizerData {
  totalPerformances: number;
  totalTips: number;
  totalShares: number;
  totalReactions: number;
  topTopics: Array<{
    name: string;
    tipAmount: number;
  }>;
  topChoices: Array<{
    name: string;
    tipAmount: number;
  }>;
  performanceEngagement: Array<{
    performanceId: string;
    title: string;
    totalTips: number;
    totalShares: number;
    sentimentScore: number;
  }>;
  recommendations: {
    nextTopic: string;
    nextChoice: string;
    highEngagementTime: string;
  };
}

interface OrganizerToolsProps {
  venueId?: string;
  eventId?: string;
  onClose?: () => void;
}

export const OrganizerTools: React.FC<OrganizerToolsProps> = ({
  venueId,
  eventId,
  onClose,
}) => {
  const [data, setData] = useState<OrganizerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'performances' | 'insights'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const loadOrganizerData = useCallback(async () => {
    try {
      setError(null);
      const params: any = {};
      if (venueId) params.venueId = venueId;
      if (eventId) params.eventId = eventId;

      const response = await api.get('/live-influence/organiser-tools', { params });
      setData(response.data.organiserData);
    } catch (err) {
      console.error('Error loading organizer data:', err);
      setError('Failed to load organizer tools data');
    } finally {
      setLoading(false);
    }
  }, [venueId, eventId]);

  useEffect(() => {
    loadOrganizerData();
  }, [loadOrganizerData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadOrganizerData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadOrganizerData]);

  const getSentimentColor = (score: number): string => {
    if (score > 0.3) return '#4CAF50';
    if (score < -0.3) return '#F44336';
    return '#FF9800';
  };

  const getSentimentLabel = (score: number): string => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  const getEngagementLevel = (tips: number, shares: number): string => {
    const total = tips + shares;
    if (total > 100) return 'High';
    if (total > 50) return 'Medium';
    return 'Low';
  };

  const exportData = () => {
    if (!data) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      venue: venueId,
      event: eventId,
      ...data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizer-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="organizer-tools loading">
        <div className="loading-spinner"></div>
        <p>Loading organizer tools...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="organizer-tools error">
        <div className="error-message">
          <h3>Unable to load organizer data</h3>
          <p>{error}</p>
          <button onClick={loadOrganizerData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="organizer-tools">
      <div className="tools-header">
        <div className="header-content">
          <h2>🎪 Organizer Dashboard</h2>
          <div className="header-controls">
            <div className="refresh-controls">
              <label className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="refresh-interval"
                disabled={!autoRefresh}
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>
            {onClose && (
              <button className="close-button" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations
          </button>
          <button
            className={`tab-button ${activeTab === 'performances' ? 'active' : ''}`}
            onClick={() => setActiveTab('performances')}
          >
            Performances
          </button>
          <button
            className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </div>
      </div>

      <div className="tools-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🎭</div>
                <div className="metric-value">{data.totalPerformances}</div>
                <div className="metric-label">Total Performances</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">💰</div>
                <div className="metric-value">${data.totalTips.toFixed(2)}</div>
                <div className="metric-label">Total Tips</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📱</div>
                <div className="metric-value">{data.totalShares}</div>
                <div className="metric-label">Social Shares</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-value">{data.totalReactions}</div>
                <div className="metric-label">Audience Reactions</div>
              </div>
            </div>

            <div className="overview-charts">
              <div className="chart-section">
                <h3>🔥 Top Topics</h3>
                <div className="topics-chart">
                  {data.topTopics.slice(0, 5).map((topic, index) => (
                    <div key={index} className="topic-bar">
                      <div className="topic-info">
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-amount">${topic.tipAmount.toFixed(2)}</span>
                      </div>
                      <div className="topic-progress">
                        <div
                          className="topic-fill"
                          style={{
                            width: `${(topic.tipAmount / Math.max(...data.topTopics.map(t => t.tipAmount))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-section">
                <h3>🎯 Popular Choices</h3>
                <div className="choices-chart">
                  {data.topChoices.slice(0, 5).map((choice, index) => (
                    <div key={index} className="choice-bar">
                      <div className="choice-info">
                        <span className="choice-name">{choice.name}</span>
                        <span className="choice-amount">${choice.tipAmount.toFixed(2)}</span>
                      </div>
                      <div className="choice-progress">
                        <div
                          className="choice-fill"
                          style={{
                            width: `${(choice.tipAmount / Math.max(...data.topChoices.map(c => c.tipAmount))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            <div className="recommendations-grid">
              <div className="recommendation-card primary">
                <div className="rec-header">
                  <span className="rec-icon">💬</span>
                  <h4>Next Topic Suggestion</h4>
                </div>
                <div className="rec-content">
                  <div className="rec-value">{data.recommendations.nextTopic}</div>
                  <div className="rec-description">
                    Most requested topic based on audience tips
                  </div>
                </div>
                <div className="rec-action">
                  <button className="implement-button">Implement Now</button>
                </div>
              </div>

              <div className="recommendation-card secondary">
                <div className="rec-header">
                  <span className="rec-icon">🎯</span>
                  <h4>Performance Choice</h4>
                </div>
                <div className="rec-content">
                  <div className="rec-value">{data.recommendations.nextChoice}</div>
                  <div className="rec-description">
                    Highest-tipped performance choice request
                  </div>
                </div>
                <div className="rec-action">
                  <button className="implement-button">Suggest to Performer</button>
                </div>
              </div>

              <div className="recommendation-card tertiary">
                <div className="rec-header">
                  <span className="rec-icon">⏰</span>
                  <h4>Optimal Timing</h4>
                </div>
                <div className="rec-content">
                  <div className="rec-value">{data.recommendations.highEngagementTime}</div>
                  <div className="rec-description">
                    Peak engagement window for maximum impact
                  </div>
                </div>
                <div className="rec-action">
                  <button className="implement-button">Schedule Event</button>
                </div>
              </div>
            </div>

            <div className="optimization-tips">
              <h3>🚀 Event Optimization Tips</h3>
              <div className="tips-grid">
                <div className="tip-card">
                  <div className="tip-icon">📊</div>
                  <div className="tip-content">
                    <h5>Audience Engagement</h5>
                    <p>Current engagement is {getEngagementLevel(data.totalTips, data.totalShares).toLowerCase()}. 
                    Consider interactive elements to boost participation.</p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">💡</div>
                  <div className="tip-content">
                    <h5>Content Strategy</h5>
                    <p>Focus on topics with high tip amounts. Audience is most interested in: {data.topTopics[0]?.name || 'No data yet'}</p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">📱</div>
                  <div className="tip-content">
                    <h5>Social Amplification</h5>
                    <p>Encourage sharing during peak moments. Current share rate: {(data.totalShares / data.totalPerformances).toFixed(1)} per performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performances' && (
          <div className="performances-tab">
            <h3>🎭 Performance Rankings</h3>
            <div className="performances-list">
              {data.performanceEngagement.map((performance, index) => (
                <div key={performance.performanceId} className="performance-item">
                  <div className="performance-rank">#{index + 1}</div>
                  <div className="performance-info">
                    <h4>{performance.title}</h4>
                    <div className="performance-stats">
                      <span className="stat">
                        💰 ${performance.totalTips.toFixed(2)}
                      </span>
                      <span className="stat">
                        📱 {performance.totalShares} shares
                      </span>
                      <span className={`sentiment ${getSentimentLabel(performance.sentimentScore).toLowerCase()}`}>
                        {getSentimentLabel(performance.sentimentScore)}
                      </span>
                    </div>
                  </div>
                  <div className="performance-engagement">
                    <div className={`engagement-level ${getEngagementLevel(performance.totalTips, performance.totalShares).toLowerCase()}`}>
                      {getEngagementLevel(performance.totalTips, performance.totalShares)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-tab">
            <div className="insights-grid">
              <div className="insight-section">
                <h3>📈 Engagement Trends</h3>
                <div className="trend-metrics">
                  <div className="trend-item">
                    <span className="trend-label">Avg Tips per Performance</span>
                    <span className="trend-value">
                      ${(data.totalTips / data.totalPerformances).toFixed(2)}
                    </span>
                  </div>
                  <div className="trend-item">
                    <span className="trend-label">Avg Shares per Performance</span>
                    <span className="trend-value">
                      {(data.totalShares / data.totalPerformances).toFixed(1)}
                    </span>
                  </div>
                  <div className="trend-item">
                    <span className="trend-label">Engagement Rate</span>
                    <span className="trend-value">
                      {((data.totalTips + data.totalShares) / data.totalPerformances).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="insight-section">
                <h3>🎯 Audience Preferences</h3>
                <div className="preferences-list">
                  <div className="preference-item">
                    <span className="pref-label">Most Requested Topic:</span>
                    <span className="pref-value">{data.topTopics[0]?.name || 'No data'}</span>
                  </div>
                  <div className="preference-item">
                    <span className="pref-label">Preferred Performance Style:</span>
                    <span className="pref-value">{data.topChoices[0]?.name || 'No data'}</span>
                  </div>
                  <div className="preference-item">
                    <span className="pref-label">Peak Engagement Time:</span>
                    <span className="pref-value">{data.recommendations.highEngagementTime}</span>
                  </div>
                </div>
              </div>

              <div className="insight-section full-width">
                <h3>💡 Actionable Insights</h3>
                <div className="insights-list">
                  <div className="insight-item">
                    <div className="insight-icon">🔥</div>
                    <div className="insight-text">
                      <strong>Hot Topic Alert:</strong> "{data.topTopics[0]?.name}" is generating significant audience interest 
                      with ${data.topTopics[0]?.tipAmount.toFixed(2)} in tips. Consider featuring this in upcoming performances.
                    </div>
                  </div>
                  <div className="insight-item">
                    <div className="insight-icon">📊</div>
                    <div className="insight-text">
                      <strong>Engagement Opportunity:</strong> Performances with interactive elements are receiving 
                      {((data.totalTips / data.totalPerformances) * 1.5).toFixed(0)}% more tips on average.
                    </div>
                  </div>
                  <div className="insight-item">
                    <div className="insight-icon">🚀</div>
                    <div className="insight-text">
                      <strong>Growth Potential:</strong> Social sharing is driving {((data.totalShares / data.totalTips) * 100).toFixed(0)}% 
                      additional engagement. Encourage performers to create shareable moments.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="tools-footer">
        <div className="footer-actions">
          <button className="action-button secondary" onClick={exportData}>
            📊 Export Data
          </button>
          <button className="action-button primary" onClick={loadOrganizerData}>
            🔄 Refresh Now
          </button>
        </div>
        <div className="update-status">
          <div className={`status-indicator ${autoRefresh ? 'active' : 'inactive'}`}></div>
          <span>
            {autoRefresh ? `Auto-updating every ${refreshInterval}s` : 'Auto-update disabled'}
          </span>
        </div>
      </div>
    </div>
  );
};