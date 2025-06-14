import React, { useState, useEffect } from 'react';
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useAccount, useDisconnect } from 'wagmi';
import styles from '../../styles/WalletConnector.module.css';

interface WalletConnectorProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  connectedAddress?: string;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({
  onConnect,
  onDisconnect,
  connectedAddress,
}) => {
  const { primaryWallet } = useDynamicContext();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      onConnect(address);
    } else if (!isConnected && connectedAddress) {
      onDisconnect();
    }
  }, [isConnected, address, connectedAddress, onConnect, onDisconnect]);

  const handleDisconnect = () => {
    disconnect();
    onDisconnect();
    setError(null);
  };

  return (
    <div className={styles.container}>
      {isConnected && address ? (
        <div className={styles.connected}>
          <span className={styles.address}>
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={handleDisconnect}
            className={styles.disconnectButton}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <DynamicWidget />
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
