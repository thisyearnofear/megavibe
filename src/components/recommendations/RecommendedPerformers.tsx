"use client";

import React, { useEffect, useState } from 'react';
import { useImpact } from '@/contexts/ImpactContext';
import { recommendationService } from '@/services/recommendationService';
import { PerformerProfile } from '@/services/api/performerService';
import PerformerCard from '@/components/performer/PerformerCard';
import Container from '@/components/layout/Container';
import styles from './RecommendedPerformers.module.css';

const RecommendedPerformers = () => {
  const { tippedPerformers } = useImpact();
  const [recommendations, setRecommendations] = useState<PerformerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchedRecommendations = recommendationService.getRecommendations(tippedPerformers);
    setRecommendations(fetchedRecommendations);
    setLoading(false);
  }, [tippedPerformers]);

  if (loading) {
    return (
      <section className={styles.section}>
        <Container>
          <h2 className={styles.title}>Recommended for You</h2>
          <p>Loading recommendations...</p>
        </Container>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <section className={styles.section}>
      <Container>
        <h2 className={styles.title}>Recommended for You</h2>
        <div className={styles.grid}>
          {recommendations.map((performer) => (
            <PerformerCard key={performer.id} performer={performer} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default RecommendedPerformers;
