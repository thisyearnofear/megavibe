import React from 'react';
import '../../styles/design-system.css';

export const SkeletonCard: React.FC = () => (
  <div className="skeleton-card card">
    <div className="skeleton-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
      <div className="skeleton-circle loading-skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      <div className="skeleton-text-block" style={{ flex: 1 }}>
        <div className="skeleton-text skeleton-text-lg loading-skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
        <div className="skeleton-text skeleton-text-sm loading-skeleton" style={{ height: 12, width: '40%' }} />
      </div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton-text loading-skeleton" style={{ height: 12, width: '90%', marginBottom: 6 }} />
      <div className="skeleton-text loading-skeleton" style={{ height: 12, width: '80%', marginBottom: 6 }} />
      <div className="skeleton-text skeleton-text-sm loading-skeleton" style={{ height: 12, width: '60%' }} />
    </div>
  </div>
);
