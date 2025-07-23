"use client";

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import styles from './AnimatedTipping.module.css';

interface AnimatedTippingProps {
  onComplete: () => void;
}

const AnimatedTipping = ({ onComplete }: AnimatedTippingProps) => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controls.start({
        y: [0, -50, -100],
        x: [0, 20, -20, 0],
        opacity: [1, 1, 0],
        transition: { duration: 1.5, ease: 'easeInOut' },
      });
      onComplete();
    };

    sequence();
  }, [controls, onComplete]);

  return (
    <motion.div className={styles.coin} animate={controls}>
      💸
    </motion.div>
  );
};

export default AnimatedTipping;
