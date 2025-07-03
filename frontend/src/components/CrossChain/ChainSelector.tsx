import React, { useState, useEffect } from 'react';
import { lifiService } from '../../services/lifiService';
import './crossChainTransfer.css';

interface ChainData {
  id: number;
  name: string;
  logoUrl?: string;
  isTestnet?: boolean;
}

// Known chain data mapping
const CHAIN_DATA: Record<number, ChainData> = {
  1: { id: 1, name: 'Ethereum', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg' },
  5: { id: 5, name: 'Goerli', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg', isTestnet: true },
  137: { id: 137, name: 'Polygon', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg' },
  80001: { id: 80001, name: 'Mumbai', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg', isTestnet: true },
  42161: { id: 42161, name: 'Arbitrum', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg' },
  421613: { id: 421613, name: 'Arbitrum Goerli', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg', isTestnet: true },
  10: { id: 10, name: 'Optimism', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg' },
  420: { id: 420, name: 'Optimism Goerli', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg', isTestnet: true },
  8453: { id: 8453, name: 'Base', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg' },
  84531: { id: 84531, name: 'Base Goerli', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg', isTestnet: true },
  5000: { id: 5000, name: 'Mantle', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_mantle.jpg' },
  5001: { id: 5001, name: 'Mantle Testnet', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_mantle.jpg', isTestnet: true },
  5003: { id: 5003, name: 'Mantle Sepolia', logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_mantle.jpg', isTestnet: true },
};

export interface ChainSelectorProps {
  label?: string;
  value: number | null;
  onChange: (chainId: number) => void;
  showTestnets?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  filterFn?: (chainData: ChainData) => boolean;
}

/**
 * ChainSelector Component
 * 
 * A reusable dropdown component for selecting blockchain networks.
 * It can be configured to show/hide testnets and apply custom filters.
 */
export const ChainSelector: React.FC<ChainSelectorProps> = ({
  label,
  value,
  onChange,
  showTestnets = false,
  disabled = false,
  placeholder = 'Select Chain',
  className = '',
  filterFn,
}) => {
  const [supportedChains, setSupportedChains] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load supported chains from LifiService
  useEffect(() => {
    const loadChains = async () => {
      try {
        setLoading(true);
        setError('');
        const chains = await lifiService.getSupportedChains();
        setSupportedChains(chains);
      } catch (err) {
        setError('Failed to load chains');
        console.error('Error loading chains:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChains();
  }, []);

  // Filter chains based on showTestnets flag and custom filterFn
  const filteredChains = supportedChains.filter(chainId => {
    const chainData = CHAIN_DATA[chainId] || { id: chainId, name: `Chain ${chainId}`, isTestnet: false };
    
    // Skip testnets if not showing them
    if (!showTestnets && chainData.isTestnet) {
      return false;
    }
    
    // Apply custom filter if provided
    if (filterFn && !filterFn(chainData)) {
      return false;
    }
    
    return true;
  });

  // Get human-readable chain name
  const getChainName = (chainId: number): string => {
    const chainData = CHAIN_DATA[chainId];
    return chainData ? chainData.name : `Chain ${chainId}`;
  };

  return (
    <div className={`chain-selector ${className}`}>
      {label && <label>{label}</label>}
      
      <div className="select-container">
        <select
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled || loading}
        >
          <option value="">{placeholder}</option>
          
          {filteredChains.map(chainId => (
            <option key={chainId} value={chainId}>
              {getChainName(chainId)} {CHAIN_DATA[chainId]?.isTestnet ? '(Testnet)' : ''}
            </option>
          ))}
        </select>
        
        {loading && <div className="loading-indicator">Loading...</div>}
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ChainSelector;