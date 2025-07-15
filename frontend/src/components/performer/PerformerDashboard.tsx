"use client";

import React, { useState, useEffect } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useLocation } from "@/hooks/useLocation";
import QRCodeGenerator from "./QRCodeGenerator";
import styles from "./PerformerDashboard.module.css";

interface PerformanceStats {
  totalTips: number;
  totalRequests: number;
  totalEarnings: number;
  activeAudience: number;
  sessionDuration: number;
  topRequest: string;
}

interface RecentActivity {
  id: string;
  type: "tip" | "request";
  amount: number;
  message?: string;
  timestamp: Date;
  from?: string;
}

type PerformerStatus = "offline" | "live" | "break" | "finished";

export default function PerformerDashboard() {
  const { isConnected, walletAddress, balance } = useWalletConnection();
  const { location, hasPermission } = useLocation();
  const [status, setStatus] = useState<PerformerStatus>("offline");
  const [stats, setStats] = useState<PerformanceStats>({
    totalTips: 0,
    totalRequests: 0,
    totalEarnings: 0,
    activeAudience: 0,
    sessionDuration: 0,
    topRequest: ""
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Mock performer data
  const performerProfile = {
    id: "performer_123",
    name: "Jake Blues",
    type: "Street Musician",
    avatar: "🎸"
  };

  // Simulate real-time updates
  useEffect(() => {
    if (status === "live") {
      const interval = setInterval(() => {
        // Simulate incoming tips and requests
        if (Math.random() > 0.7) {
          const newActivity: RecentActivity = {
            id: Date.now().toString(),
            type: Math.random() > 0.6 ? "tip" : "request",
            amount: Math.floor(Math.random() * 20) + 5,
            message: Math.random() > 0.5 ? "Great performance!" : undefined,
            timestamp: new Date(),
            from: `User${Math.floor(Math.random() * 1000)}`
          };
          
          setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
          setStats(prev => ({
            ...prev,
            totalTips: prev.totalTips + (newActivity.type === "tip" ? 1 : 0),
            totalRequests: prev.totalRequests + (newActivity.type === "request" ? 1 : 0),
            totalEarnings: prev.totalEarnings + newActivity.amount,
            activeAudience: Math.max(1, prev.activeAudience + (Math.random() > 0.5 ? 1 : -1))
          }));
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [status]);

  // Update session duration
  useEffect(() => {
    if (status === "live" && sessionStartTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        setStats(prev => ({ ...prev, sessionDuration: duration }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, sessionStartTime]);

  const handleStatusChange = (newStatus: PerformerStatus) => {
    setStatus(newStatus);
    
    if (newStatus === "live" && !sessionStartTime) {
      setSessionStartTime(new Date());
    } else if (newStatus === "offline") {
      setSessionStartTime(null);
      setStats({
        totalTips: 0,
        totalRequests: 0,
        totalEarnings: 0,
        activeAudience: 0,
        sessionDuration: 0,
        topRequest: ""
      });
      setRecentActivity([]);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: PerformerStatus): string => {
    switch (status) {
      case "live": return "#00ff88";
      case "break": return "#ffc107";
      case "finished": return "#6c757d";
      default: return "#dc3545";
    }
  };

  const getStatusIcon = (status: PerformerStatus): string => {
    switch (status) {
      case "live": return "🔴";
      case "break": return "⏸️";
      case "finished": return "✅";
      default: return "⚪";
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.performerInfo}>
          <div className={styles.avatar}>{performerProfile.avatar}</div>
          <div className={styles.details}>
            <h1 className={styles.name}>{performerProfile.name}</h1>
            <p className={styles.type}>{performerProfile.type}</p>
          </div>
        </div>
        
        <button 
          className={styles.qrButton}
          onClick={() => setShowQRCode(true)}
        >
          📱 QR Code
        </button>
      </div>

      {/* Status Control */}
      <div className={styles.statusControl}>
        <h3>Performance Status</h3>
        <div className={styles.statusButtons}>
          {(["offline", "live", "break", "finished"] as PerformerStatus[]).map((statusOption) => (
            <button
              key={statusOption}
              className={`${styles.statusButton} ${status === statusOption ? styles.active : ""}`}
              onClick={() => handleStatusChange(statusOption)}
              style={{ 
                borderColor: status === statusOption ? getStatusColor(statusOption) : undefined,
                backgroundColor: status === statusOption ? `${getStatusColor(statusOption)}20` : undefined
              }}
            >
              <span className={styles.statusIcon}>{getStatusIcon(statusOption)}</span>
              <span className={styles.statusLabel}>
                {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
              </span>
            </button>
          ))}
        </div>
        
        {status === "live" && (
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span>You are live! Audiences can find and support you.</span>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3>${stats.totalEarnings}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👏</div>
          <div className={styles.statContent}>
            <h3>{stats.totalTips}</h3>
            <p>Tips Received</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <h3>{stats.totalRequests}</h3>
            <p>Requests</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>{stats.activeAudience}</h3>
            <p>Active Audience</p>
          </div>
        </div>
        
        {status === "live" && (
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statContent}>
              <h3>{formatDuration(stats.sessionDuration)}</h3>
              <p>Session Time</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <h3>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <div className={styles.emptyActivity}>
            <p>No recent activity. Start performing to see tips and requests!</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {recentActivity.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.type === "tip" ? "💰" : "🎯"}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityHeader}>
                    <span className={styles.activityType}>
                      {activity.type === "tip" ? "Tip" : "Request"}
                    </span>
                    <span className={styles.activityAmount}>${activity.amount}</span>
                  </div>
                  {activity.message && (
                    <p className={styles.activityMessage}>"{activity.message}"</p>
                  )}
                  <span className={styles.activityTime}>
                    {activity.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location Status */}
      {hasPermission && location && (
        <div className={styles.locationStatus}>
          <h3>📍 Location Status</h3>
          <p>You're visible to nearby audiences</p>
          <div className={styles.locationDetails}>
            <span>Lat: {location.latitude.toFixed(4)}</span>
            <span>Lng: {location.longitude.toFixed(4)}</span>
            <span>Accuracy: {location.accuracy}m</span>
          </div>
        </div>
      )}

      {/* Wallet Status */}
      {isConnected && (
        <div className={styles.walletStatus}>
          <h3>💳 Wallet Status</h3>
          <div className={styles.walletDetails}>
            <p>Balance: {balance.formatted} MNT</p>
            <p>Address: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className={styles.qrModal}>
          <div className={styles.qrModalContent}>
            <div className={styles.qrModalHeader}>
              <h3>Your QR Code</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowQRCode(false)}
              >
                ✕
              </button>
            </div>
            <QRCodeGenerator 
              performerId={performerProfile.id}
              performerName={performerProfile.name}
              size={200}
            />
          </div>
        </div>
      )}
    </div>
  );
}