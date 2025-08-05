"use client";

import React, { useEffect, useState, RefObject } from "react";
import styles from "./CoachMark.module.css";

interface CoachMarkProps {
  message: string;
  targetRef: RefObject<HTMLElement>;
  onDismiss: () => void;
}

export default function CoachMark({ message, targetRef, onDismiss }: CoachMarkProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const el = targetRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({ top: rect.top - 40, left: rect.left + rect.width / 2 });
    }
  }, [targetRef]);

  return (
    <div className={styles.coachMark} style={{ top: coords.top, left: coords.left }}>
      <div className={styles.bubble}>{message}</div>
      <div className={styles.arrow} />
      <button className={styles.dismiss} onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}
