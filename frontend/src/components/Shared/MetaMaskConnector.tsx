import React, { useState, useEffect } from 'react';
import { useSDK } from '@metamask/sdk-react';

interface MetaMaskConnectorProps {
  onConnect: (address: string, provider: any) => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
}

export const MetaMaskConnector: React.FC<MetaMaskConnectorProps> = ({
  onConnect,
  onDisconnect,
  onError,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string>('');

  const { sdk, connected, connecting, provider, chainId } = useSDK();

  useEffect(() => {
    if (connected && provider) {
      const accounts = provider.selectedAddress || provider.getSelectedAddress?.();
      if (accounts) {
        setAccount(accounts);
        setIsConnected(true);
        onConnect(accounts, provider);
      }
    } else {
      setIsConnected(false);
      setAccount('');
    }
  }, [connected, provider, onConnect]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      if (!sdk) {
        throw new Error('MetaMask SDK not initialized');
      }

      const accounts = await sdk.connect();
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        onConnect(accounts[0], provider);
      } else {
        throw new Error('No accounts found');
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      onError(error.message || 'Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (sdk) {
        await sdk.disconnect();
      }
      setIsConnected(false);
      setAccount('');
      onDisconnect();
    } catch (error: any) {
      console.error('MetaMask disconnect error:', error);
      onError(error.message || 'Failed to disconnect from MetaMask');
    }
  };

  const switchToMantleSepolia = async () => {
    try {
      if (!provider) {
        throw new Error('MetaMask not connected');
      }

      const mantleSepoliaConfig = {
        chainId: '0x138b', // 5003 in hex
        chainName: 'Mantle Sepolia Testnet',
        nativeCurrency: {
          name: 'MNT',
          symbol: 'MNT',
          decimals: 18,
        },
        rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
        blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz'],
      };

      // Try to switch to the network
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: mantleSepoliaConfig.chainId }],
        });
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [mantleSepoliaConfig],
          });
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error('Network switch error:', error);
      onError(error.message || 'Failed to switch network');
      return false;
    }
    return true;
  };

  if (isConnected) {
    return (
      <div className="metamask-wallet-info">
        <div className="wallet-address">
          <strong>MetaMask:</strong> {account.slice(0, 6)}...{account.slice(-4)}
        </div>
        <div className="wallet-actions">
          <button onClick={switchToMantleSepolia} className="switch-network-btn">
            Switch to Mantle Sepolia
          </button>
          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect MetaMask
          </button>
        </div>
        <div className="chain-info">
          Chain ID: {chainId || 'Unknown'}
        </div>
      </div>
    );
  }

  return (
    <div className="metamask-connector">
      <button
        onClick={connectWallet}
        disabled={isConnecting || connecting}
        className="connect-metamask-btn"
      >
        {isConnecting || connecting ? 'Connecting...' : 'Connect with MetaMask'}
      </button>
    </div>
  );
};

export default MetaMaskConnector;