"use client";

import { useEffect } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useImpact } from '@/contexts/ImpactContext';
import { contextualNotificationService } from '@/services/contextualNotificationService';

const LocationBasedNotifier = () => {
  const { location, hasPermission } = useLocation();
  const { tippedPerformers } = useImpact();

  useEffect(() => {
    if (location && hasPermission) {
      contextualNotificationService.checkAndNotify(location, hasPermission, tippedPerformers);
    }
  }, [location, hasPermission, tippedPerformers]);

  return null; // This component doesn't render anything
};

export default LocationBasedNotifier;
