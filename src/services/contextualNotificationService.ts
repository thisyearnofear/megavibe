import { PerformerProfile, performerService } from '@/services/api/performerService';
import { TippedPerformer } from '@/contexts/ImpactContext';
import { useLocation, calculateDistance } from '@/hooks/useLocation';

interface ContextualNotificationEvent {
  performer: PerformerProfile;
  message: string;
}

class ContextualNotificationService {
  private lastNotificationTime: Map<string, number> = new Map();
  private notificationCooldown = 5 * 60 * 1000; // 5 minutes cooldown per performer

  constructor() {
    // This service will be instantiated once, likely in a global context or effect
  }

  async checkAndNotify(
    location: { latitude: number; longitude: number; accuracy: number } | null,
    hasPermission: boolean | null,
    tippedPerformers: TippedPerformer[]
  ): Promise<void> {
    if (!location || !hasPermission) {
      return; // Cannot check proximity without location or permission
    }

    const nearbyThresholdKm = 0.5; // Notify if within 500 meters

    for (const tipped of tippedPerformers) {
      const performerProfile = await performerService.getPerformerById(tipped.id);

      if (performerProfile && performerProfile.location) {
        // Directly use calculateDistance as isPerformerNearby is part of useLocation hook
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          performerProfile.location.lat,
          performerProfile.location.lng
        );

        const isNearby = distance <= nearbyThresholdKm;

        if (isNearby) {
          const lastNotified = this.lastNotificationTime.get(performerProfile.id) || 0;
          if (Date.now() - lastNotified > this.notificationCooldown) {
            const message = `You're near ${performerProfile.name}, a performer you've supported before!`;
            this.broadcastContextualNotification(performerProfile, message);
            this.lastNotificationTime.set(performerProfile.id, Date.now());
          }
        }
      }
    }
  }

  private broadcastContextualNotification(
    performer: PerformerProfile,
    message: string
  ): void {
    console.log(`Contextual Notification: ${message}`);
    window.dispatchEvent(new CustomEvent<ContextualNotificationEvent>('contextualNotification', {
      detail: { performer, message }
    }));
  }

  subscribeToContextualNotifications(callback: (event: ContextualNotificationEvent) => void): () => void {
    const handler = (event: CustomEvent<ContextualNotificationEvent>) => {
      callback(event.detail);
    };

    window.addEventListener('contextualNotification', handler as EventListener);

    return () => {
      window.removeEventListener('contextualNotification', handler as EventListener);
    };
  }
}

export const contextualNotificationService = new ContextualNotificationService();
