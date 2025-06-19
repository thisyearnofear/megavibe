import React from 'react';
import './TransactionPreview.css';

interface TransactionPreviewProps {
  amountUSD: number;
  platformFeePct?: number;
  gasEstimateUSD?: number;
  currency?: string;
  networkName?: string;
  showBreakdown?: boolean;
  className?: string;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({
  amountUSD,
  platformFeePct = 5,
  gasEstimateUSD = 0.01,
  currency = 'USD',
  networkName = 'Mantle Sepolia',
  showBreakdown = true,
  className = ''
}) => {
  const platformFee = amountUSD * (platformFeePct / 100);
  const recipientAmount = amountUSD - platformFee;
  const totalCost = amountUSD + gasEstimateUSD;

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
                ${amountUSD.toFixed(2)} {currency}
              </span>
            </div>

            <div className="breakdown-item">
              <span className="breakdown-label">
                Platform Fee ({platformFeePct}%)
              </span>
              <span className="breakdown-value">
                ${platformFee.toFixed(2)} {currency}
              </span>
            </div>

            <div className="breakdown-item highlight">
              <span className="breakdown-label">Recipient Receives</span>
              <span className="breakdown-value">
                ${recipientAmount.toFixed(2)} {currency}
              </span>
            </div>

            <div className="breakdown-divider"></div>

            <div className="breakdown-item">
              <span className="breakdown-label">
                Network Fee
                <span className="fee-badge">Ultra-low</span>
              </span>
              <span className="breakdown-value">
                ~${gasEstimateUSD.toFixed(3)} {currency}
              </span>
            </div>
          </div>
        )}

        <div className="total-section">
          <div className="total-item">
            <span className="total-label">Total Cost</span>
            <span className="total-value">
              ${totalCost.toFixed(2)} {currency}
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

// Simplified version for tips specifically
export const TipSummary: React.FC<TransactionPreviewProps> = (props) => {
  return (
    <TransactionPreview
      {...props}
      className={`tip-summary ${props.className || ''}`}
    />
  );
};

export default TransactionPreview;
