import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import '../../styles/PerformanceSteering.css';

interface SteeringData {
  performanceId: string;
  title: string;
  totalTips: number;
  topChoice: {
    name: string;
    amount: number;
  };
  topTopic: {
    name: string;
    amount: number;
  };
  choices: Record<string, number>;
  topics: Record<string, number>;
}

interface PerformanceSteeringProps {
  performanceId: string;
  isPerformer?: boolean;
  onClose?: () => void;
}

export const PerformanceSteering: React.FC<PerformanceSteeringProps> = ({
  performanceId,
  isPerformer = false,
  onClose,
}) => {
  const [steeringData, setSteeringData] = useState<SteeringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeView, setActiveView] = useState<'choices' | 'topics' | 'combined'>('combined');

  const loadSteeringData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(`/live-influence/performance-steering/${performanceId}`);
      setSteeringData(response.data.steeringData);
    } catch (err) {
      console.error('Error loading steering data:', err);
      setError('Failed to load performance steering data');
    } finally {
      setLoading(false);
    }
  }, [performanceId]);

  useEffect(() => {
    loadSteeringData();
  }, [loadSteeringData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSteeringData();
    }, 10000); // Refresh every 10 seconds for real-time steering

    return () => clearInterval(interval);
  }, [autoRefresh, loadSteeringData]);

  const getChoiceEntries = () => {
    if (!steeringData) return [];
    return Object.entries(steeringData.choices)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getTopicEntries = () => {
    if (!steeringData) return [];
    return Object.entries(steeringData.topics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getMaxAmount = () => {
    if (!steeringData) return 1;
    const maxChoice = Math.max(...Object.values(steeringData.choices));
    const maxTopic = Math.max(...Object.values(steeringData.topics));
    return Math.max(maxChoice, maxTopic, 1);
  };

  const getInfluenceLevel = (amount: number): string => {
    const percentage = (amount / steeringData!.totalTips) * 100;
    if (percentage > 30) return 'high';
    if (percentage > 15) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
      <div className="performance-steering loading">
        <div className="loading-spinner"></div>
        <p>Loading performance steering...</p>
      </div>
    );
  }

  if (error || !steeringData) {
    return (
      <div className="performance-steering error">
        <div className="error-message">
          <h3>Unable to load steering data</h3>
          <p>{error}</p>
          <button onClick={loadSteeringData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const choiceEntries = getChoiceEntries();
  const topicEntries = getTopicEntries();
  const maxAmount = getMaxAmount();

  return (
    <div className="performance-steering">
      <div className="steering-header">
        <div className="header-content">
          <h2>
            {isPerformer ? '🎭 Audience Steering' : '📊 Performance Influence'}
          </h2>
          <div className="header-controls">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Live updates
            </label>
            {onClose && (
              <button className="close-button" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="performance-info">
          <h3>{steeringData.title}</h3>
          <div className="total-tips">
            <span className="tips-amount">${steeringData.totalTips.toFixed(2)}</span>
            <span className="tips-label">Total Tips Received</span>
          </div>
        </div>

        <div className="view-selector">
          <button
            className={`view-button ${activeView === 'combined' ? 'active' : ''}`}
            onClick={() => setActiveView('combined')}
          >
            Combined
          </button>
          <button
            className={`view-button ${activeView === 'choices' ? 'active' : ''}`}
            onClick={() => setActiveView('choices')}
          >
            Choices
          </button>
          <button
            className={`view-button ${activeView === 'topics' ? 'active' : ''}`}
            onClick={() => setActiveView('topics')}
          >
            Topics
          </button>
        </div>
      </div>

      <div className="steering-content">
        {activeView === 'combined' && (
          <div className="combined-view">
            <div className="top-influences">
              <div className="influence-card primary">
                <div className="influence-header">
                  <h4>🎯 Top Choice Request</h4>
                  <div className={`influence-level ${getInfluenceLevel(steeringData.topChoice.amount)}`}>
                    {getInfluenceLevel(steeringData.topChoice.amount)} influence
                  </div>
                </div>
                <div className="influence-content">
                  <div className="influence-name">{steeringData.topChoice.name}</div>
                  <div className="influence-amount">${steeringData.topChoice.amount.toFixed(2)}</div>
                </div>
                <div className="influence-bar">
                  <div
                    className="influence-fill choice"
                    style={{
                      width: `${(steeringData.topChoice.amount / maxAmount) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="influence-card secondary">
                <div className="influence-header">
                  <h4>💬 Top Topic Request</h4>
                  <div className={`influence-level ${getInfluenceLevel(steeringData.topTopic.amount)}`}>
                    {getInfluenceLevel(steeringData.topTopic.amount)} influence
                  </div>
                </div>
                <div className="influence-content">
                  <div className="influence-name">{steeringData.topTopic.name}</div>
                  <div className="influence-amount">${steeringData.topTopic.amount.toFixed(2)}</div>
                </div>
                <div className="influence-bar">
                  <div
                    className="influence-fill topic"
                    style={{
                      width: `${(steeringData.topTopic.amount / maxAmount) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {isPerformer && (
              <div className="performer-guidance">
                <h4>🎪 Audience Wants:</h4>
                <div className="guidance-items">
                  {steeringData.topChoice.amount > 0 && (
                    <div className="guidance-item">
                      <span className="guidance-icon">🎯</span>
                      <span className="guidance-text">
                        Consider: <strong>{steeringData.topChoice.name}</strong>
                      </span>
                      <span className="guidance-support">
                        ${steeringData.topChoice.amount.toFixed(2)} support
                      </span>
                    </div>
                  )}
                  {steeringData.topTopic.amount > 0 && (
                    <div className="guidance-item">
                      <span className="guidance-icon">💬</span>
                      <span className="guidance-text">
                        Discuss: <strong>{steeringData.topTopic.name}</strong>
                      </span>
                      <span className="guidance-support">
                        ${steeringData.topTopic.amount.toFixed(2)} support
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'choices' && (
          <div className="choices-view">
            <h4>🎯 Performance Choices</h4>
            <div className="steering-list">
              {choiceEntries.length > 0 ? (
                choiceEntries.map(([choice, amount], index) => (
                  <div key={choice} className="steering-item">
                    <div className="item-rank">#{index + 1}</div>
                    <div className="item-content">
                      <div className="item-name">{choice}</div>
                      <div className="item-amount">${amount.toFixed(2)}</div>
                    </div>
                    <div className="item-bar">
                      <div
                        className="item-fill choice"
                        style={{
                          width: `${(amount / maxAmount) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className={`item-influence ${getInfluenceLevel(amount)}`}>
                      {getInfluenceLevel(amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No performance choices requested yet.</p>
                  <p>Encourage your audience to tip with specific requests!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'topics' && (
          <div className="topics-view">
            <h4>💬 Topic Requests</h4>
            <div className="steering-list">
              {topicEntries.length > 0 ? (
                topicEntries.map(([topic, amount], index) => (
                  <div key={topic} className="steering-item">
                    <div className="item-rank">#{index + 1}</div>
                    <div className="item-content">
                      <div className="item-name">{topic}</div>
                      <div className="item-amount">${amount.toFixed(2)}</div>
                    </div>
                    <div className="item-bar">
                      <div
                        className="item-fill topic"
                        style={{
                          width: `${(amount / maxAmount) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className={`item-influence ${getInfluenceLevel(amount)}`}>
                      {getInfluenceLevel(amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No topics requested yet.</p>
                  <p>Encourage your audience to tip with topic suggestions!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isPerformer && (
        <div className="performer-actions">
          <div className="action-hint">
            💡 Tip: Acknowledge audience requests to encourage more engagement!
          </div>
        </div>
      )}

      <div className="steering-footer">
        <div className="update-indicator">
          <div className={`status-dot ${autoRefresh ? 'active' : 'inactive'}`}></div>
          <span>
            {autoRefresh ? 'Live updates active' : 'Updates paused'}
          </span>
        </div>
      </div>
    </div>
  );
};