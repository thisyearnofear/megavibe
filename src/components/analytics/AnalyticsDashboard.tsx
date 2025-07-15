"use client";

import React, { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./AnalyticsDashboard.module.css";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalPerformers: number;
    totalTips: number;
    totalRevenue: number;
    averageSessionTime: number;
    conversionRate: number;
  };
  engagement: {
    dailyActiveUsers: number[];
    tipFrequency: number[];
    requestTypes: { [key: string]: number };
    peakHours: number[];
  };
  geographic: {
    topCities: { city: string; users: number; revenue: number }[];
    venueTypes: { [key: string]: number };
  };
  performance: {
    topPerformers: { name: string; earnings: number; tips: number }[];
    averageTipAmount: number;
    averageRequestAmount: number;
    completionRate: number;
  };
}

type TimeRange = "24h" | "7d" | "30d" | "90d";
type ViewType = "overview" | "engagement" | "geographic" | "performance";

interface AnalyticsDashboardProps {
  userType: "audience" | "venue";
  userId: string;
}

export default function AnalyticsDashboard({
  userType,
  userId,
}: AnalyticsDashboardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData(timeRange));
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return <LoadingState />;
  }

  if (!data) {
    return <ErrorState />;
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Analytics Dashboard</h1>
          <p className={styles.subtitle}>
            Real-time insights into MegaVibe engagement
          </p>
        </div>

        <div className={styles.controls}>
          <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Mobile View Selector */}
      {isMobile && (
        <div className={styles.mobileViewSelector}>
          {(
            [
              "overview",
              "engagement",
              "geographic",
              "performance",
            ] as ViewType[]
          ).map((view) => (
            <button
              key={view}
              className={`${styles.viewButton} ${
                activeView === view ? styles.active : ""
              }`}
              onClick={() => setActiveView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {(!isMobile || activeView === "overview") && (
          <OverviewSection data={data.overview} timeRange={timeRange} />
        )}

        {(!isMobile || activeView === "engagement") && (
          <EngagementSection data={data.engagement} timeRange={timeRange} />
        )}

        {(!isMobile || activeView === "geographic") && (
          <GeographicSection data={data.geographic} />
        )}

        {(!isMobile || activeView === "performance") && (
          <PerformanceSection data={data.performance} />
        )}
      </div>
    </div>
  );
}

const TimeRangeSelector = ({
  selected,
  onChange,
}: {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}) => {
  const ranges: { value: TimeRange; label: string }[] = [
    { value: "24h", label: "24 Hours" },
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
  ];

  return (
    <div className={styles.timeRangeSelector}>
      {ranges.map((range) => (
        <button
          key={range.value}
          className={`${styles.rangeButton} ${
            selected === range.value ? styles.active : ""
          }`}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

const OverviewSection = ({
  data,
  timeRange,
}: {
  data: AnalyticsData["overview"];
  timeRange: TimeRange;
}) => {
  const metrics = [
    {
      label: "Total Users",
      value: data.totalUsers.toLocaleString(),
      icon: "👥",
      change: "+12.5%",
      positive: true,
    },
    {
      label: "Active Performers",
      value: data.totalPerformers.toLocaleString(),
      icon: "🎭",
      change: "+8.3%",
      positive: true,
    },
    {
      label: "Tips Sent",
      value: data.totalTips.toLocaleString(),
      icon: "💰",
      change: "+23.1%",
      positive: true,
    },
    {
      label: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString()}`,
      icon: "📈",
      change: "+18.7%",
      positive: true,
    },
    {
      label: "Avg Session",
      value: `${Math.floor(data.averageSessionTime / 60)}m`,
      icon: "⏱️",
      change: "+5.2%",
      positive: true,
    },
    {
      label: "Conversion Rate",
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: "🎯",
      change: "-2.1%",
      positive: false,
    },
  ];

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Overview</h2>
      <div className={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <div key={index} className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricIcon}>{metric.icon}</span>
              <span
                className={`${styles.metricChange} ${
                  metric.positive ? styles.positive : styles.negative
                }`}
              >
                {metric.change}
              </span>
            </div>
            <div className={styles.metricValue}>{metric.value}</div>
            <div className={styles.metricLabel}>{metric.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const EngagementSection = ({
  data,
  timeRange,
}: {
  data: AnalyticsData["engagement"];
  timeRange: TimeRange;
}) => {
  const requestTypeData = Object.entries(data.requestTypes).map(
    ([type, count]) => ({
      type,
      count,
      percentage:
        (count / Object.values(data.requestTypes).reduce((a, b) => a + b, 0)) *
        100,
    })
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Engagement</h2>

      <div className={styles.engagementGrid}>
        {/* Daily Active Users Chart */}
        <div className={styles.chartCard}>
          <h3>Daily Active Users</h3>
          <div className={styles.simpleChart}>
            {data.dailyActiveUsers.map((users, index) => (
              <div
                key={index}
                className={styles.chartBar}
                style={{
                  height: `${
                    (users / Math.max(...data.dailyActiveUsers)) * 100
                  }%`,
                }}
                title={`Day ${index + 1}: ${users} users`}
              />
            ))}
          </div>
        </div>

        {/* Request Types */}
        <div className={styles.chartCard}>
          <h3>Popular Request Types</h3>
          <div className={styles.requestTypes}>
            {requestTypeData.map((item) => (
              <div key={item.type} className={styles.requestTypeItem}>
                <div className={styles.requestTypeBar}>
                  <div
                    className={styles.requestTypeFill}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className={styles.requestTypeLabel}>
                  <span>{item.type}</span>
                  <span>{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className={styles.chartCard}>
          <h3>Peak Performance Hours</h3>
          <div className={styles.peakHours}>
            {data.peakHours.map((activity, hour) => (
              <div key={hour} className={styles.hourBar}>
                <div
                  className={styles.hourActivity}
                  style={{
                    height: `${
                      (activity / Math.max(...data.peakHours)) * 100
                    }%`,
                  }}
                />
                <span className={styles.hourLabel}>
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const GeographicSection = ({ data }: { data: AnalyticsData["geographic"] }) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Geographic Insights</h2>

      <div className={styles.geoGrid}>
        {/* Top Cities */}
        <div className={styles.geoCard}>
          <h3>Top Cities</h3>
          <div className={styles.cityList}>
            {data.topCities.map((city, index) => (
              <div key={city.city} className={styles.cityItem}>
                <div className={styles.cityRank}>#{index + 1}</div>
                <div className={styles.cityInfo}>
                  <span className={styles.cityName}>{city.city}</span>
                  <span className={styles.cityStats}>
                    {city.users} users • ${city.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Types */}
        <div className={styles.geoCard}>
          <h3>Popular Venue Types</h3>
          <div className={styles.venueTypes}>
            {Object.entries(data.venueTypes).map(([type, count]) => (
              <div key={type} className={styles.venueTypeItem}>
                <div className={styles.venueTypeIcon}>{getVenueIcon(type)}</div>
                <div className={styles.venueTypeInfo}>
                  <span className={styles.venueTypeName}>{type}</span>
                  <span className={styles.venueTypeCount}>{count} venues</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const PerformanceSection = ({
  data,
}: {
  data: AnalyticsData["performance"];
}) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Performance Metrics</h2>

      <div className={styles.performanceGrid}>
        {/* Key Metrics */}
        <div className={styles.performanceMetrics}>
          <div className={styles.performanceMetric}>
            <span className={styles.performanceValue}>
              ${data.averageTipAmount.toFixed(2)}
            </span>
            <span className={styles.performanceLabel}>Average Tip</span>
          </div>
          <div className={styles.performanceMetric}>
            <span className={styles.performanceValue}>
              ${data.averageRequestAmount.toFixed(2)}
            </span>
            <span className={styles.performanceLabel}>Average Request</span>
          </div>
          <div className={styles.performanceMetric}>
            <span className={styles.performanceValue}>
              {data.completionRate.toFixed(1)}%
            </span>
            <span className={styles.performanceLabel}>Completion Rate</span>
          </div>
        </div>

        {/* Top Performers */}
        <div className={styles.topPerformers}>
          <h3>Top Performers</h3>
          <div className={styles.performerList}>
            {data.topPerformers.map((performer, index) => (
              <div key={performer.name} className={styles.performerItem}>
                <div className={styles.performerRank}>#{index + 1}</div>
                <div className={styles.performerInfo}>
                  <span className={styles.performerName}>{performer.name}</span>
                  <span className={styles.performerStats}>
                    ${performer.earnings.toLocaleString()} • {performer.tips}{" "}
                    tips
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const LoadingState = () => (
  <div className={styles.loadingState}>
    <div className={styles.loadingSpinner} />
    <p>Loading analytics data...</p>
  </div>
);

const ErrorState = () => (
  <div className={styles.errorState}>
    <div className={styles.errorIcon}>📊</div>
    <h3>Unable to load analytics</h3>
    <p>Please try again later</p>
  </div>
);

// Helper functions
function generateMockData(timeRange: TimeRange): AnalyticsData {
  const multiplier =
    timeRange === "24h"
      ? 1
      : timeRange === "7d"
      ? 7
      : timeRange === "30d"
      ? 30
      : 90;

  return {
    overview: {
      totalUsers: Math.floor(1250 * multiplier * 0.1),
      totalPerformers: Math.floor(85 * multiplier * 0.05),
      totalTips: Math.floor(2340 * multiplier * 0.2),
      totalRevenue: Math.floor(12500 * multiplier * 0.15),
      averageSessionTime: 1800 + Math.floor(Math.random() * 600),
      conversionRate: 15.8 + Math.random() * 5,
    },
    engagement: {
      dailyActiveUsers: Array.from(
        { length: 7 },
        () => Math.floor(Math.random() * 500) + 200
      ),
      tipFrequency: Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 100)
      ),
      requestTypes: {
        "Song Requests": 145,
        Shoutouts: 89,
        Dedications: 67,
        Encores: 45,
        "Custom Performances": 23,
      },
      peakHours: Array.from({ length: 24 }, (_, i) => {
        // Higher activity in evening hours
        const base = i >= 18 && i <= 23 ? 80 : i >= 12 && i <= 17 ? 60 : 20;
        return base + Math.floor(Math.random() * 40);
      }),
    },
    geographic: {
      topCities: [
        { city: "San Francisco", users: 1250, revenue: 15600 },
        { city: "New York", users: 1100, revenue: 14200 },
        { city: "Los Angeles", users: 980, revenue: 12800 },
        { city: "Austin", users: 750, revenue: 9500 },
        { city: "Nashville", users: 680, revenue: 8900 },
      ],
      venueTypes: {
        "Street Corners": 45,
        "Coffee Shops": 32,
        Parks: 28,
        "Bars & Clubs": 25,
        Festivals: 18,
        "Subway Stations": 15,
      },
    },
    performance: {
      topPerformers: [
        { name: "Jake Blues", earnings: 2450, tips: 156 },
        { name: "Sarah Comedy", earnings: 1890, tips: 134 },
        { name: "DJ Mike", earnings: 1650, tips: 98 },
        { name: "Luna Folk", earnings: 1420, tips: 112 },
        { name: "Street Poet", earnings: 1200, tips: 89 },
      ],
      averageTipAmount: 8.5 + Math.random() * 3,
      averageRequestAmount: 18.75 + Math.random() * 5,
      completionRate: 85.5 + Math.random() * 10,
    },
  };
}

function getVenueIcon(venueType: string): string {
  const icons: { [key: string]: string } = {
    "Street Corners": "🛣️",
    "Coffee Shops": "☕",
    Parks: "🌳",
    "Bars & Clubs": "🍺",
    Festivals: "🎪",
    "Subway Stations": "🚇",
  };
  return icons[venueType] || "📍";
}
