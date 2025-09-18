"use client";

import React, { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLocation } from "@/hooks/useLocation";
import {
  performerService,
  PerformerProfile,
} from "@/services/api/performerService";
import QRScanner from "./QRScanner";
import Button from "@/components/shared/Button";
import { BaseCard } from "@/components/shared/BaseCard";
import { LoadingSpinner } from "@/components/shared/LoadingStates";
import styles from "./QuickDiscovery.module.css";

// Use PerformerProfile from the service
type Performer = PerformerProfile & {
  distance?: string;
  distanceKm?: number;
};

interface QuickDiscoveryProps {
  onPerformerSelect?: (performer: Performer) => void;
  onQuickTip?: (performer: Performer) => void;
  onQuickRequest?: (performer: Performer) => void;
}

export default function QuickDiscovery({
  onPerformerSelect,
  onQuickTip,
  onQuickRequest,
}: QuickDiscoveryProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { location, requestLocation, hasPermission } = useLocation();

  useEffect(() => {
    // Request location permission on mount
    if (hasPermission === null) {
      requestLocation();
    }
  }, [hasPermission, requestLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNearbyPerformers();
    }, 300); // Debounce location changes
    
    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    // Subscribe to real-time performer updates
    const unsubscribe = performerService.subscribeToPerformerUpdates(
      (update) => {
        setPerformers((prev) =>
          prev.map((performer) =>
            performer.id === update.performerId
              ? { ...performer, status: update.status as any }
              : performer
          )
        );
      }
    );

    return unsubscribe;
  }, []);

  const loadNearbyPerformers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (location) {
        // Get performers within 10km radius
        const nearbyPerformers = await performerService.getNearbyPerformers({
          lat: location.latitude,
          lng: location.longitude,
          radius: 10, // 10km radius
          status: "all",
          limit: 50,
        });

        setPerformers(nearbyPerformers);
      } else {
        // If no location, get all performers (fallback)
        const allPerformers = await performerService.getNearbyPerformers({
          lat: 37.7749, // Default to SF
          lng: -122.4194,
          radius: 100, // Large radius to get all
          status: "all",
          limit: 50,
        });

        setPerformers(allPerformers);
      }
    } catch (err) {
      console.error("Failed to load performers:", err);
      setError(
        err instanceof Error ? 
        err.message : 
        "Failed to load nearby performers. Please try again later."
      );
      // Retry automatically in 5 seconds
      setTimeout(() => loadNearbyPerformers(), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePerformerFound = async (performerId: string) => {
    try {
      // First check if performer is in current list
      let performer: Performer | undefined = performers.find(
        (p) => p.id === performerId
      );

      if (!performer) {
        // If not found, fetch from service and convert to Performer type
        const fetchedPerformerProfile = await performerService.getPerformerById(
          performerId
        );
        if (fetchedPerformerProfile) {
          performer = {
            ...fetchedPerformerProfile,
            distance: "N/A", // Default value
            distanceKm: 0, // Default value
          };
        }
      }

      if (performer) {
        onPerformerSelect?.(performer);
      } else {
        setError("Performer not found");
      }
    } catch (err) {
      console.error("Failed to find performer:", err);
      setError("Failed to find performer");
    }
  };

  const handleRefresh = () => {
    loadNearbyPerformers();
  };

  const filteredPerformers = performers.filter(
    (performer) =>
      performer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      performer.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      performer.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      performer.location.address
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const livePerformers = filteredPerformers.filter((p) => p.status === "live");
  const otherPerformers = filteredPerformers.filter((p) => p.status !== "live");

  if (!isMobile) {
    // Return standard desktop experience
    return null;
  }

  return (
    <div className={styles.quickDiscovery}>
      <QuickActions
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPerformerFound={handlePerformerFound}
      />

      {/* Location Status */}
      {hasPermission === false && (
        <div className={styles.locationPrompt}>
          <span className={styles.locationIcon}>📍</span>
          <div className={styles.locationText}>
            <span>Enable location for nearby performers</span>
            <button
              onClick={requestLocation}
              className={styles.enableLocationBtn}
            >
              Enable Location
            </button>
          </div>
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={handleRefresh} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <>
          <PerformerSection
            title={`📍 Performing Now${location ? " (Near You)" : ""}`}
            performers={livePerformers}
            onQuickTip={onQuickTip}
            onQuickRequest={onQuickRequest}
            priority
          />

          {otherPerformers.length > 0 && (
            <PerformerSection
              title="🎭 Nearby Performers"
              performers={otherPerformers}
              onQuickTip={onQuickTip}
              onQuickRequest={onQuickRequest}
            />
          )}

          {filteredPerformers.length === 0 && !loading && (
            <EmptyState searchQuery={searchQuery} onRefresh={handleRefresh} />
          )}
        </>
      )}
    </div>
  );
}

const QuickActions = ({
  searchQuery,
  onSearchChange,
  onPerformerFound,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPerformerFound?: (performerId: string) => void;
}) => {
  const [showScanner, setShowScanner] = useState(false);

  const handleQRScan = () => {
    setShowScanner(true);
  };

  const handleQRDetected = (performerId: string) => {
    setShowScanner(false);
    console.log("QR Code detected:", performerId);
    onPerformerFound?.(performerId);
  };

  const handleScanError = (error: string) => {
    console.error("QR Scan error:", error);
    setShowScanner(false);
  };

  return (
    <>
      <div className={styles.quickActions}>
        <Button
          variant="primary"
          size="lg"
          className={styles.qrButton}
          onClick={handleQRScan}
          leftIcon="📷"
          fullWidth
        >
          <div className={styles.qrText}>
            <span className={styles.qrTitle}>Scan QR Code</span>
            <span className={styles.qrSubtitle}>
              Quick connect to performer
            </span>
          </div>
        </Button>

        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search performer, event, or location"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRDetected}
        onError={handleScanError}
      />
    </>
  );
};

const PerformerSection = ({
  title,
  performers,
  onQuickTip,
  onQuickRequest,
  priority = false,
}: {
  title: string;
  performers: Performer[];
  onQuickTip?: (performer: Performer) => void;
  onQuickRequest?: (performer: Performer) => void;
  priority?: boolean;
}) => {
  if (performers.length === 0) return null;

  return (
    <section className={styles.performerSection}>
      <h2 className={styles.sectionTitle}>
        {title} ({performers.length})
      </h2>
      <div className={styles.performerList}>
        {performers.map((performer) => (
          <PerformerQuickCard
            key={performer.id}
            performer={performer}
            onQuickTip={() => onQuickTip?.(performer)}
            onQuickRequest={() => onQuickRequest?.(performer)}
            priority={priority}
          />
        ))}
      </div>
    </section>
  );
};

const PerformerQuickCard = ({
  performer,
  onQuickTip,
  onQuickRequest,
  priority = false,
}: {
  performer: Performer;
  onQuickTip?: () => void;
  onQuickRequest?: () => void;
  priority?: boolean;
}) => {
  const getStatusIcon = (status: Performer["status"]) => {
    switch (status) {
      case "live":
        return "🔴";
      case "break":
        return "⏸️";
      case "finished":
        return "✅";
      case "offline":
        return "⚪";
      default:
        return "⚪";
    }
  };

  const getStatusText = (status: Performer["status"]) => {
    switch (status) {
      case "live":
        return "LIVE";
      case "break":
        return "Break";
      case "finished":
        return "Finished";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  return (
    <div
      className={`${styles.performerCard} ${
        priority ? styles.priorityCard : ""
      }`}
    >
      <div className={styles.performerInfo}>
        <div className={styles.performerHeader}>
          <div className={styles.performerName}>
            <span className={styles.performerIcon}>
              {performer.avatar || "🎭"}
            </span>
            <span className={styles.name}>{performer.name}</span>
            <span className={styles.status}>
              {getStatusIcon(performer.status)}{" "}
              {getStatusText(performer.status)}
            </span>
          </div>
        </div>

        <div className={styles.performerDetails}>
          <span className={styles.type}>{performer.type}</span>
          <span className={styles.location}>
            📍 {performer.location.venue || performer.location.address}
          </span>
          {performer.distance && (
            <span className={styles.distance}>{performer.distance}</span>
          )}
        </div>

        {performer.description && (
          <p className={styles.description}>{performer.description}</p>
        )}

        {performer.stats && (
          <div className={styles.performerStats}>
            <span className={styles.stat}>
              ⭐ {performer.stats.averageRating.toFixed(1)}
            </span>
            <span className={styles.stat}>
              💰 ${performer.stats.totalEarnings.toFixed(0)}
            </span>
            <span className={styles.stat}>
              🎭 {performer.stats.performanceCount}
            </span>
          </div>
        )}
      </div>

      <div className={styles.quickActions}>
        <Button
          variant="tip"
          size="sm"
          className={styles.tipButton}
          onClick={onQuickTip}
          disabled={
            performer.status === "offline" || !performer.preferences.acceptsTips
          }
          leftIcon="💰"
        >
          TIP
        </Button>
        <Button
          variant="bounty"
          size="sm"
          className={styles.requestButton}
          onClick={onQuickRequest}
          disabled={
            performer.status === "offline" ||
            !performer.preferences.acceptsRequests
          }
          leftIcon="🎯"
        >
          REQUEST
        </Button>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className={styles.loadingState}>
    <div className={styles.loadingSpinner}>🎭</div>
    <p>Finding performers near you...</p>
  </div>
);

const EmptyState = ({
  searchQuery,
  onRefresh,
}: {
  searchQuery: string;
  onRefresh: () => void;
}) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>🎭</div>
    <h3>No performers found</h3>
    {searchQuery ? (
      <p>No performers match "{searchQuery}"</p>
    ) : (
      <p>No performers are currently active in your area</p>
    )}
    <Button 
      variant="secondary" 
      size="sm"
      className={styles.refreshButton} 
      onClick={onRefresh}
      leftIcon="🔄"
    >
      Refresh
    </Button>
  </div>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className={styles.errorState}>
    <div className={styles.errorIcon}>⚠️</div>
    <h3>Unable to load performers</h3>
    <p>{error}</p>
    <Button 
      variant="primary" 
      size="md"
      className={styles.retryButton} 
      onClick={onRetry}
      leftIcon="🔄"
    >
      Try Again
    </Button>
  </div>
);
