"use client";

import React from 'react';
import styles from './ImpactStats.module.css';
import AnimatedNumber from '@/components/animations/AnimatedNumber';

const ImpactStats = () => {
  // Mock data for now
  const stats = [
    { label: 'Total Tipped', value: 1234, prefix: '$' },
    { label: 'Bounties Created', value: 12 },
    { label: 'Supported Performers', value: 42 },
  ];

  return (
    <div className={styles.statsContainer}>
      {stats.map((stat, index) => (
        <div key={index} className={styles.statCard}>
          <p className={styles.statValue}>
            {stat.prefix}{stat.prefix ? '' : ''}<AnimatedNumber value={stat.value} />
          </p>
          <p className={styles.statLabel}>{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default ImpactStats;