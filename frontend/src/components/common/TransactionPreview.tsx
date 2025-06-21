import React from 'react';
import './TransactionPreview.css';

interface TransactionPreviewProps {
  amountUSD?: number;
  amountMNT?: number;
  platformFeePct?: number;
  gasEstimateUSD?: number;
  networkName?: string;
  showBreakdown?: boolean;
  className?: string;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({
  amountUSD,
  amountMNT,
  platformFeePct = 5,
  gasEstimateUSD = 0.01,
  networkName = 'Mantle Sepolia',
  showBreakdown = true,
  className = ''
}) => {
  const isMNT = amountMNT !== undefined;
  const amount = isMNT ? amountMNT : amountUSD || 0;
  const currency = isMNT ? 'MNT' : 'USD';

  const platformFee = amount * (platformFeePct / 100);
  const recipientAmount = amount - platformFee;
  // Note: Gas is still estimated in USD for simplicity. A real app would use an oracle.
  const totalCost = amount + (isMNT ? 0 : gasEstimateUSD); 

  return (
    <div className={`transaction-preview ${className}`}>
      <div className="preview-header">
        <h3 className="preview-title">Transaction Summary</h3>
        <div className="network-badge">
          <span className="network-dot"></span>
          {networkName}
        </div>
      </div>

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
                <span className="fee-badge">Ultra-low</span>
              </span>
              <span className="breakdown-value">
                ~${gasEstimateUSD.toFixed(3)} USD
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
        </div>
      </div>
    </div>
  );
};

export default TransactionPreview;
