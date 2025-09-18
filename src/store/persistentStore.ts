import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasSeenCreateTour: boolean;
  tutorialProgress: {
    discover: boolean;
    tip: boolean;
    bounty: boolean;
    create: boolean;
  };
}

export interface ImpactState {
  totalTips: number;
  totalBounties: number;
  tippedPerformers: Array<{
    id: string;
    type: string;
    genres: string[];
    tipAmount?: string;
    timestamp: number;
  }>;
  favoritePerformers: string[];
  achievements: string[];
}

export interface PersistentState {
  onboarding: OnboardingState;
  impact: ImpactState;
  
  // Onboarding actions
  setOnboardingComplete: (complete: boolean) => void;
  setCreateTourSeen: (seen: boolean) => void;
  updateTutorialProgress: (step: keyof OnboardingState['tutorialProgress'], completed: boolean) => void;
  
  // Impact actions
  updateImpactStats: (tips: number, bounties: number) => void;
  addTippedPerformer: (performer: ImpactState['tippedPerformers'][0]) => void;
  addFavoritePerformer: (performerId: string) => void;
  removeFavoritePerformer: (performerId: string) => void;
  addAchievement: (achievement: string) => void;
  showImpactMessage: (message: string) => void;
}

const initialOnboardingState: OnboardingState = {
  hasCompletedOnboarding: false,
  hasSeenCreateTour: false,
  tutorialProgress: {
    discover: false,
    tip: false,
    bounty: false,
    create: false,
  },
};

const initialImpactState: ImpactState = {
  totalTips: 0,
  totalBounties: 0,
  tippedPerformers: [],
  favoritePerformers: [],
  achievements: [],
};

export const usePersistentStore = create<PersistentState>()(
  devtools(
    persist(
      (set, get) => ({
        // State slices
        onboarding: initialOnboardingState,
        impact: initialImpactState,

        // Onboarding actions
        setOnboardingComplete: (complete) => {
          set(
            (state) => ({
              onboarding: {
                ...state.onboarding,
                hasCompletedOnboarding: complete,
              },
            }),
            false,
            'onboarding/setComplete'
          );
        },

        setCreateTourSeen: (seen) => {
          set(
            (state) => ({
              onboarding: {
                ...state.onboarding,
                hasSeenCreateTour: seen,
              },
            }),
            false,
            'onboarding/setCreateTourSeen'
          );
        },

        updateTutorialProgress: (step, completed) => {
          set(
            (state) => ({
              onboarding: {
                ...state.onboarding,
                tutorialProgress: {
                  ...state.onboarding.tutorialProgress,
                  [step]: completed,
                },
              },
            }),
            false,
            'onboarding/updateTutorialProgress'
          );
        },

        // Impact actions
        updateImpactStats: (tips, bounties) => {
          set(
            (state) => ({
              impact: {
                ...state.impact,
                totalTips: tips,
                totalBounties: bounties,
              },
            }),
            false,
            'impact/updateStats'
          );
        },

        addTippedPerformer: (performer) => {
          set(
            (state) => ({
              impact: {
                ...state.impact,
                tippedPerformers: [
                  ...state.impact.tippedPerformers,
                  { ...performer, timestamp: Date.now() },
                ],
                totalTips: state.impact.totalTips + 1,
              },
            }),
            false,
            'impact/addTippedPerformer'
          );
        },

        addFavoritePerformer: (performerId) => {
          set(
            (state) => ({
              impact: {
                ...state.impact,
                favoritePerformers: [...state.impact.favoritePerformers, performerId],
              },
            }),
            false,
            'impact/addFavorite'
          );
        },

        removeFavoritePerformer: (performerId) => {
          set(
            (state) => ({
              impact: {
                ...state.impact,
                favoritePerformers: state.impact.favoritePerformers.filter(
                  id => id !== performerId
                ),
              },
            }),
            false,
            'impact/removeFavorite'
          );
        },

        addAchievement: (achievement) => {
          set(
            (state) => ({
              impact: {
                ...state.impact,
                achievements: [...state.impact.achievements, achievement],
              },
            }),
            false,
            'impact/addAchievement'
          );
        },

        showImpactMessage: (message) => {
          // This would typically trigger a notification
          // For now, we'll just log it
          console.log('Impact message:', message);
        },
      }),
      {
        name: 'megavibe-persistent-store',
        partialize: (state) => ({
          onboarding: state.onboarding,
          impact: state.impact,
        }),
      }
    ),
    {
      name: 'megavibe-persistent-store',
    }
  )
);

// Selectors for optimized access
export const useOnboardingState = () => usePersistentStore((state) => state.onboarding);
export const useImpactState = () => usePersistentStore((state) => state.impact);

// Action selectors
export const useOnboardingActions = () => usePersistentStore((state) => ({
  setComplete: state.setOnboardingComplete,
  setCreateTourSeen: state.setCreateTourSeen,
  updateProgress: state.updateTutorialProgress,
}));

export const useImpactActions = () => usePersistentStore((state) => ({
  updateStats: state.updateImpactStats,
  addTippedPerformer: state.addTippedPerformer,
  addFavorite: state.addFavoritePerformer,
  removeFavorite: state.removeFavoritePerformer,
  addAchievement: state.addAchievement,
  showMessage: state.showImpactMessage,
}));