"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface TippedPerformer {
  id: string;
  type: string;
  genres: string[];
}

interface ImpactContextType {
  totalTips: number;
  totalBounties: number;
  tippedPerformers: TippedPerformer[];
  impactMessage: string | null;
  showImpact: (message: string) => void;
  updateImpactStats: (tips: number, bounties: number) => void;
  addTippedPerformer: (performer: TippedPerformer) => void;
}

const ImpactContext = createContext<ImpactContextType | undefined>(undefined);

export function ImpactProvider({ children }: { children: ReactNode }) {
  const [totalTips, setTotalTips] = useState<number>(0);
  const [totalBounties, setTotalBounties] = useState<number>(0);
  const [tippedPerformers, setTippedPerformers] = useState<TippedPerformer[]>([]);
  const [impactMessage, setImpactMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load tipped performers from localStorage on mount
    const storedTippedPerformers = localStorage.getItem('tippedPerformers');
    if (storedTippedPerformers) {
      setTippedPerformers(JSON.parse(storedTippedPerformers));
    }
  }, []);

  const showImpact = (message: string) => {
    setImpactMessage(message);
  };

  const updateImpactStats = (tips: number, bounties: number) => {
    setTotalTips(tips);
    setTotalBounties(bounties);
  };

  const addTippedPerformer = (performer: TippedPerformer) => {
    setTippedPerformers((prev) => {
      const newPerformers = [...prev, performer];
      localStorage.setItem('tippedPerformers', JSON.stringify(newPerformers));
      return newPerformers;
    });
  };

  useEffect(() => {
    if (impactMessage) {
      const timer = setTimeout(() => setImpactMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [impactMessage]);

  return (
    <ImpactContext.Provider value={{
      totalTips,
      totalBounties,
      tippedPerformers,
      impactMessage,
      showImpact,
      updateImpactStats,
      addTippedPerformer,
    }}>
      {children}
    </ImpactContext.Provider>
  );
}

export function useImpact() {
  const context = useContext(ImpactContext);
  if (!context) {
    throw new Error("useImpact must be used within ImpactProvider");
  }
  return context;
}
