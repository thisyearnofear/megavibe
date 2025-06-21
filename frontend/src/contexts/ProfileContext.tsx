import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { web3SocialService, Web3SpeakerProfile } from '../services/web3SocialService';

interface ProfileContextType {
  profiles: Record<string, Web3SpeakerProfile>;
  getProfile: (address: string) => Promise<Web3SpeakerProfile | null>;
  isLoading: (address: string) => boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profiles, setProfiles] = useState<Record<string, Web3SpeakerProfile>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const getProfile = useCallback(async (address: string): Promise<Web3SpeakerProfile | null> => {
    const lowercasedAddress = address.toLowerCase();
    if (profiles[lowercasedAddress]) {
      return profiles[lowercasedAddress];
    }

    if (loading[lowercasedAddress]) {
      return null; // Or wait for it to finish
    }

    setLoading(prev => ({ ...prev, [lowercasedAddress]: true }));

    try {
      const profile = await web3SocialService.getWeb3SpeakerProfile(lowercasedAddress);
      if (profile) {
        setProfiles(prev => ({ ...prev, [lowercasedAddress]: profile }));
        return profile;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch profile for ${address}:`, error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [lowercasedAddress]: false }));
    }
  }, [profiles, loading]);

  const isLoading = (address: string): boolean => {
    return loading[address.toLowerCase()] || false;
  };

  const value = {
    profiles,
    getProfile,
    isLoading,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};