"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

// Dynamically import the Web3ModalProvider to prevent SSR issues
const Web3ModalProvider = dynamic(
  () => import('@/config/web3modal').then(mod => ({ default: mod.Web3ModalProvider })),
  {
    ssr: false,
    loading: () => null,
  }
);

interface ClientOnlyWeb3ProviderProps {
  children: React.ReactNode;
}

export function ClientOnlyWeb3Provider({
  children,
}: ClientOnlyWeb3ProviderProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // Return children without Web3 provider during SSR
    return <>{children}</>;
  }

  // Only render Web3 provider on client side
  return <Web3ModalProvider>{children}</Web3ModalProvider>;
}
