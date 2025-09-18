"use client";

import { useEffect, useState } from "react";
import { Web3ModalProvider } from "@/config/web3modal";

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
