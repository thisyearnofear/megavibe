"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  FilCDNService,
  StorageResult,
  RetrievalResult,
} from "@/services/filcdn/filcdnService";
import { createFilCDNAdapter } from "@/services/filcdn/filcdnAdapter";

// FilCDN Context State Interface
interface FilCDNContextState {
  filcdn: FilCDNService | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  stats: any | null;
  storeData: (data: any) => Promise<StorageResult>;
  retrieveData: (cid: string) => Promise<RetrievalResult>;
  getCDNUrl: (cid: string) => Promise<string>;
  clearError: () => void;
  reInitialize: () => Promise<void>;
}

// Default context state
const defaultContextState: FilCDNContextState = {
  filcdn: null,
  isInitialized: false,
  isInitializing: false,
  error: null,
  stats: null,
  storeData: async () => {
    throw new Error("FilCDN not initialized");
  },
  retrieveData: async () => {
    throw new Error("FilCDN not initialized");
  },
  getCDNUrl: async () => {
    throw new Error("FilCDN not initialized");
  },
  clearError: () => {},
  reInitialize: async () => {},
};

// Create context
const FilCDNContext = createContext<FilCDNContextState>(defaultContextState);

// Environment configuration
const env = {
  filcdn: {
    // Private key is now handled securely on the server-side only
    rpcUrl:
      process.env.NEXT_PUBLIC_FILECOIN_RPC_URL ||
      "https://api.calibration.node.glif.io/rpc/v1",
    enabled: process.env.NEXT_PUBLIC_FILCDN_ENABLED === "true",
    useReal: process.env.NEXT_PUBLIC_USE_REAL_FILCDN === "true",
    minReputation: parseInt(
      process.env.NEXT_PUBLIC_FILCDN_MIN_REPUTATION || "100"
    ),
  },
};

// Provider props interface
interface FilCDNProviderProps {
  children: ReactNode;
}

export const FilCDNProvider: React.FC<FilCDNProviderProps> = ({ children }) => {
  const [filcdn, setFilcdn] = useState<FilCDNService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  // Initialize FilCDN service
  const initializeFilCDN = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Get private key from environment
      // Create and initialize FilCDN service using the adapter
      // Private key is now handled securely on the server side
      const filcdnService = createFilCDNAdapter({
        rpcURL: env.filcdn.rpcUrl,
        withCDN: true,
        useReal: env.filcdn.useReal,
      });

      await filcdnService.initialize();

      setFilcdn(filcdnService);
      setIsInitialized(true);

      // Get initial stats
      const serviceStats = await filcdnService.getStats();
      setStats(serviceStats);

      console.log("✅ FilCDN initialized successfully", serviceStats);
    } catch (err: any) {
      console.error("❌ Failed to initialize FilCDN:", err);
      setError(`Failed to initialize FilCDN: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // Re-initialize FilCDN
  const reInitialize = async () => {
    setIsInitialized(false);
    setFilcdn(null);
    await initializeFilCDN();
  };

  // Initialize FilCDN on component mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initializeFilCDN();
    }
  }, [isInitialized, isInitializing]);

  // Store data in FilCDN
  const storeData = async (data: any): Promise<StorageResult> => {
    if (!filcdn || !isInitialized) {
      throw new Error("FilCDN not initialized");
    }

    try {
      return await filcdn.storeData(data);
    } catch (err: any) {
      setError(`Failed to store data: ${err.message}`);
      throw err;
    }
  };

  // Retrieve data from FilCDN
  const retrieveData = async (cid: string): Promise<RetrievalResult> => {
    if (!filcdn) {
      throw new Error("FilCDN not initialized");
    }

    try {
      return await filcdn.retrieveData(cid);
    } catch (err: any) {
      setError(`Failed to retrieve data: ${err.message}`);
      throw err;
    }
  };

  // Get CDN URL for a CID
  const getCDNUrl = async (cid: string): Promise<string> => {
    if (!filcdn) {
      throw new Error("FilCDN not initialized");
    }

    try {
      return await filcdn.getCDNUrl(cid);
    } catch (err: any) {
      setError(`Failed to get CDN URL: ${err.message}`);
      throw err;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Refresh stats periodically
  useEffect(() => {
    if (!filcdn || !isInitialized) return;

    const fetchStats = async () => {
      try {
        const serviceStats = await filcdn.getStats();
        setStats(serviceStats);
      } catch (err) {
        console.warn("Failed to fetch FilCDN stats:", err);
      }
    };

    // Fetch stats immediately and then every 30 seconds
    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [filcdn, isInitialized]);

  // Provide context value
  const contextValue: FilCDNContextState = {
    filcdn,
    isInitialized,
    isInitializing,
    error,
    stats,
    storeData,
    retrieveData,
    getCDNUrl,
    clearError,
    reInitialize,
  };

  return (
    <FilCDNContext.Provider value={contextValue}>
      {children}
    </FilCDNContext.Provider>
  );
};

// Custom hook for using FilCDN context
export const useFilCDN = () => {
  const context = useContext(FilCDNContext);
  if (context === undefined) {
    throw new Error("useFilCDN must be used within a FilCDNProvider");
  }
  return context;
};
