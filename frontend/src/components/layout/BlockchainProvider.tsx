"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  TransactionMonitor,
  useTransactionMonitor,
} from "../transactions/TransactionMonitor";
import { Transaction } from "@/services/blockchain/types";

// Create a context for blockchain transaction tracking
interface BlockchainContextType {
  addTransaction: (
    transaction: Transaction,
    title: string,
    message: string
  ) => string;
  updateTransaction: (id: string, updates: any) => void;
  dismissTransaction: (id: string) => void;
  viewOnExplorer: (hash: string, chainId: number) => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(
  undefined
);

// Hook to access the blockchain context
export function useBlockchainMonitor() {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error(
      "useBlockchainMonitor must be used within a BlockchainProvider"
    );
  }
  return context;
}

interface BlockchainProviderProps {
  children: ReactNode;
}

export function BlockchainProvider({ children }: BlockchainProviderProps) {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    dismissTransaction,
    viewOnExplorer,
  } = useTransactionMonitor();

  return (
    <BlockchainContext.Provider
      value={{
        addTransaction,
        updateTransaction,
        dismissTransaction,
        viewOnExplorer,
      }}
    >
      {children}
      <TransactionMonitor
        transactions={transactions}
        onDismiss={dismissTransaction}
        onViewExplorer={viewOnExplorer}
      />
    </BlockchainContext.Provider>
  );
}

export default BlockchainProvider;
