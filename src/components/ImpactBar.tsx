"use client";

import React from "react";
import { useImpact } from "@/contexts/ImpactContext";
import AnimatedNumber from "./animations/AnimatedNumber";
import styles from "./ImpactBar.module.css";

export default function ImpactBar() {
  const { totalTips, totalBounties, impactMessage } = useImpact();

  return (
    <div className={styles.impactBar}>
      {impactMessage && <div className={styles.message}>{impactMessage}</div>}
      <div className={styles.stats}>
        <span>Tips: <AnimatedNumber value={totalTips} /></span>
        <span>Bounties: <AnimatedNumber value={totalBounties} /></span>
      </div>
    </div>
  );
}
