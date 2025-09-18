"use client";

import React, { useState } from 'react';
import { BaseCard } from '@/components/shared/BaseCard';
import Button from '@/components/shared/Button';
import QuickTip from '@/components/mobile/QuickTip';
import QuickRequest from '@/components/mobile/QuickRequest';
import { PerformerProfile } from '@/services/api/performerService';
import styles from './PerformerCard.module.css';

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
  const [isLiked, setIsLiked] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const handleTipComplete = () => {
    setShowTipModal(false);
    setTipSuccess(true);
    setTimeout(() => setTipSuccess(false), 3000);
    console.log('Tip completed successfully!');
  };

  const handleRequestComplete = () => {
    setShowRequestModal(false);
    setRequestSuccess(true);
    setTimeout(() => setRequestSuccess(false), 3000);
    console.log('Request created successfully!');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <BaseCard 
      variant="elevated" 
      hoverable 
      className={styles.card}
    >
      <div className={styles.info}>
        <h3 className={styles.name}>{performer.name}</h3>
        <p className={styles.specialty}>{performer.type}</p>
        {performer.distance && <p className={styles.distance}>📍 {performer.distance}</p>}
        {performer.status === 'live' && (
          <div className={styles.liveIndicator}>
            🔴 LIVE
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <Button 
          variant="tip" 
          size="sm"
          success={tipSuccess}
          onClick={() => setShowTipModal(true)}
          leftIcon="💰"
        >
          Tip
        </Button>
        <Button 
          variant="bounty" 
          size="sm"
          success={requestSuccess}
          onClick={() => setShowRequestModal(true)}
          leftIcon="🎯"
        >
          Request
        </Button>
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
    </BaseCard>
  );
};

export default PerformerCard;