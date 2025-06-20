import React from 'react';
import './SkeletonCard.css';

interface SkeletonCardProps {
  variant?: 'default' | 'speaker' | 'venue' | 'tip' | 'bounty';
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  const renderDefault = () => (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-text-group">
          <div className="skeleton-text skeleton-title"></div>
          <div className="skeleton-text skeleton-subtitle"></div>
        </div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-text skeleton-line"></div>
        <div className="skeleton-text skeleton-line short"></div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-button"></div>
        <div className="skeleton-button secondary"></div>
      </div>
    </div>
  );

  const renderSpeaker = () => (
    <div className={`skeleton-card speaker-skeleton ${className}`}>
      <div className="skeleton-speaker-header">
        <div className="skeleton-avatar large"></div>
        <div className="skeleton-badge"></div>
      </div>
      <div className="skeleton-speaker-info">
        <div className="skeleton-text skeleton-name"></div>
        <div className="skeleton-text skeleton-bio"></div>
        <div className="skeleton-text skeleton-bio short"></div>
      </div>
      <div className="skeleton-speaker-actions">
        <div className="skeleton-button primary"></div>
        <div className="skeleton-button secondary"></div>
      </div>
    </div>
  );

  const renderVenue = () => (
    <div className={`skeleton-card venue-skeleton ${className}`}>
      <div className="skeleton-venue-header">
        <div className="skeleton-text skeleton-venue-name"></div>
        <div className="skeleton-badge live"></div>
      </div>
      <div className="skeleton-venue-info">
        <div className="skeleton-text skeleton-address"></div>
        <div className="skeleton-text skeleton-event"></div>
        <div className="skeleton-text skeleton-time short"></div>
      </div>
    </div>
  );

  const renderTip = () => (
    <div className={`skeleton-card tip-skeleton ${className}`}>
      <div className="skeleton-tip-header">
        <div className="skeleton-avatar small"></div>
        <div className="skeleton-text-group">
          <div className="skeleton-text skeleton-tipper"></div>
          <div className="skeleton-text skeleton-amount"></div>
        </div>
        <div className="skeleton-timestamp"></div>
      </div>
      <div className="skeleton-tip-message">
        <div className="skeleton-text skeleton-line"></div>
        <div className="skeleton-text skeleton-line short"></div>
      </div>
    </div>
  );

  const renderBounty = () => (
    <div className={`skeleton-card bounty-skeleton ${className}`}>
      <div className="skeleton-bounty-header">
        <div className="skeleton-text skeleton-bounty-title"></div>
        <div className="skeleton-reward"></div>
      </div>
      <div className="skeleton-bounty-info">
        <div className="skeleton-text skeleton-line"></div>
        <div className="skeleton-text skeleton-line"></div>
        <div className="skeleton-text skeleton-line short"></div>
      </div>
      <div className="skeleton-bounty-footer">
        <div className="skeleton-deadline"></div>
        <div className="skeleton-button claim"></div>
      </div>
    </div>
  );

  switch (variant) {
    case 'speaker':
      return renderSpeaker();
    case 'venue':
      return renderVenue();
    case 'tip':
      return renderTip();
    case 'bounty':
      return renderBounty();
    default:
      return renderDefault();
  }
};

// Grid of skeleton cards for loading states
interface SkeletonGridProps {
  count?: number;
  variant?: SkeletonCardProps['variant'];
  className?: string;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  count = 3,
  variant = 'default',
  className = ''
}) => {
  return (
    <div className={`skeleton-grid ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </div>
  );
};

// Inline skeleton for text loading
export const SkeletonText: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = '100%', height = '1em', className = '' }) => (
  <div
    className={`skeleton-text-inline ${className}`}
    style={{ width, height }}
  />
);