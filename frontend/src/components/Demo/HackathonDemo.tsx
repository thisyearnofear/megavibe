import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { USDCService } from '../../services/usdcService';
import { CrossChainTipForm } from '../CrossChain/CrossChainTipForm';
import { ChainSelector } from '../CrossChain/ChainSelector';
import { Modal } from '../common/Modal';
import './HackathonDemo.css';

interface HackathonDemoProps {
  onClose?: () => void;
}

export const HackathonDemo: React.FC<HackathonDemoProps> = ({ onClose }) => {
  const { address, isConnected, chainId } = useWallet();
  const [activeDemo, setActiveDemo] = useState<string>('overview');
  const [showTipModal, setShowTipModal] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');

  // Mock speaker data for demo
  const mockSpeaker = {
    id: 'speaker-1',
    name: 'Vitalik Buterin',
    title: 'Ethereum Co-founder',
    avatar: '🧑‍💻',
    walletAddress: '0x742d35Cc6634C0532925a3b8D0C9C0C8c8c8c8c8',
    currentTalk: 'The Future of Ethereum and Cross-Chain Interoperability',
    todayEarnings: 1250.75,
    tipCount: 47,
  };

  const mockEvent = {
    id: 'event-1',
    name: 'MetaMask Card Hackathon Demo',
  };

  useEffect(() => {
    if (isConnected && chainId && address) {
      loadUSDCBalance();
    }
  }, [isConnected, chainId, address]);

  const loadUSDCBalance = async () => {
    try {
      if (!chainId || !address) return;
      
      if (USDCService.isUSDCSupported(chainId)) {
        // For demo purposes, we'll show a mock balance
        setUsdcBalance('100.00');
      } else {
        setUsdcBalance('0');
      }
    } catch (error) {
      console.error('Failed to load USDC balance:', error);
      setUsdcBalance('0');
    }
  };

  const demoSections = [
    {
      id: 'overview',
      title: '🏆 Hackathon Overview',
      icon: '🎯',
    },
    {
      id: 'metamask',
      title: '🦊 MetaMask SDK',
      icon: '🔗',
    },
    {
      id: 'usdc',
      title: '💰 USDC Payments',
      icon: '💵',
    },
    {
      id: 'lifi',
      title: '🌉 LI.FI Cross-Chain',
      icon: '⚡',
    },
    {
      id: 'reputation',
      title: '⭐ On-Chain Reputation',
      icon: '📊',
    },
  ];

  const renderOverview = () => (
    <div className="demo-section">
      <h2>🏆 MetaMask Card Hackathon Submission</h2>
      <div className="prize-breakdown">
        <div className="prize-card primary">
          <h3>🎯 Primary Track</h3>
          <p><strong>Identity & OnChain Reputation</strong></p>
          <div className="prize-amount">$6,000</div>
        </div>
        <div className="bonus-prizes">
          <div className="prize-card bonus">
            <h4>🦊 MetaMask SDK</h4>
            <div className="prize-amount">$2,000</div>
          </div>
          <div className="prize-card bonus">
            <h4>💰 USDC Payments</h4>
            <div className="prize-amount">$2,000</div>
          </div>
          <div className="prize-card bonus">
            <h4>🌉 LI.FI Integration</h4>
            <div className="prize-amount">$2,000</div>
          </div>
        </div>
      </div>
      
      <div className="total-prize">
        <h3>Total Prize Potential: <span className="highlight">$12,000</span></h3>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <h4>🎭 Live Event Economy</h4>
          <p>Transform any live event into a collaborative content creation and monetization ecosystem</p>
        </div>
        <div className="feature-card">
          <h4>⚡ Cross-Chain Tipping</h4>
          <p>Tip speakers from any supported chain to any chain using USDC via LI.FI</p>
        </div>
        <div className="feature-card">
          <h4>📊 Behavioral Reputation</h4>
          <p>Real-world event attendance and engagement creates verifiable onchain reputation</p>
        </div>
        <div className="feature-card">
          <h4>🔗 MetaMask First</h4>
          <p>Wallet-first authentication with signature verification and advanced features</p>
        </div>
      </div>
    </div>
  );

  const renderMetaMaskDemo = () => (
    <div className="demo-section">
      <h2>🦊 MetaMask SDK Integration</h2>
      <div className="integration-status">
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span>Primary wallet authentication</span>
        </div>
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span>Signature-based verification</span>
        </div>
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span>Multi-chain network switching</span>
        </div>
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span>Mobile & desktop support</span>
        </div>
      </div>

      <div className="wallet-info">
        <h3>Current Wallet Status</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Connected:</label>
            <span className={isConnected ? 'connected' : 'disconnected'}>
              {isConnected ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="info-item">
            <label>Address:</label>
            <span className="address">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </span>
          </div>
          <div className="info-item">
            <label>Chain:</label>
            <span>
              {chainId ? USDCService.getChainInfo(chainId).name : 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUSDCDemo = () => (
    <div className="demo-section">
      <h2>💰 USDC Payment System</h2>
      <div className="usdc-overview">
        <div className="balance-card">
          <h3>Your USDC Balance</h3>
          <div className="balance-amount">{usdcBalance} USDC</div>
          <div className="balance-chain">
            {chainId ? `on ${USDCService.getChainInfo(chainId).name}` : ''}
          </div>
        </div>
      </div>

      <div className="supported-chains">
        <h3>Supported Chains</h3>
        <div className="chains-grid">
          {USDCService.getTestnetChains().map(chainId => {
            const chainInfo = USDCService.getChainInfo(chainId);
            return (
              <div key={chainId} className="chain-card">
                <div className="chain-name">{chainInfo.name}</div>
                <div className="chain-badge">
                  {chainInfo.testnet ? 'Testnet' : 'Mainnet'}
                </div>
                <div className="usdc-address">
                  {USDCService.getUSDCAddress(chainId).slice(0, 10)}...
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="demo-action">
        <button 
          className="demo-tip-btn"
          onClick={() => setShowTipModal(true)}
          disabled={!isConnected}
        >
          🎯 Demo Cross-Chain Tip
        </button>
      </div>
    </div>
  );

  const renderLiFiDemo = () => (
    <div className="demo-section">
      <h2>🌉 LI.FI Cross-Chain Integration</h2>
      <div className="lifi-features">
        <div className="feature-item">
          <h4>⚡ Optimal Routes</h4>
          <p>Automatically finds the best bridge and DEX routes for cross-chain USDC transfers</p>
        </div>
        <div className="feature-item">
          <h4>🔄 Real-time Quotes</h4>
          <p>Live pricing with fee breakdown and execution time estimates</p>
        </div>
        <div className="feature-item">
          <h4>📊 Progress Tracking</h4>
          <p>Step-by-step execution monitoring with transaction links</p>
        </div>
        <div className="feature-item">
          <h4>🛡️ Secure Bridging</h4>
          <p>Uses trusted bridge protocols with slippage protection</p>
        </div>
      </div>

      <div className="cross-chain-flow">
        <h3>Cross-Chain Tip Flow</h3>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Select Chains</h4>
              <p>Choose source and destination chains</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Get Quote</h4>
              <p>LI.FI finds optimal route</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Execute</h4>
              <p>Bridge USDC to speaker</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Reputation</h4>
              <p>Record cross-chain activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReputationDemo = () => (
    <div className="demo-section">
      <h2>⭐ On-Chain Reputation System</h2>
      <div className="reputation-overview">
        <div className="reputation-card">
          <h3>Your Reputation Score</h3>
          <div className="reputation-score">847</div>
          <div className="reputation-rank">Top 15% of attendees</div>
        </div>
      </div>

      <div className="reputation-factors">
        <h3>Reputation Factors</h3>
        <div className="factors-grid">
          <div className="factor-item">
            <div className="factor-icon">🎯</div>
            <div className="factor-content">
              <h4>Event Attendance</h4>
              <p>Verified presence at live events</p>
              <div className="factor-score">+150 points</div>
            </div>
          </div>
          <div className="factor-item">
            <div className="factor-icon">💰</div>
            <div className="factor-content">
              <h4>Speaker Tips</h4>
              <p>Supporting quality content creators</p>
              <div className="factor-score">+320 points</div>
            </div>
          </div>
          <div className="factor-item">
            <div className="factor-icon">🌉</div>
            <div className="factor-content">
              <h4>Cross-Chain Activity</h4>
              <p>Multi-chain engagement bonus</p>
              <div className="factor-score">+180 points</div>
            </div>
          </div>
          <div className="factor-item">
            <div className="factor-icon">🎭</div>
            <div className="factor-content">
              <h4>Content Creation</h4>
              <p>Bounty submissions and engagement</p>
              <div className="factor-score">+197 points</div>
            </div>
          </div>
        </div>
      </div>

      <div className="reputation-benefits">
        <h3>Reputation Benefits</h3>
        <div className="benefits-list">
          <div className="benefit-item">🎤 Priority speaking slots at events</div>
          <div className="benefit-item">🎫 VIP access to exclusive events</div>
          <div className="benefit-item">💎 Higher bounty rewards</div>
          <div className="benefit-item">🏆 Governance voting power</div>
          <div className="benefit-item">🎁 Exclusive NFT airdrops</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hackathon-demo">
      <div className="demo-header">
        <h1>🎭 MegaVibe Hackathon Demo</h1>
        <p>MetaMask Card Hackathon - Identity & OnChain Reputation Track</p>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="demo-navigation">
        {demoSections.map(section => (
          <button
            key={section.id}
            className={`nav-btn ${activeDemo === section.id ? 'active' : ''}`}
            onClick={() => setActiveDemo(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-title">{section.title}</span>
          </button>
        ))}
      </div>

      <div className="demo-content">
        {activeDemo === 'overview' && renderOverview()}
        {activeDemo === 'metamask' && renderMetaMaskDemo()}
        {activeDemo === 'usdc' && renderUSDCDemo()}
        {activeDemo === 'lifi' && renderLiFiDemo()}
        {activeDemo === 'reputation' && renderReputationDemo()}
      </div>

      {showTipModal && (
        <Modal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          title="🌉 Cross-Chain Tip Demo"
        >
          <CrossChainTipForm
            speakerAddress={mockSpeaker.walletAddress}
            speakerName={mockSpeaker.name}
            eventId={mockEvent.id}
            speakerId={mockSpeaker.id}
            onTipSuccess={() => {
              setShowTipModal(false);
              // Show success message
            }}
            onClose={() => setShowTipModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default HackathonDemo;