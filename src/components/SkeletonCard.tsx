"use client";

import React from "react";
import styles from "./SkeletonCard.module.css";

export default function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.avatar} />
      <div className={styles.lineShort} />
      <div className={styles.line} />
      <div className={styles.line} />
    </div>
  );
}
