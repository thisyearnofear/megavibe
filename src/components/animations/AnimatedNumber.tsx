"use client";

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
}

const AnimatedNumber = ({ value }: AnimatedNumberProps) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ 
      scale: [1, 1.2, 1],
      transition: { duration: 0.5 }
    });
  }, [value, controls]);

  return (
    <motion.span animate={controls}>
      {value.toLocaleString()}
    </motion.span>
  );
};

export default AnimatedNumber;
