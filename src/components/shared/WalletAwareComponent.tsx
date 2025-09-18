"use client";

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

interface WalletAwareComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Create a wrapper that only renders on client side
const WalletAwareWrapper: ComponentType<WalletAwareComponentProps> = ({ 
  children, 
  fallback = <div>Loading...</div> 
}) => {
  return <>{children}</>;
};

// Export as dynamic component with SSR disabled
export const WalletAwareComponent = dynamic(
  () => Promise.resolve(WalletAwareWrapper),
  {
    ssr: false,
    loading: () => <div>Loading wallet features...</div>
  }
);

export default WalletAwareComponent;