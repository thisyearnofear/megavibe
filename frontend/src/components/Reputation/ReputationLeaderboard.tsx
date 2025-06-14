import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ReputationProfile } from './ReputationProfile';
import '../../styles/ReputationLeaderboard.css';

interface LeaderboardEntry {
  userId: string;
  overallScore: number;
  reputationLevel: string;
  percentile: number;
  categories: {
    curator: { score: number; level: string };
    supporter: { score: number; level: string };
    attendee: { score: number; level: string };
    influencer: { score: number; level: string };
  };
  crossEventMetrics: {
    uniqueVenues: number;
    uniqueEvents: number;
    totalAttendance: number;
  };
  achievements: Array<{
    name: string;
    rarity: string;
  }>;
  user: {
    username: string;
    avatar?: string;
    email: string;
  };
}

interface ReputationLeaderboardProps {
  category?: string;
  limit?: number;
  onClose?: () => void;
}

export const ReputationLeaderboard: React.FC<ReputationLeaderboardProps> = ({
  category = 'overall',
  limit = 50,
  onClose,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { id: 'overall', label: '🏆 Overall', description: 'Total reputation across all categories' },
    { id: 'curator', label: '🎨 Curator', description: 'Content curation and taste-making' },
    { id: 'supporter', label: '💰 Supporter', description: 'Artist support and tipping' },
    { id: 'attendee', label: '🎪 Attendee', description: 'Event attendance and participation' },
    { id: 'influencer', label: '📱 Influencer', description: 'Social influence and sharing' },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory, currentPage]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/reputation/leaderboard', {
        params: {
          category: selectedCategory,
          limit,
          page: currentPage,
        },
      });

      setLeaderboard(response.data.leaderboard);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'Legend': return '#FFD700';
      case 'Master': return '#C0C0C0';
      case 'Expert': return '#CD7F32';
      case 'Apprentice': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'Legendary': return '#FF6B35';
      case 'Epic': return '#9B59B6';
      case 'Rare': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  const getCategoryScore = (entry: LeaderboardEntry): number => {
    if (selectedCategory === 'overall') return entry.overallScore;
    return entry.categories[selectedCategory as keyof typeof entry.categories]?.score || 0;
  };

  const handleUserClick = (userId: string) => {
    setSelectedUser(userId);
  };

  if (selectedUser) {
    return (
      <ReputationProfile
        userId={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="reputation-leaderboard">
      <div className="leaderboard-header">
        <div className="header-content">
          <h2>🏆 Reputation Leaderboard</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <div className="category-selector">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-button ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              title={cat.description}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="leaderboard-info">
          <p>
            Showing top performers in{' '}
            <strong>{categories.find(c => c.id === selectedCategory)?.label}</strong>
          </p>
        </div>
      </div>

      <div className="leaderboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <h3>Unable to load leaderboard</h3>
            <p>{error}</p>
            <button onClick={loadLeaderboard} className="retry-button">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="leaderboard-list">
              {leaderboard.map((entry, index) => {
                const rank = (currentPage - 1) * limit + index + 1;
                const score = getCategoryScore(entry);
                
                return (
                  <div
                    key={entry.userId}
                    className={`leaderboard-entry ${rank <= 3 ? 'top-three' : ''}`}
                    onClick={() => handleUserClick(entry.userId)}
                  >
                    <div className="rank-section">
                      <div className={`rank-display ${rank <= 3 ? 'medal' : ''}`}>
                        {getRankIcon(rank)}
                      </div>
                    </div>

                    <div className="user-section">
                      <div className="user-info">
                        {entry.user.avatar ? (
                          <img
                            src={entry.user.avatar}
                            alt={entry.user.username}
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {entry.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="user-details">
                          <h4 className="username">{entry.user.username}</h4>
                          <div className="user-stats">
                            <span>{entry.crossEventMetrics.uniqueVenues} venues</span>
                            <span>•</span>
                            <span>{entry.crossEventMetrics.uniqueEvents} events</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="score-section">
                      <div className="score-display">
                        <div className="score-value">{score}</div>
                        <div className="score-label">
                          {selectedCategory === 'overall' ? 'Total' : 'Score'}
                        </div>
                      </div>
                      <div
                        className="level-badge"
                        style={{ backgroundColor: getLevelColor(entry.reputationLevel) }}
                      >
                        {entry.reputationLevel}
                      </div>
                    </div>

                    <div className="achievements-section">
                      <div className="achievements-preview">
                        {entry.achievements.slice(0, 3).map((achievement, idx) => (
                          <div
                            key={idx}
                            className="achievement-badge"
                            style={{ backgroundColor: getRarityColor(achievement.rarity) }}
                            title={achievement.name}
                          >
                            {achievement.rarity.charAt(0)}
                          </div>
                        ))}
                        {entry.achievements.length > 3 && (
                          <div className="achievements-more">
                            +{entry.achievements.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="percentile">
                        Top {100 - entry.percentile}%
                      </div>
                    </div>

                    <div className="entry-arrow">
                      →
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="page-info">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="leaderboard-footer">
        <div className="footer-info">
          <p>
            💡 <strong>Tip:</strong> Click on any user to view their full reputation profile
          </p>
          <p>
            🏆 Rankings update in real-time based on user activity and engagement
          </p>
        </div>
      </div>
    </div>
  );
};