"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import styles from "./MyContent.module.css";

interface Performance {
  cid: string;
  filename: string;
  filetype: string;
  creator: string;
  timestamp: number;
}

export default function MyContent() {
  const { walletAddress } = useWallet();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      fetch(`/api/performances?creator=${walletAddress}`)
        .then((res) => res.json())
        .then((data) => {
          setPerformances(data.performances);
          setLoading(false);
        });
    }
  }, [walletAddress]);

  if (loading) {
    return <p>Loading your content...</p>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>My Content</h3>
      <div className={styles.grid}>
        {performances.map((p) => (
          <div key={p.cid} className={styles.card}>
            <p>{p.filename}</p>
            <p>{new Date(p.timestamp).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
