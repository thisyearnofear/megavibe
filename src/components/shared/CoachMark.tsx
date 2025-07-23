"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CoachMark.module.css';

interface CoachMarkProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  targetRef: React.RefObject<HTMLElement>;
}

const CoachMark = ({
  message,
  isVisible,
  onDismiss,
  targetRef,
}: CoachMarkProps) => {
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useLayoutEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height + 10, // Position below the target
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, [targetRef, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.coachMark}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{ top: position.top, left: position.left }}
        >
          <p>{message}</p>
          <button onClick={onDismiss}>Got it!</button>
          <div className={styles.arrow}></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoachMark;
