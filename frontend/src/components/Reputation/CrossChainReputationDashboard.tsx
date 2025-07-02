import React, { useState, useEffect } from 'react';
import { SUPPORTED_CHAINS, getChainName, getChainIcon } from '../../services/lifiService';
import './CrossChainReputationDashboard.css';

interface ChainReputationData {
  chainId: number;
  chainName: string;
  chainIcon: string;
  score: number;
  activities: number;
  lastActivity: Date | null;
}

interface CrossChainReputationProps {
  userAddress: string;
}

export const CrossChainReputationDashboard: React.FC<CrossChainReputationProps> = ({ userAddress }) => {
  const [reputationData, setReputationData] = useState<ChainReputationData[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [activeChains, setActiveChains] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCrossChainReputation();
  }, [userAddress]);

  const loadCrossChainReputation = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call your smart contract or API
      // For demo purposes, we'll use mock data based on localStorage
      const storedReputation = localStorage.getItem('crossChainReputation');
      const activities = storedReputation ? JSON.parse(storedReputation) : [];

      // Process activities by chain
      const chainData: { [chainId: number]: ChainReputationData } = {};
      
      SUPPORTED_CHAINS.forEach(chain => {
        chainData[chain.id] = {
          chainId: chain.id,
          chainName: chain.name,
          chainIcon: chain.icon,
          score: 0,
          activities: 0,
          lastActivity: null
        };
      });

      // Add some mock data for demo
      const mockActivities = [
        { sourceChain: 1, destinationChain: 42161, amount: '10000000', timestamp: Date.now() - 2 * 60 * 60 * 1000 },
        { sourceChain: 42161, destinationChain: 10, amount: '5000000', timestamp: Date.now() - 5 * 60 * 60 * 1000 },
        { sourceChain: 10, destinationChain: 59144, amount: '15000000', timestamp: Date.now() - 24 * 60 * 60 * 1000 },
      ];

      [...activities, ...mockActivities].forEach((activity: any) => {
        const sourceChain = activity.sourceChain;
        const destChain = activity.destinationChain;
        const amount = parseFloat(activity.amount) / 1e6; // Convert from USDC decimals
        const timestamp = new Date(activity.timestamp);

        // Add reputation to both source and destination chains
        if (chainData[sourceChain]) {
          chainData[sourceChain].score += Math.floor(amount * 10); // 10 points per USDC
          chainData[sourceChain].activities += 1;
          if (!chainData[sourceChain].lastActivity || timestamp > chainData[sourceChain].lastActivity!) {
            chainData[sourceChain].lastActivity = timestamp;
          }
        }

        if (chainData[destChain] && destChain !== sourceChain) {
          chainData[destChain].score += Math.floor(amount * 10);
          chainData[destChain].activities += 1;
          if (!chainData[destChain].lastActivity || timestamp > chainData[destChain].lastActivity!) {
            chainData[destChain].lastActivity = timestamp;
          }
        }
      });

      const reputationArray = Object.values(chainData).sort((a, b) => b.score - a.score);
      const total = reputationArray.reduce((sum, chain) => sum + chain.score, 0);
      const active = reputationArray.filter(chain => chain.score > 0).length;

      setReputationData(reputationArray);
      setTotalScore(total);
      setActiveChains(active);
    } catch (error) {
      console.error('Failed to load cross-chain reputation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="cross-chain-loading">
        <div className="loading-spinner"></div>
        <p>Loading cross-chain reputation...</p>
      </div>
    );
  }

  return (
    <div className="cross-chain-reputation">
      <h3>🌐 Cross-Chain Reputation</h3>
      
      <div className="cross-chain-overview">
        <div className="overview-stat">
          <div className="stat-value">{totalScore.toLocaleString()}</div>
          <div className="stat-label">Total Cross-Chain Score</div>
        </div>
        <div className="overview-stat">
          <div className="stat-value">{activeChains}</div>
          <div className="stat-label">Active Chains</div>
        </div>
        <div className="overview-stat">
          <div className="stat-value">{reputationData.reduce((sum, chain) => sum + chain.activities, 0)}</div>
          <div className="stat-label">Total Activities</div>
        </div>
      </div>

      <div className="chain-reputation-grid">
        {reputationData.map((chain) => (
          <div 
            key={chain.chainId} 
            className={`chain-card ${chain.score > 0 ? 'active' : 'inactive'}`}
          >
            <div className="chain-header">
              <span className="chain-icon">{chain.chainIcon}</span>
              <div className="chain-info">
                <div className="chain-name">{chain.chainName}</div>
                <div className="chain-score">{chain.score.toLocaleString()} points</div>
              </div>
            </div>
            
            <div className="chain-stats">
              <div className="chain-stat">
                <span className="stat-label">Activities</span>
                <span className="stat-value">{chain.activities}</span>
              </div>
              {chain.lastActivity && (
                <div className="chain-stat">
                  <span className="stat-label">Last Activity</span>
                  <span className="stat-value">
                    {chain.lastActivity.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {chain.score === 0 && (
              <div className="chain-inactive-message">
                No activity on this chain yet
              </div>
            )}
          </div>
        ))}
      </div>

      {activeChains >= 3 && (
        <div className="cross-chain-achievement">
          <div className="achievement-icon">🏆</div>
          <div className="achievement-content">
            <div className="achievement-title">Multi-Chain Master!</div>
            <div className="achievement-description">
              You're active on {activeChains} chains. Keep exploring the cross-chain ecosystem!
            </div>
          </div>
        </div>
      )}

      <div className="cross-chain-benefits">
        <h4>🎁 Cross-Chain Benefits</h4>
        <div className="benefits-list">
          {activeChains >= 3 && (
            <div className="benefit-item unlocked">
              <span className="benefit-icon">✅</span>
              <span>Multi-Chain Master Badge</span>
            </div>
          )}
          {totalScore >= 1000 && (
            <div className="benefit-item unlocked">
              <span className="benefit-icon">✅</span>
              <span>High Volume Trader Status</span>
            </div>
          )}
          {reputationData.reduce((sum, chain) => sum + chain.activities, 0) >= 10 && (
            <div className="benefit-item unlocked">
              <span className="benefit-icon">✅</span>
              <span>Bridge Expert Recognition</span>
            </div>
          )}
          
          {/* Locked benefits */}
          {activeChains < 5 && (
            <div className="benefit-item locked">
              <span className="benefit-icon">🔒</span>
              <span>Cross-Chain Pioneer (5 chains required)</span>
            </div>
          )}
          {totalScore < 5000 && (
            <div className="benefit-item locked">
              <span className="benefit-icon">🔒</span>
              <span>Whale Status (5,000 points required)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
