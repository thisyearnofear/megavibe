"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { performerService } from '@/services/api/performerService';
import styles from './LiveTipNotification.module.css';

interface Notification {
  tipperName: string;
  performerName: string;
  amount: number;
  id: string;
}

const LiveTipNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = performerService.subscribeToTipUpdates((update) => {
      const newNotification: Notification = {
        ...update,
        id: Date.now().toString(), // Unique ID for animation key
      };
      setNotifications((prev) => [...prev, newNotification]);

      // Remove notification after a few seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 5000); // Notification visible for 5 seconds
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.notificationContainer}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className={styles.notificationCard}
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.icon}>💰</span>
            <p className={styles.message}>
              <span className={styles.tipperName}>{notification.tipperName}</span> just tipped{' '}
              <span className={styles.performerName}>{notification.performerName}</span>{' '}
              <span className={styles.amount}>${notification.amount}</span>!
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default LiveTipNotification;
