"use client";

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';

import React from 'react';
import styles from './ProfilePage.module.css';
import ImpactStats from '@/components/profile/ImpactStats';
import TippingHistory from '@/components/profile/TippingHistory';
import BountySummary from '@/components/profile/BountySummary';

const ProfilePage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Profile</h1>
      <ImpactStats />
      <TippingHistory />
      <BountySummary />
    </div>
  );
};

export default ProfilePage;
