import React from 'react';
import './TransactionPreview.css';

export interface TransactionPreviewProps {
  amountUSD?: number;
  amountMNT?: number;
  platformFeePct?: number;
  gasEstimateUSD?: number;
  networkName?: string;
  showBreakdown?: boolean;
  className?: string;
  isCrossChain?: boolean;
  bridgeFeeUSD?: number;
  sourceChain?: string;
  targetChain?: string;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({
  amountUSD,
  amountMNT,
  platformFeePct = 5,
  gasEstimateUSD = 0.01,
  networkName = 'Mantle Sepolia',
  showBreakdown = true,
  className = '',
  isCrossChain = false,
  bridgeFeeUSD = 0,
  sourceChain,
  targetChain = 'Mantle Sepolia'
}) => {
  const isMNT = amountMNT !== undefined;
  const amount = isMNT ? amountMNT : amountUSD || 0;
  const currency = isMNT ? 'MNT' : 'USD';

  const platformFee = amount * (platformFeePct / 100);
  const recipientAmount = amount - platformFee;
  
  // Include bridge fee in total cost for cross-chain transactions
  const totalCost = amount + (isMNT ? 0 : gasEstimateUSD) + (isCrossChain ? bridgeFeeUSD : 0);

  return (
    <div className={`transaction-preview ${className}`}>
      <div className="preview-header">
        <h3 className="preview-title">Transaction Summary</h3>
        <div className="network-badge">
          <span className="network-dot"></span>
          {networkName}
          {isCrossChain && <span className="bridge-badge">→ {targetChain}</span>}
        </div>
      </div>

      {isCrossChain && (
        <div className="cross-chain-alert">
          <span className="alert-icon">🌉</span>
          <span>Cross-chain transfer via LI.FI Bridge</span>
        </div>
      )}

      <div className="preview-content">
        {showBreakdown && (
          <div className="breakdown-section">
            <div className="breakdown-item">
              <span className="breakdown-label">Amount</span>
              <span className="breakdown-value">
                {amount.toFixed(2)} {currency}
              </span>
            </div>

            <div className="breakdown-item">
              <span className="breakdown-label">
                Platform Fee ({platformFeePct}%)
              </span>
              <span className="breakdown-value">
                {platformFee.toFixed(2)} {currency}
              </span>
            </div>

            {isCrossChain && bridgeFeeUSD > 0 && (
              <div className="breakdown-item">
                <span className="breakdown-label">
                  Bridge Fee
                  <span className="bridge-fee-badge">LI.FI</span>
                </span>
                <span className="breakdown-value">
                  ~${bridgeFeeUSD.toFixed(2)} USD
                </span>
              </div>
            )}

            <div className="breakdown-item highlight">
              <span className="breakdown-label">Recipient Receives</span>
              <span className="breakdown-value">
                {recipientAmount.toFixed(2)} {currency}
              </span>
            </div>

            <div className="breakdown-divider"></div>

            <div className="breakdown-item">
              <span className="breakdown-label">
                Network Fee
                <span className="fee-badge">{isCrossChain ? 'Variable' : 'Ultra-low'}</span>
              </span>
              <span className="breakdown-value">
                ~${gasEstimateUSD.toFixed(isCrossChain ? 2 : 3)} USD
              </span>
            </div>
          </div>
        )}

        <div className="total-section">
          <div className="total-item">
            <span className="total-label">Total Cost</span>
            <span className="total-value">
              {totalCost.toFixed(2)} {currency}
              {!isMNT && <span> + Gas</span>}
            </span>
          </div>
        </div>

        <div className="preview-features">
          {isCrossChain ? (
            <>
              <div className="feature-item">
                <span className="feature-icon">🌉</span>
                <span className="feature-text">Cross-chain bridge</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⏱️</span>
                <span className="feature-text">5-15 minute settlement</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span className="feature-text">Secure LI.FI protocol</span>
              </div>
            </>
          ) : (
            <>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span className="feature-text">Instant settlement</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span className="feature-text">Secure on-chain</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💚</span>
                <span className="feature-text">Low carbon footprint</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionPreview;
