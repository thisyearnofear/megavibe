"use client";

import React, { useState, useMemo } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useAnalytics } from "@/hooks/useAnalytics";
import AnalyticsDashboard from "../analytics/AnalyticsDashboard";
import styles from "./VenueFeatures.module.css";

interface Venue {
  id: string;
  name: string;
  type: "club" | "bar" | "festival" | "street" | "theater" | "cafe";
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  settings: {
    allowTips: boolean;
    allowRequests: boolean;
    minimumTip: number;
    minimumRequest: number;
    requestTypes: string[];
  };
}

interface Event {
  id: string;
  name: string;
  venueId: string;
  startTime: Date;
  endTime: Date;
  performers: string[];
  status: "upcoming" | "live" | "finished";
  description?: string;
}

interface VenueFeaturesProps {
  venue: Venue;
  isManager?: boolean;
}

export default function VenueFeatures({
  venue,
  isManager = false,
}: VenueFeaturesProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "performers" | "analytics"
  >("overview");
  const { location } = useLocation();

  // Memoized venue-specific data
  const venueData = useMemo(
    () => ({
      currentEvents: getCurrentEvents(venue.id),
      activePerformers: getActivePerformers(venue.id),
      audienceCount: getAudienceCount(venue.id),
      recentActivity: getRecentActivity(venue.id),
    }),
    [venue.id]
  );

  return (
    <div
      className={styles.venueFeatures}
      style={
        {
          "--venue-primary": venue.branding.primaryColor,
          "--venue-secondary": venue.branding.secondaryColor,
        } as React.CSSProperties
      }
    >
      <VenueHeader venue={venue} audienceCount={venueData.audienceCount} />

      <VenueNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isManager={isManager}
      />

      <div className={styles.tabContent}>
        {activeTab === "overview" && (
          <VenueOverview
            venue={venue}
            events={venueData.currentEvents}
            performers={venueData.activePerformers}
            activity={venueData.recentActivity}
          />
        )}

        {activeTab === "events" && (
          <VenueEvents
            venue={venue}
            events={venueData.currentEvents}
            isManager={isManager}
          />
        )}

        {activeTab === "performers" && (
          <VenuePerformers
            venue={venue}
            performers={venueData.activePerformers}
            isManager={isManager}
          />
        )}

        {activeTab === "analytics" && isManager && (
          <AnalyticsDashboard userType="venue" userId={venue.id} />
        )}
      </div>
    </div>
  );
}

// Reusable Venue Header Component
const VenueHeader = ({
  venue,
  audienceCount,
}: {
  venue: Venue;
  audienceCount: number;
}) => (
  <div className={styles.venueHeader}>
    <div className={styles.venueInfo}>
      {venue.branding.logo ? (
        <img
          src={venue.branding.logo}
          alt={venue.name}
          className={styles.venueLogo}
        />
      ) : (
        <div className={styles.venueIcon}>{getVenueIcon(venue.type)}</div>
      )}
      <div className={styles.venueDetails}>
        <h1 className={styles.venueName}>{venue.name}</h1>
        <p className={styles.venueType}>{formatVenueType(venue.type)}</p>
        <p className={styles.venueAddress}>{venue.location.address}</p>
      </div>
    </div>

    <div className={styles.venueStats}>
      <div className={styles.audienceCount}>
        <span className={styles.audienceIcon}>👥</span>
        <span className={styles.audienceNumber}>{audienceCount}</span>
        <span className={styles.audienceLabel}>Current Audience</span>
      </div>
    </div>
  </div>
);

