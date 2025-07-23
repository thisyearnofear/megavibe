"use client";

import React from 'react';
import styles from './BountySummary.module.css';

const BountySummary = () => {
  // Mock data for now
  const bounties = [
    { title: 'Custom song for my cat', status: 'Active' },
    { title: 'Birthday shoutout', status: 'Completed' },
  ];

  return (
    <div className={styles.summaryContainer}>
      <h3 className={styles.title}>My Bounties</h3>
      <ul className={styles.list}>
        {bounties.map((bounty, index) => (
          <li key={index} className={styles.listItem}>
            <span>{bounty.title}</span>
            <span className={`${styles.status} ${styles[bounty.status.toLowerCase()]}`}>
              {bounty.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BountySummary;
