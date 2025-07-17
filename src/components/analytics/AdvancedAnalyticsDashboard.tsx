"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./AdvancedAnalyticsDashboard.module.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock Data Generation
const generateMockData = (timeRange: string) => {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const data = {
    overview: {
      totalTips: Math.floor(Math.random() * 1000) + 500,
      totalRevenue: Math.floor(Math.random() * 20000) + 10000,
      uniqueTippers: Math.floor(Math.random() * 300) + 100,
      conversionRate: Math.random() * 15 + 5,
    },
    revenueTrends: Array.from({ length: days }, (_, i) => ({
      date: `Day ${i + 1}`,
      revenue: Math.floor(Math.random() * 1000) + 200,
      tips: Math.floor(Math.random() * 50) + 10,
    })),
    tipperDemographics: {
      byLocation: [
        { name: "New York", value: 400 },
        { name: "London", value: 300 },
        { name: "Tokyo", value: 200 },
        { name: "Paris", value: 100 },
      ],
      byDevice: [
        { name: "Mobile", value: 650 },
        { name: "Desktop", value: 350 },
      ],
    },
    topPerformers: Array.from({ length: 5 }, (_, i) => ({
      name: `Performer ${i + 1}`,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      tips: Math.floor(Math.random() * 200) + 50,
    })),
  };
  return data;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>{`${
            pld.name
          }: ${pld.value.toLocaleString()}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdvancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setData(generateMockData(timeRange));
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const memoizedData = useMemo(() => data, [data]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!memoizedData) {
    return <div className={styles.error}>Error loading data.</div>;
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Analytics Dashboard</h1>
        <div className={styles.timeRangeSelector}>
          {["7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              className={`${styles.timeRangeButton} ${
                timeRange === range ? styles.active : ""
              }`}
              onClick={() => setTimeRange(range)}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <h4>Total Revenue</h4>
          <p>${memoizedData.overview.totalRevenue.toLocaleString()}</p>
        </div>
        <div className={styles.overviewCard}>
          <h4>Total Tips</h4>
          <p>{memoizedData.overview.totalTips.toLocaleString()}</p>
        </div>
        <div className={styles.overviewCard}>
          <h4>Unique Tippers</h4>
          <p>{memoizedData.overview.uniqueTippers.toLocaleString()}</p>
        </div>
        <div className={styles.overviewCard}>
          <h4>Conversion Rate</h4>
          <p>{memoizedData.overview.conversionRate.toFixed(2)}%</p>
        </div>
      </section>

      <section className={styles.mainChart}>
        <h2 className={styles.sectionTitle}>Revenue Trends</h2>
        <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
          <LineChart data={memoizedData.revenueTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line type="monotone" dataKey="tips" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className={styles.secondaryGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Tipper Demographics</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={memoizedData.tipperDemographics.byLocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {memoizedData.tipperDemographics.byLocation.map(
                  (_entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  )
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Top Performers</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={memoizedData.topPerformers}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" />
              <Bar dataKey="tips" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