// Reusable Navigation Component
const VenueNavigation = ({
  activeTab,
  onTabChange,
  isManager,
}: {
  activeTab: string;
  onTabChange: (tab: any) => void;
  isManager: boolean;
}) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: "🏢" },
    { id: "events", label: "Events", icon: "🎪" },
    { id: "performers", label: "Performers", icon: "🎭" },
    ...(isManager ? [{ id: "analytics", label: "Analytics", icon: "📊" }] : []),
  ];

  return (
    <nav className={styles.venueNavigation}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.navTab} ${
            activeTab === tab.id ? styles.active : ""
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

// Venue Overview Component
const VenueOverview = ({
  venue,
  events,
  performers,
  activity,
}: {
  venue: Venue;
  events: Event[];
  performers: any[];
  activity: any[];
}) => (
  <div className={styles.venueOverview}>
    <div className={styles.overviewGrid}>
      <div className={styles.overviewCard}>
        <h3>🎪 Current Events</h3>
        {events.length === 0 ? (
          <p className={styles.emptyState}>No events currently active</p>
        ) : (
          <div className={styles.eventsList}>
            {events.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        )}
      </div>

      <div className={styles.overviewCard}>
        <h3>🎭 Active Performers</h3>
        {performers.length === 0 ? (
          <p className={styles.emptyState}>No performers currently active</p>
        ) : (
          <div className={styles.performersList}>
            {performers.slice(0, 4).map((performer) => (
              <PerformerCard key={performer.id} performer={performer} compact />
            ))}
          </div>
        )}
      </div>

      <div className={styles.overviewCard}>
        <h3>⚡ Recent Activity</h3>
        {activity.length === 0 ? (
          <p className={styles.emptyState}>No recent activity</p>
        ) : (
          <div className={styles.activityList}>
            {activity.slice(0, 5).map((item, index) => (
              <ActivityItem key={index} activity={item} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.overviewCard}>
        <h3>⚙️ Venue Settings</h3>
        <VenueSettings venue={venue} />
      </div>
    </div>
  </div>
);

// Venue Events Component
const VenueEvents = ({
  venue,
  events,
  isManager,
}: {
  venue: Venue;
  events: Event[];
  isManager: boolean;
}) => {
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "live" | "finished"
  >("all");

  const filteredEvents = useMemo(() => {
    return filter === "all"
      ? events
      : events.filter((e) => e.status === filter);
  }, [events, filter]);

  return (
    <div className={styles.venueEvents}>
      <div className={styles.eventsHeader}>
        <h2>Events</h2>
        {isManager && (
          <button className={styles.createEventButton}>
            <span>➕</span> Create Event
          </button>
        )}
      </div>

      <div className={styles.eventsFilter}>
        {(["all", "upcoming", "live", "finished"] as const).map((status) => (
          <button
            key={status}
            className={`${styles.filterButton} ${
              filter === status ? styles.active : ""
            }`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.eventsList}>
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

// Venue Performers Component
const VenuePerformers = ({
  venue,
  performers,
  isManager,
}: {
  venue: Venue;
  performers: any[];
  isManager: boolean;
}) => (
  <div className={styles.venuePerformers}>
    <div className={styles.performersHeader}>
      <h2>Performers</h2>
      {isManager && (
        <button className={styles.invitePerformerButton}>
          <span>📧</span> Invite Performer
        </button>
      )}
    </div>

    <div className={styles.performersGrid}>
      {performers.map((performer) => (
        <PerformerCard key={performer.id} performer={performer} />
      ))}
    </div>
  </div>
);

// Reusable Components
const EventCard = ({
  event,
  compact = false,
}: {
  event: Event;
  compact?: boolean;
}) => (
  <div className={`${styles.eventCard} ${compact ? styles.compact : ""}`}>
    <div className={styles.eventStatus}>
      <span className={`${styles.statusDot} ${styles[event.status]}`} />
      <span className={styles.statusText}>{event.status}</span>
    </div>
    <h4 className={styles.eventName}>{event.name}</h4>
    <p className={styles.eventTime}>
      {event.startTime.toLocaleTimeString()} -{" "}
      {event.endTime.toLocaleTimeString()}
    </p>
    {!compact && event.description && (
      <p className={styles.eventDescription}>{event.description}</p>
    )}
    <div className={styles.eventPerformers}>
      {event.performers.length} performer
      {event.performers.length !== 1 ? "s" : ""}
    </div>
  </div>
);

const PerformerCard = ({
  performer,
  compact = false,
}: {
  performer: any;
  compact?: boolean;
}) => (
  <div className={`${styles.performerCard} ${compact ? styles.compact : ""}`}>
    <div className={styles.performerAvatar}>{performer.avatar || "🎭"}</div>
    <div className={styles.performerInfo}>
      <h4 className={styles.performerName}>{performer.name}</h4>
      <p className={styles.performerType}>{performer.type}</p>
      {!compact && (
        <div className={styles.performerStats}>
          <span>💰 ${performer.earnings || 0}</span>
          <span>👏 {performer.tips || 0} tips</span>
        </div>
      )}
    </div>
    <div className={styles.performerStatus}>
      <span className={`${styles.statusDot} ${styles[performer.status]}`} />
    </div>
  </div>
);

const ActivityItem = ({ activity }: { activity: any }) => (
  <div className={styles.activityItem}>
    <span className={styles.activityIcon}>{activity.icon}</span>
    <span className={styles.activityText}>{activity.text}</span>
    <span className={styles.activityTime}>{activity.time}</span>
  </div>
);

const VenueSettings = ({ venue }: { venue: Venue }) => (
  <div className={styles.venueSettings}>
    <div className={styles.setting}>
      <span>Tips: {venue.settings.allowTips ? "✅" : "❌"}</span>
      {venue.settings.allowTips && (
        <span className={styles.settingDetail}>
          Min: ${venue.settings.minimumTip}
        </span>
      )}
    </div>
    <div className={styles.setting}>
      <span>Requests: {venue.settings.allowRequests ? "✅" : "❌"}</span>
      {venue.settings.allowRequests && (
        <span className={styles.settingDetail}>
          Min: ${venue.settings.minimumRequest}
        </span>
      )}
    </div>
  </div>
);

// Utility Functions (Clean, organized)
function getVenueIcon(type: string): string {
  const icons = {
    club: "🎪",
    bar: "🍺",
    festival: "🎪",
    street: "🛣️",
    theater: "🎭",
    cafe: "☕",
  };
  return icons[type as keyof typeof icons] || "🏢";
}

function formatVenueType(type: string): string {
  return (
    type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1")
  );
}

// Mock data functions (would be replaced with real API calls)
function getCurrentEvents(venueId: string): Event[] {
  return [
    {
      id: "event1",
      name: "Open Mic Night",
      venueId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      performers: ["performer1", "performer2"],
      status: "live",
      description: "Weekly open mic event",
    },
  ];
}

function getActivePerformers(venueId: string) {
  return [
    {
      id: "performer1",
      name: "Jake Blues",
      type: "Musician",
      avatar: "🎸",
      status: "live",
      earnings: 45,
      tips: 12,
    },
  ];
}

function getAudienceCount(venueId: string): number {
  return Math.floor(Math.random() * 50) + 10;
}

function getRecentActivity(venueId: string) {
  return [
    { icon: "💰", text: "Jake Blues received a $5 tip", time: "2 min ago" },
    {
      icon: "🎯",
      text: "New song request for Sarah Comedy",
      time: "5 min ago",
    },
    { icon: "👥", text: "3 new audience members joined", time: "8 min ago" },
  ];
}
