import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { web3SocialService, Web3SpeakerProfile } from '../../services/web3SocialService';
import contractService from '../../services/contractService';
import { useWallet } from '../../contexts/WalletContext';
import { formatEther, parseEther } from 'ethers';
import './Web3SpeakerCard.css';

interface Web3SpeakerCardProps {
  address: string;
  eventId?: string;
  showActions?: boolean;
  onTip?: (address: string) => void;
  onBounty?: (address: string) => void;
  layout?: 'card' | 'list' | 'compact';
}

export const Web3SpeakerCard: React.FC<Web3SpeakerCardProps> = ({
  address,
  eventId,
  showActions = true,
  onTip,
  onBounty,
  layout = 'card'
}) => {
  const [profile, setProfile] = useState<Web3SpeakerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onChainStats, setOnChainStats] = useState({
    totalTipsReceived: '0',
    totalBountiesCreated: 0,
    reputationScore: 0
  });
  
  const { isConnected, isCorrectNetwork } = useWallet();

  useEffect(() => {
    loadProfile();
  }, [address]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Load Web3 social profile
      const web3Profile = await web3SocialService.getWeb3SpeakerProfile(address);
      
      // Load on-chain stats if available
      if (isConnected && isCorrectNetwork) {
        try {
          // Get tips received (this would need to be implemented in contract service)
          // const tipsReceived = await contractService.getTipsReceivedByAddress(address);
          // const bountiesCreated = await contractService.getBountiesCreatedByAddress(address);
          
          // For now, simulate with random data based on Farcaster profile
          const baseScore = web3Profile.farcaster ? 
            web3SocialService.calculateReputationScore(web3Profile) : 
            Math.floor(Math.random() * 100) + 50;
            
          const simulatedStats = {
            totalTipsReceived: (Math.random() * 50).toFixed(2),
            totalBountiesCreated: Math.floor(Math.random() * 10),
            reputationScore: baseScore
          };
          
          setOnChainStats(simulatedStats);
          web3Profile.onChainStats = {
            ...web3Profile.onChainStats,
            ...simulatedStats
          };
        } catch (error) {
          console.warn('Failed to load on-chain stats:', error);
        }
      }
      
      setProfile(web3Profile);
    } catch (error) {
      console.error('Failed to load speaker profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`speaker-card speaker-card--${layout} speaker-card--loading`}>
        <div className="speaker-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-line--title"></div>
            <div className="skeleton-line skeleton-line--subtitle"></div>
            <div className="skeleton-line skeleton-line--bio"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`speaker-card speaker-card--${layout} speaker-card--error`}>
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <p>Failed to load speaker profile</p>
        </div>
      </div>
    );
  }

  const displayName = web3SocialService.getDisplayName(profile);
  const profilePicture = web3SocialService.getProfilePicture(profile);
  const bio = web3SocialService.getBio(profile);

  return (
    <div className={`speaker-card speaker-card--${layout}`}>
      {/* Profile Header */}
      <div className="speaker-header">
        <div className="speaker-avatar">
          <img src={profilePicture} alt={displayName} />
          {profile.socialMetrics.verifiedIdentity && (
            <div className="verification-badge" title="Verified Web3 Identity">
              ✓
            </div>
          )}
        </div>
        
        <div className="speaker-identity">
          <h3 className="speaker-name">{displayName}</h3>
          
          {/* Social Platform Indicators */}
          <div className="social-indicators">
            {profile.farcaster && (
              <a 
                href={`https://warpcast.com/${profile.farcaster.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link social-link--farcaster"
                title={`@${profile.farcaster.username} on Farcaster`}
              >
                <span className="social-icon">🟣</span>
                <span>{profile.farcaster.followerCount.toLocaleString()}</span>
                {profile.farcaster.powerBadge && (
                  <span className="power-badge" title="Power Badge">⚡</span>
                )}
              </a>
            )}
            
            {profile.lens && (
              <a 
                href={`https://lenster.xyz/u/${profile.lens.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link social-link--lens"
                title={`@${profile.lens.handle} on Lens`}
              >
                <span className="social-icon">🌿</span>
                <span>{profile.lens.stats.followers.toLocaleString()}</span>
              </a>
            )}
            
            {profile.ensName && (
              <div className="social-link social-link--ens" title="ENS Name">
                <span className="ens-icon">🏷️</span>
                <span>{profile.ensName}</span>
              </div>
            )}

            {/* Verified Accounts from Farcaster */}
            {profile.farcaster?.verifiedAccounts?.map((account, index) => (
              <a
                key={index}
                href={account.platform === 'x' ? `https://twitter.com/${account.username}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`social-link social-link--${account.platform}`}
                title={`@${account.username} on ${account.platform}`}
              >
                <span className="social-icon">
                  {account.platform === 'x' ? '𝕏' : '🔗'}
                </span>
                <span>@{account.username}</span>
              </a>
            ))}
          </div>
          
          <p className="speaker-bio">{bio}</p>
        </div>
      </div>

      {/* On-Chain Stats */}
      {layout !== 'compact' && (
        <div className="speaker-stats">
          <div className="stat-item">
            <span className="stat-value">${onChainStats.totalTipsReceived}</span>
            <span className="stat-label">Tips Received</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{onChainStats.totalBountiesCreated}</span>
            <span className="stat-label">Bounties Created</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{onChainStats.reputationScore}</span>
            <span className="stat-label">Reputation</span>
          </div>
        </div>
      )}

      {/* Cross-Platform Actions */}
      {showActions && (
        <div className="speaker-actions">
          <div className="primary-actions">
            <button
              className={`btn btn-primary ${!isConnected || !isCorrectNetwork ? 'btn-disabled' : ''}`}
              onClick={() => onTip?.(address)}
              disabled={!isConnected || !isCorrectNetwork}
              title={
                !isConnected
                  ? 'Connect wallet to tip'
                  : !isCorrectNetwork
                  ? 'Switch to Mantle Sepolia to tip'
                  : `Tip ${displayName}`
              }
            >
              💰 Tip
            </button>
            
            <button
              className={`btn btn-secondary ${!isConnected || !isCorrectNetwork ? 'btn-disabled' : ''}`}
              onClick={() => onBounty?.(address)}
              disabled={!isConnected || !isCorrectNetwork}
              title={`Create bounty for ${displayName}`}
            >
              🎯 Bounty
            </button>
          </div>
          
          <div className="navigation-actions">
            <Link 
              to={`/talent/${address}`} 
              className="btn btn-outline btn-sm"
              title="View full profile"
            >
              👤 Profile
            </Link>
            
            {eventId && (
              <Link 
                to={`/bounties?speaker=${address}&event=${eventId}`}
                className="btn btn-outline btn-sm"
                title="View bounties"
              >
                📋 Bounties
              </Link>
            )}
            
            <Link 
              to={`/infonomy?focus=${address}`}
              className="btn btn-outline btn-sm"
              title="Knowledge impact"
            >
              🧠 Impact
            </Link>
          </div>
        </div>
      )}

      {/* Quick Social Actions */}
      {layout === 'card' && profile.socialMetrics.verifiedIdentity && (
        <div className="social-actions">
          {profile.farcaster && (
            <a 
              href={`https://warpcast.com/${profile.farcaster.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-action"
            >
              Follow on Farcaster
            </a>
          )}
          
          {profile.lens && (
            <a 
              href={`https://lenster.xyz/u/${profile.lens.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-action"
            >
              Follow on Lens
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default Web3SpeakerCard;
