import React, { useState } from 'react';
import { USDCService, CHAIN_INFO } from '../../services/usdcService';
import './ChainSelector.css';

interface ChainSelectorProps {
  selectedChainId: number | null;
  onChainSelect: (chainId: number) => void;
  label: string;
  excludeChainId?: number; // Exclude a specific chain (e.g., source chain when selecting destination)
  testnetOnly?: boolean; // Show only testnet chains for hackathon
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChainId,
  onChainSelect,
  label,
  excludeChainId,
  testnetOnly = true, // Default to testnet for hackathon
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableChains = USDCService.getSupportedChains()
    .filter(chainId => {
      if (excludeChainId && chainId === excludeChainId) return false;
      if (testnetOnly) {
        const chainInfo = USDCService.getChainInfo(chainId);
        return chainInfo.testnet;
      }
      return true;
    })
    .map(chainId => ({
      id: chainId,
      ...USDCService.getChainInfo(chainId),
    }));

  const selectedChain = selectedChainId ? USDCService.getChainInfo(selectedChainId) : null;

  const getChainIcon = (chainId: number): string => {
    const icons: Record<number, string> = {
      1: '🔷', // Ethereum
      42161: '🔵', // Arbitrum
      10: '🔴', // Optimism
      8453: '🔵', // Base
      59144: '🟢', // Linea
      11155111: '🔷', // Sepolia
      421614: '🔵', // Arbitrum Sepolia
      11155420: '🔴', // OP Sepolia
      84532: '🔵', // Base Sepolia
      59141: '🟢', // Linea Sepolia
      5003: '🟡', // Mantle Sepolia
      324: '⚪', // ZKsync Era Testnet
    };
    return icons[chainId] || '❓';
  };

  const handleChainSelect = (chainId: number) => {
    onChainSelect(chainId);
    setIsOpen(false);
  };

  return (
    <div className="chain-selector">
      <label className="chain-selector-label">{label}</label>
      
      <div className="chain-selector-dropdown">
        <button
          className={`chain-selector-button ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {selectedChain ? (
            <div className="selected-chain">
              <span className="chain-icon">{getChainIcon(selectedChainId!)}</span>
              <span className="chain-name">{selectedChain.name}</span>
              {selectedChain.testnet && <span className="testnet-badge">Testnet</span>}
            </div>
          ) : (
            <span className="placeholder">Select a chain</span>
          )}
          <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
        </button>

        {isOpen && (
          <div className="chain-selector-options">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                className={`chain-option ${selectedChainId === chain.id ? 'selected' : ''}`}
                onClick={() => handleChainSelect(chain.id)}
                type="button"
              >
                <span className="chain-icon">{getChainIcon(chain.id)}</span>
                <div className="chain-details">
                  <span className="chain-name">{chain.name}</span>
                  {chain.testnet && <span className="testnet-badge">Testnet</span>}
                </div>
                <span className="chain-symbol">{chain.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="chain-selector-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ChainSelector;