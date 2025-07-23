"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { contextualNotificationService } from '@/services/contextualNotificationService';
import styles from './ContextualNotification.module.css';

interface NotificationItem {
  id: string;
  message: string;
  performerName: string;
}

const ContextualNotification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = contextualNotificationService.subscribeToContextualNotifications((update) => {
      const newNotification: NotificationItem = {
        id: Date.now().toString(),
        message: update.message,
        performerName: update.performer.name,
      };
      setNotifications((prev) => [...prev, newNotification]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 7000); // Notification visible for 7 seconds
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
            <span className={styles.icon}>📍</span>
            <p className={styles.message}>
              {notification.message}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ContextualNotification;
