"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import styles from "./MyContributions.module.css";

interface Performance {
  cid: string;
  filename: string;
  filetype: string;
  creator: string;
  timestamp: number;
}

interface Tip {
  id: string;
  amount: number;
  to: string;
  timestamp: number;
}

interface Bounty {
  id: string;
  title: string;
  status: string;
  timestamp: number;
}

type Contribution = Performance | Tip | Bounty;

export default function MyContributions() {
  const { walletAddress } = useWallet();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributions = async () => {
      if (!walletAddress) return;

      setLoading(true);
      try {
        // Fetch uploaded moments (reusing performances API)
        const momentsRes = await fetch(`/api/performances?creator=${walletAddress}`);
        const momentsData = await momentsRes.json();

        const isPerformance = (p: unknown): p is Performance =>
          typeof p === "object" &&
          p !== null &&
          "cid" in p &&
          "filename" in p &&
          "filetype" in p &&
          "creator" in p &&
          "timestamp" in p;

        const moments: Performance[] = Array.isArray(momentsData.performances)
          ? momentsData.performances
              .filter(isPerformance)
              .map((p) => ({ ...p, type: 'moment' }))
          : [];

        // TODO: Fetch tips and bounties from relevant APIs
        // For now, using mock data
        const mockTips: Tip[] = [
          { id: "tip1", amount: 5, to: "Performer A", timestamp: Date.now() - 86400000 * 2 },
          { id: "tip2", amount: 10, to: "Performer B", timestamp: Date.now() - 86400000 * 5 },
        ];

        const mockBounties: Bounty[] = [
          { id: "bounty1", title: "Sing a song", status: "completed", timestamp: Date.now() - 86400000 * 10 },
          { id: "bounty2", title: "Draw a portrait", status: "pending", timestamp: Date.now() - 86400000 * 15 },
        ];

        setContributions([...moments, ...mockTips, ...mockBounties].sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error("Failed to fetch contributions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [walletAddress]);

  if (loading) {
    return <p>Loading your contributions...</p>;
  }

  if (contributions.length === 0) {
    return <p>No contributions found yet.</p>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>My Contributions</h3>
      <div className={styles.grid}>
        {contributions.map((item) => (
          <div key={'id' in item ? item.id : item.cid} className={styles.card}>
            {/* Render based on type */}
            {'filename' in item && (
              <>
                <h4>Uploaded Moment: {item.filename}</h4>
                <p>Type: {item.filetype}</p>
                <p>Date: {new Date(item.timestamp).toLocaleDateString()}</p>
              </>
            )}
            {'amount' in item && (
              <>
                <h4>Tip Sent: {item.amount} ETH</h4>
                <p>To: {item.to}</p>
                <p>Date: {new Date(item.timestamp).toLocaleDateString()}</p>
              </>
            )}
            {'title' in item && (
              <>
                <h4>Bounty: {item.title}</h4>
                <p>Status: {item.status}</p>
                <p>Date: {new Date(item.timestamp).toLocaleDateString()}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
