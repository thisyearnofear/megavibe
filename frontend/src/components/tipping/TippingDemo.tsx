/**
 * TippingDemo.tsx
 * 
 * A demo component that showcases the tipping functionality
 * using our service layer and hooks.
 */

import React, { useState, useEffect } from 'react';
import { useTipping } from '../../hooks/useTipping';
import QuickTipModal from './QuickTipModal';
import './TippingDemo.css';

const TippingDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  
  // Use our tipping hook
  const {
    tipHistory,
    pendingTips,
    statistics,
    loadTipHistory,
    isProcessing,
    error
  } = useTipping();
  
  // Sample recipients for demo
  const sampleRecipients = [
    {
      id: '1',
      name: 'Vitalik Buterin',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      image: 'https://i.imgur.com/gNpHLMO.jpg'
    },
    {
      id: '2',
      name: 'Juan Benet',
      address: '0x5a7Ed99f38d4F8Df5a6182D56594A1C64d970983',
      image: 'https://i.imgur.com/GHZ4a0j.jpg'
    },
    {
      id: '3',
      name: 'Sergey Nazarov',
      address: '0x9A5942D8D6337A0B31F4Dad91A15D5aE6b8fAa8E',
      image: 'https://i.imgur.com/NZjVBBF.jpg'
    }
  ];
  
  // Load tip history on component mount
  useEffect(() => {
    loadTipHistory();
  }, [loadTipHistory]);
  
  // Open modal with selected recipient
  const handleTipClick = (recipientAddress: string) => {
    setSelectedRecipient(recipientAddress);
    setIsModalOpen(true);
  };
  
  return (
    <div className="tipping-demo">
      <h1>MegaVibe Tipping Demo</h1>
      
      {error && <div className="error-banner">{error}</div>}
      
      <div className="tipping-stats">
        <div className="stat-card">
          <h3>Total Sent</h3>
          <p className="stat-value">{statistics?.totalSent || 0} <span className="currency">USDC</span></p>
        </div>
        <div className="stat-card">
          <h3>Total Received</h3>
          <p className="stat-value">{statistics?.totalReceived || 0} <span className="currency">USDC</span></p>
        </div>
      </div>
      
      <div className="section-container">
        <div className="section speakers-section">
          <h2>Speakers</h2>
          <div className="speakers-list">
            {sampleRecipients.map(recipient => (
              <div className="speaker-card" key={recipient.id}>
                <img src={recipient.image} alt={recipient.name} className="speaker-image" />
                <h3>{recipient.name}</h3>
                <p className="address">{`${recipient.address.substring(0, 6)}...${recipient.address.substring(recipient.address.length - 4)}`}</p>
                <button 
                  className="tip-button"
                  onClick={() => handleTipClick(recipient.address)}
                  disabled={isProcessing}
                >
                  Send Tip
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="section history-section">
          <h2>Tip History</h2>
          {tipHistory.length === 0 ? (
            <p className="empty-state">No tips sent yet. Send your first tip!</p>
          ) : (
            <div className="history-list">
              {tipHistory.map(tip => (
                <div className="history-item" key={tip.id}>
                  <div className="tip-info">
                    <span className="tip-amount">{tip.amount} USDC</span>
                    <span className="tip-recipient">To: {`${tip.recipientId.substring(0, 6)}...${tip.recipientId.substring(tip.recipientId.length - 4)}`}</span>
                    {tip.message && <span className="tip-message">"{tip.message}"</span>}
                  </div>
                  <div className="tip-meta">
                    <span className="tip-time">{new Date(tip.timestamp).toLocaleString()}</span>
                    <a 
                      href={`https://etherscan.io/tx/${tip.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View Transaction
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {pendingTips.length > 0 && (
        <div className="pending-tips-section">
          <h2>Pending Tips</h2>
          <div className="pending-list">
            {pendingTips.map(tip => (
              <div className={`pending-item status-${tip.status}`} key={tip.id}>
                <div className="pending-info">
                  <span className="pending-amount">{tip.amount} USDC</span>
                  <span className="pending-recipient">To: {`${tip.speakerId.substring(0, 6)}...${tip.speakerId.substring(tip.speakerId.length - 4)}`}</span>
                  <span className="pending-status">{tip.status}</span>
                </div>
                {tip.error && <div className="pending-error">{tip.error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tip Modal */}
      <QuickTipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipientAddress={selectedRecipient}
        eventId="eth-denver-2025" // Demo event ID
      />
    </div>
  );
};

export default TippingDemo;