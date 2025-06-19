import React from 'react';
import './BountyFilters.css';

interface FilterState {
  priceRange: [number, number];
  status: 'all' | 'active' | 'claimed' | 'expired';
  speakerId: string | null;
  sortBy: 'newest' | 'highest' | 'ending-soon' | 'most-popular';
}

interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  walletAddress?: string;
  currentTalk?: string;
  todayEarnings?: number;
  tipCount?: number;
  reputation?: number;
  isActive?: boolean;
}

interface BountyFiltersProps {
  filters: FilterState;
  speakers: Speaker[];
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export const BountyFilters: React.FC<BountyFiltersProps> = ({
  filters,
  speakers,
  onFilterChange
}) => {
  const handlePriceRangeChange = (value: number, index: 0 | 1) => {
    const newRange: [number, number] = [...filters.priceRange];
    newRange[index] = value;

    // Ensure min <= max
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[1] = newRange[0];
    }
    if (index === 1 && newRange[1] < newRange[0]) {
      newRange[0] = newRange[1];
    }

    onFilterChange({ priceRange: newRange });
  };

  const resetFilters = () => {
    onFilterChange({
      priceRange: [25, 500],
      status: 'active',
      speakerId: null,
      sortBy: 'newest'
    });
  };

  const activeSpeakers = speakers.filter(s => s.isActive);
  const hasActiveFilters = filters.status !== 'active' ||
                          filters.speakerId !== null ||
                          filters.priceRange[0] !== 25 ||
                          filters.priceRange[1] !== 500;

  return (
    <div className="bounty-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button className="reset-filters" onClick={resetFilters}>
            Clear All
          </button>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <h4>💰 Price Range</h4>
        <div className="price-range-inputs">
          <div className="price-input">
            <label>Min</label>
            <input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) => handlePriceRangeChange(Number(e.target.value), 0)}
              min="1"
              max="1000"
              step="25"
            />
          </div>
          <span className="price-separator">-</span>
          <div className="price-input">
            <label>Max</label>
            <input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceRangeChange(Number(e.target.value), 1)}
              min="1"
              max="1000"
              step="25"
            />
          </div>
        </div>

        {/* Price Range Slider */}
        <div className="price-slider">
          <input
            type="range"
            min="25"
            max="500"
            value={filters.priceRange[0]}
            onChange={(e) => handlePriceRangeChange(Number(e.target.value), 0)}
            className="range-input range-min"
          />
          <input
            type="range"
            min="25"
            max="500"
            value={filters.priceRange[1]}
            onChange={(e) => handlePriceRangeChange(Number(e.target.value), 1)}
            className="range-input range-max"
          />
        </div>

        {/* Quick Price Buttons */}
        <div className="quick-prices">
          {[
            { label: 'Under $100', range: [25, 100] },
            { label: '$100-250', range: [100, 250] },
            { label: '$250-500', range: [250, 500] },
            { label: 'All Prices', range: [25, 500] }
          ].map((preset) => (
            <button
              key={preset.label}
              className={`quick-price-btn ${
                filters.priceRange[0] === preset.range[0] &&
                filters.priceRange[1] === preset.range[1] ? 'active' : ''
              }`}
              onClick={() => onFilterChange({ priceRange: preset.range as [number, number] })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="filter-section">
        <h4>📊 Status</h4>
        <div className="status-buttons">
          {(
            [
              { value: 'all', label: 'All', icon: '📋' },
              { value: 'active', label: 'Active', icon: '🎯' },
              { value: 'claimed', label: 'Claimed', icon: '✅' },
              { value: 'expired', label: 'Expired', icon: '⏰' }
            ] as const
          ).map((status) => (
            <button
              key={status.value}
              className={`status-btn ${filters.status === status.value ? 'active' : ''}`}
              onClick={() => onFilterChange({ status: status.value })}
            >
              <span className="status-icon">{status.icon}</span>
              <span className="status-label">{status.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Speaker Filter */}
      <div className="filter-section">
        <h4>🎤 Speaker</h4>
        <select
          value={filters.speakerId || ''}
          onChange={(e) => onFilterChange({ speakerId: e.target.value || null })}
          className="speaker-select"
        >
          <option value="">All Speakers</option>
          {activeSpeakers.map((speaker) => (
            <option key={speaker.id} value={speaker.name}>
              {speaker.name} {speaker.currentTalk ? `(${speaker.currentTalk})` : ''}
            </option>
          ))}
        </select>

        {/* Featured Speakers */}
        {activeSpeakers.length > 0 && (
          <div className="featured-speakers">
            <span className="featured-label">Active Now:</span>
            <div className="speaker-chips">
              {activeSpeakers.slice(0, 3).map((speaker) => (
                <button
                  key={speaker.id}
                  className={`speaker-chip ${filters.speakerId === speaker.name ? 'active' : ''}`}
                  onClick={() => onFilterChange({
                    speakerId: filters.speakerId === speaker.name ? null : speaker.name
                  })}
                >
                  <span className="speaker-avatar">
                    {speaker.avatar ? (
                      <img src={speaker.avatar} alt={speaker.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {speaker.name.charAt(0)}
                      </div>
                    )}
                  </span>
                  <span className="speaker-name">{speaker.name.split(' ')[0]}</span>
                  {speaker.isActive && <span className="live-dot"></span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      <div className="filter-summary">
        <h4>🔍 Active Filters</h4>
        <div className="summary-tags">
          {filters.priceRange[0] !== 25 || filters.priceRange[1] !== 500 ? (
            <span className="summary-tag">
              ${filters.priceRange[0]}-${filters.priceRange[1]}
              <button onClick={() => onFilterChange({ priceRange: [25, 500] })}>×</button>
            </span>
          ) : null}

          {filters.status !== 'active' && (
            <span className="summary-tag">
              {filters.status}
              <button onClick={() => onFilterChange({ status: 'active' })}>×</button>
            </span>
          )}

          {filters.speakerId && (
            <span className="summary-tag">
              {filters.speakerId}
              <button onClick={() => onFilterChange({ speakerId: null })}>×</button>
            </span>
          )}
        </div>
      </div>

      {/* Filter Tips */}
      <div className="filter-tips">
        <h4>💡 Pro Tips</h4>
        <ul className="tips-list">
          <li>Higher rewards typically get completed faster</li>
          <li>Active speakers respond within 2-4 hours</li>
          <li>Most bounties complete within 24-48 hours</li>
          <li>Clear, specific requests get better results</li>
        </ul>
      </div>
    </div>
  );
};
