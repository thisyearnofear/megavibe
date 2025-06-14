import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import '../../styles/AnalyticsDashboard.css';

interface VenueAnalytics {
  venueId: string;
  venueName: string;
  totalPerformances: number;
  totalTips: number;
  totalShares: number;
  totalReactions: number;
  topTopics: Array<{
    name: string;
    tipAmount: number;
  }>;
  engagementHeatMap: Array<{
    time: string;
    engagement: number;
  }>;
  sentiment: {
    averageScore: number;
  };
}

interface SentimentData {
  performanceId: string;
  title: string;
  sentimentScore: string;
  totalReactions: number;
  positive: number;
  neutral: number;
  negative: number;
  totalTips: number;
}

interface AnalyticsDashboardProps {
  venueId: string;
  isOrganizer?: boolean;
  onClose?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  venueId,
  isOrganizer = false,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'engagement' | 'topics'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      setError(null);
      const [analyticsResponse, sentimentResponse] = await Promise.all([
        api.get('/live-influence/venue-analytics', {
          params: { venueId, timeframe: 'live' }
        }),
        api.get('/live-influence/sentiment-analytics', {
          params: { venueId, timeframe: 'live' }
        })
      ]);

      setAnalytics(analyticsResponse.data.analyticsData);
      setSentimentData(sentimentResponse.data.sentimentData || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAnalytics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadAnalytics]);

  const getSentimentColor = (score: number): string => {
    if (score > 0.3) return '#4CAF50'; // Green for positive
    if (score < -0.3) return '#F44336'; // Red for negative
    return '#FF9800'; // Orange for neutral
  };

  const getSentimentLabel = (score: number): string => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="analytics-dashboard error">
        <div className="error-message">
          <h3>Unable to load analytics</h3>
          <p>{error}</p>
          <button onClick={loadAnalytics} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>{analytics.venueName} Analytics</h2>
          <div className="header-controls">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
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
            className={`tab-button ${activeTab === 'sentiment' ? 'active' : ''}`}
            onClick={() => setActiveTab('sentiment')}
          >
            Sentiment
          </button>
          <button
            className={`tab-button ${activeTab === 'engagement' ? 'active' : ''}`}
            onClick={() => setActiveTab('engagement')}
          >
            Engagement
          </button>
          <button
            className={`tab-button ${activeTab === 'topics' ? 'active' : ''}`}
            onClick={() => setActiveTab('topics')}
          >
            Topics
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{analytics.totalPerformances}</div>
                <div className="metric-label">Total Performances</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">${analytics.totalTips.toFixed(2)}</div>
                <div className="metric-label">Total Tips</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{analytics.totalShares}</div>
                <div className="metric-label">Social Shares</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{analytics.totalReactions}</div>
                <div className="metric-label">Total Reactions</div>
              </div>
            </div>

            <div className="overview-charts">
              <div className="chart-container">
                <h3>Engagement Heat Map</h3>
                <div className="heatmap">
                  {analytics.engagementHeatMap.map((point, index) => (
                    <div key={index} className="heatmap-point">
                      <div className="time-label">{point.time}</div>
                      <div
                        className="engagement-bar"
                        style={{
                          height: `${Math.min((point.engagement / Math.max(...analytics.engagementHeatMap.map(p => p.engagement))) * 100, 100)}%`
                        }}
                      ></div>
                      <div className="engagement-value">{point.engagement}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sentiment-overview">
                <h3>Overall Sentiment</h3>
                <div className="sentiment-score">
                  <div
                    className="sentiment-indicator"
                    style={{ backgroundColor: getSentimentColor(analytics.sentiment.averageScore) }}
                  >
                    {getSentimentLabel(analytics.sentiment.averageScore)}
                  </div>
                  <div className="sentiment-value">
                    {(analytics.sentiment.averageScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sentiment' && (
          <div className="sentiment-tab">
            <div className="sentiment-list">
              {sentimentData.map((performance) => (
                <div key={performance.performanceId} className="sentiment-item">
                  <div className="performance-info">
                    <h4>{performance.title}</h4>
                    <div className="sentiment-details">
                      <div
                        className="sentiment-badge"
                        style={{ backgroundColor: getSentimentColor(parseFloat(performance.sentimentScore)) }}
                      >
                        {getSentimentLabel(parseFloat(performance.sentimentScore))}
                      </div>
                      <span className="sentiment-score">
                        {(parseFloat(performance.sentimentScore) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="reaction-breakdown">
                    <div className="reaction-item positive">
                      <span className="reaction-icon">👍</span>
                      <span className="reaction-count">{performance.positive}</span>
                    </div>
                    <div className="reaction-item neutral">
                      <span className="reaction-icon">😐</span>
                      <span className="reaction-count">{performance.neutral}</span>
                    </div>
                    <div className="reaction-item negative">
                      <span className="reaction-icon">👎</span>
                      <span className="reaction-count">{performance.negative}</span>
                    </div>
                  </div>
                  <div className="performance-stats">
                    <span className="tip-amount">${performance.totalTips.toFixed(2)} tips</span>
                    <span className="total-reactions">{performance.totalReactions} reactions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="engagement-tab">
            <div className="engagement-chart">
              <h3>Engagement Over Time</h3>
              <div className="engagement-timeline">
                {analytics.engagementHeatMap.map((point, index) => (
                  <div key={index} className="timeline-point">
                    <div className="timeline-time">{point.time}</div>
                    <div className="timeline-bar-container">
                      <div
                        className="timeline-bar"
                        style={{
                          width: `${(point.engagement / Math.max(...analytics.engagementHeatMap.map(p => p.engagement))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="timeline-value">{point.engagement}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="engagement-insights">
              <h3>Engagement Insights</h3>
              <div className="insight-cards">
                <div className="insight-card">
                  <div className="insight-title">Peak Engagement</div>
                  <div className="insight-value">
                    {analytics.engagementHeatMap.reduce((max, point) => 
                      point.engagement > max.engagement ? point : max
                    ).time}
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-title">Average Tips per Performance</div>
                  <div className="insight-value">
                    ${(analytics.totalTips / analytics.totalPerformances).toFixed(2)}
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-title">Shares per Performance</div>
                  <div className="insight-value">
                    {(analytics.totalShares / analytics.totalPerformances).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="topics-tab">
            <h3>Popular Topics</h3>
            <div className="topics-list">
              {analytics.topTopics.map((topic, index) => (
                <div key={index} className="topic-item">
                  <div className="topic-rank">#{index + 1}</div>
                  <div className="topic-info">
                    <div className="topic-name">{topic.name}</div>
                    <div className="topic-amount">${topic.tipAmount.toFixed(2)} in tips</div>
                  </div>
                  <div className="topic-bar">
                    <div
                      className="topic-bar-fill"
                      style={{
                        width: `${(topic.tipAmount / Math.max(...analytics.topTopics.map(t => t.tipAmount))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {analytics.topTopics.length === 0 && (
              <div className="empty-state">
                <p>No topic requests yet. Encourage your audience to request topics with tips!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isOrganizer && (
        <div className="organizer-actions">
          <button className="action-button primary">
            Export Analytics
          </button>
          <button className="action-button secondary">
            Share Dashboard
          </button>
        </div>
      )}
    </div>
  );
};