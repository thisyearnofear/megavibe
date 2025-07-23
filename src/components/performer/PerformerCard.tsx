"use client";

import React, { useState } from 'react';
import styles from './PerformerCard.module.css';
import QuickTip from '@/components/mobile/QuickTip';
import QuickRequest from '@/components/mobile/QuickRequest';
import { PerformerProfile } from '@/services/api/performerService';

interface Performer extends PerformerProfile {
  distance?: string;
  distanceKm?: number;
}

interface PerformerCardProps {
  performer: Performer;
}

const PerformerCard = ({ performer }: PerformerCardProps) => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleTipComplete = () => {
    setShowTipModal(false);
    console.log('Tip completed successfully!');
  };

  const handleRequestComplete = () => {
    setShowRequestModal(false);
    console.log('Request created successfully!');
  };

  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <h3 className={styles.name}>{performer.name}</h3>
        <p className={styles.specialty}>{performer.type}</p>
        {performer.distance && <p className={styles.distance}>{performer.distance}</p>}
      </div>
      <div className={styles.actions}>
        <button className={styles.button} onClick={() => setShowTipModal(true)}>Tip</button>
        <button className={styles.button} onClick={() => setShowRequestModal(true)}>Request</button>
      </div>

      <QuickTip
        performer={performer}
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        onComplete={handleTipComplete}
      />

      <QuickRequest
        performer={performer}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onComplete={handleRequestComplete}
      />
    </div>
  );
};

export default PerformerCard;
