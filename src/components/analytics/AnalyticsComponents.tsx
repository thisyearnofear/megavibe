"use client";

import React, { memo } from "react";
import styles from "./AnalyticsComponents.module.css";

// Memoized MetricCard for performance (prevents unnecessary re-renders)
export const MetricCard = memo(({ 
  title, 
  value, 
  change, 
  icon, 
  format = "number",
  trend 
}: {
  title: string;
  value: number;
  change?: number;
  icon: string;
  format?: "number" | "currency" | "percentage" | "duration";
  trend?: "up" | "down" | "neutral";
}) => {
  const formattedValue = formatValue(value, format);
  const changeColor = change && change > 0 ? styles.positive : change && change < 0 ? styles.negative : styles.neutral;
  
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricIcon}>{icon}</span>
        <span className={styles.metricTitle}>{title}</span>
      </div>
      
      <div className={styles.metricValue}>
        <span className={styles.value}>{formattedValue}</span>
        {change !== undefined && (
          <span className={`${styles.change} ${changeColor}`}>
            {change > 0 ? "+" : ""}{change.toFixed(1)}%
          </span>
        )}
      </div>
      
      {trend && (
        <div className={styles.trendIndicator}>
          <span className={styles.trendIcon}>
            {trend === "up" ? "📈" : trend === "down" ? "📉" : "➡️"}
          </span>
          <span className={styles.trendText}>
            {trend === "up" ? "Trending up" : trend === "down" ? "Trending down" : "Stable"}
          </span>
        </div>
      )}
    </div>
  );
});

MetricCard.displayName = "MetricCard";

// Reusable TimeRangeSelector component
export const TimeRangeSelector = memo(({ 
  value, 
  onChange, 
  options 
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) => (
  <div className={styles.timeRangeSelector}>
    {options.map((option) => (
      <button
        key={option.value}
        className={`${styles.timeRangeButton} ${value === option.value ? styles.active : ""}`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
));

TimeRangeSelector.displayName = "TimeRangeSelector";

// Optimized ChartContainer with lazy loading
export const ChartContainer = memo(({ 
  title, 
  type, 
  data, 
  timeRange, 
  className = "" 
}: {
  title: string;
  type: "line" | "bar" | "doughnut" | "area";
  data: unknown;
  timeRange?: string;
  className?: string;
}) => {
  // In a real implementation, this would use a chart library like Chart.js or Recharts
  // For now, we'll create a simple visual representation
  
  return (
    <div className={`${styles.chartContainer} ${className}`}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {timeRange && (
          <span className={styles.chartTimeRange}>{timeRange}</span>
        )}
      </div>
      
      <div className={styles.chartContent}>
        <SimpleChart type={type} data={data} />
      </div>
    </div>
  );
});

ChartContainer.displayName = "ChartContainer";

// Simple chart implementation (would be replaced with real chart library)
const SimpleChart = memo(({ type, data }: { type: string; data: unknown }) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={styles.emptyChart}>
        <span className={styles.emptyChartIcon}>📊</span>
        <p>No data available</p>
      </div>
    );
  }

  if (type === "line" || type === "bar") {
    // Data for line/bar chart is expected to be an array of { value: number, label: string }
    if (
      Array.isArray(data) &&
      data.every(
        (d) =>
          typeof d === "object" &&
          d !== null &&
          "value" in d &&
          typeof d.value === "number" &&
          "label" in d &&
          typeof d.label === "string"
      )
    ) {
      if (type === "line") {
        return <LineChart data={data as { value: number; label: string }[]} />;
      }
      if (type === "bar") {
        return <BarChart data={data as { value: number; label: string }[]} />;
      }
    }
    return <div className={styles.chartPlaceholder}>Invalid data for {type} chart</div>;
  }
  if (type === "doughnut") {
    // Data for doughnut is expected to be Record<string, number>
    if (
      typeof data === "object" &&
      data !== null &&
      !Array.isArray(data)
    ) {
      return <DoughnutChart data={data as Record<string, number>} />;
    }
    return <div className={styles.chartPlaceholder}>Invalid data for doughnut chart</div>;
  }
  return <div className={styles.chartPlaceholder}>Chart: {type}</div>;
});

SimpleChart.displayName = "SimpleChart";

// Simple chart implementations (optimized for performance)
const LineChart = memo(({ data }: { data: { value: number; label: string }[] }) => (
  <div className={styles.lineChart}>
    <svg viewBox="0 0 400 200" className={styles.chartSvg}>
      {/* Simple line chart implementation */}
      <polyline
        points={data.map((point, index) => 
          `${(index / (data.length - 1)) * 380 + 10},${190 - (point.value / Math.max(...data.map(d => d.value))) * 170}`
        ).join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      {data.map((point, index) => (
        <circle
          key={index}
          cx={(index / (data.length - 1)) * 380 + 10}
          cy={190 - (point.value / Math.max(...data.map(d => d.value))) * 170}
          r="3"
          fill="var(--primary)"
        />
      ))}
    </svg>
  </div>
));

LineChart.displayName = "LineChart";

const BarChart = memo(({ data }: { data: { value: number; label: string }[] }) => (
  <div className={styles.barChart}>
    {data.map((item, index) => (
      <div key={index} className={styles.barItem}>
        <div 
          className={styles.bar}
          style={{ 
            height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
            backgroundColor: `hsl(${(index * 360) / data.length}, 70%, 50%)`
          }}
        />
        <span className={styles.barLabel}>{item.label}</span>
      </div>
    ))}
  </div>
));

BarChart.displayName = "BarChart";

const DoughnutChart = memo(({ data }: { data: Record<string, number> }) => {
  const total = Object.values(data).reduce((sum: number, value: number) => sum + value, 0);
  let currentAngle = 0;
  
  return (
    <div className={styles.doughnutChart}>
      <svg viewBox="0 0 200 200" className={styles.chartSvg}>
        {Object.entries(data).map(([key, value], index) => {
          const percentage = value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          currentAngle += angle;
          
          const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
          const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
          const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
          const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          return (
            <path
              key={key}
              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
              fill={`hsl(${(index * 360) / Object.keys(data).length}, 70%, 50%)`}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx="100" cy="100" r="40" fill="var(--background)" />
      </svg>
      
      <div className={styles.doughnutLegend}>
        {Object.entries(data).map(([key, value], index) => (
          <div key={key} className={styles.legendItem}>
            <span 
              className={styles.legendColor}
              style={{ backgroundColor: `hsl(${(index * 360) / Object.keys(data).length}, 70%, 50%)` }}
            />
            <span className={styles.legendLabel}>{key}: {value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

DoughnutChart.displayName = "DoughnutChart";

// Utility function for formatting values (DRY principle)
function formatValue(value: number, format: string): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    
    case "percentage":
      return `${(value * 100).toFixed(1)}%`;
    
    case "duration":
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    
    case "number":
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}