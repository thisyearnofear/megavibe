"use client";

import React, { useState, useEffect } from 'react';
import { performerService, PerformerProfile } from '@/services/api/performerService';
import PerformerCard from '@/components/performer/PerformerCard';
import Container from '@/components/layout/Container';
import styles from './DesktopPerformerDiscovery.module.css';

const DesktopPerformerDiscovery = () => {
  const [performers, setPerformers] = useState<PerformerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPerformers = async () => {
      try {
        setLoading(true);
        setError(null);
        // For desktop, we can fetch a broader set of performers
        const allPerformers = await performerService.getNearbyPerformers({
          lat: 37.7749, // Default to SF for desktop
          lng: -122.4194,
          radius: 500, // Larger radius
          status: "all",
          limit: 100,
        });
        setPerformers(allPerformers);
      } catch (err) {
        console.error('Failed to load performers:', err);
        setError('Failed to load performers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadPerformers();
  }, []);

  const filteredPerformers = performers.filter(
    (performer) =>
      performer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      performer.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      performer.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className={styles.discoverySection}>
      <Container>
        <h2 className={styles.title}>Explore Performers</h2>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search performers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {error ? (
          <p className={styles.error}>{error}</p>
        ) : loading ? (
          <p>Loading performers...</p>
        ) : (
          <div className={styles.grid}>
            {filteredPerformers.map((performer) => (
              <PerformerCard key={performer.id} performer={performer} />
            ))}
          </div>
        )}
        {filteredPerformers.length === 0 && !loading && !error && (
          <p className={styles.noResults}>No performers found matching your search.</p>
        )}
      </Container>
    </section>
  );
};

export default DesktopPerformerDiscovery;
