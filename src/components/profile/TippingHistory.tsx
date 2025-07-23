"use client";

import React from 'react';
import styles from './TippingHistory.module.css';

const TippingHistory = () => {
  // Mock data for now
  const tips = [
    { performer: 'Alice', amount: '$5', date: '2025-07-20' },
    { performer: 'Bob', amount: '$10', date: '2025-07-19' },
    { performer: 'Charlie', amount: '$2', date: '2025-07-18' },
  ];

  return (
    <div className={styles.historyContainer}>
      <h3 className={styles.title}>Recent Tips</h3>
      <ul className={styles.list}>
        {tips.map((tip, index) => (
          <li key={index} className={styles.listItem}>
            <span>Tipped {tip.performer}</span>
            <span className={styles.amount}>{tip.amount}</span>
            <span className={styles.date}>{tip.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TippingHistory;
