import React, { useState, useEffect, useCallback } from 'react';
import { ChainId } from '@lifi/sdk';
import { 
  lifiService, 
  SUPPORTED_CHAINS, 
  CrossChainTipQuote, 
  TipExecutionProgress,
  formatUSDC,
  parseUSDC,
  getChainName,
  getChainIcon
} from '../../services/lifiService';
import { useWallet } from '../../contexts/WalletContext';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import './CrossChainTipForm.css';

interface CrossChainTipFormProps {
  speakerAddress: string;
  speakerName: string;
  eventId: string;
  speakerId: string;
  onTipSuccess?: (tipData: any) => void;
  onClose?: () => void;
}

export const CrossChainTipForm: React.FC<CrossChainTipFormProps> = ({
  speakerAddress,
  speakerName,
  eventId,
  speakerId,
  onTipSuccess,
  onClose
}) => {
  const { address: userAddress, isConnected } = useWallet();
  
  // Form state
  const [fromChain, setFromChain] = useState<ChainId>(ChainId.ETH);
  const [toChain, setToChain] = useState<ChainId>(ChainId.ARB);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  // Quote and execution state
  const [quote, setQuote] = useState<CrossChainTipQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<TipExecutionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-fetch quote when parameters change
  useEffect(() => {
    if (amount && fromChain && toChain && fromChain !== toChain && userAddress) {
      const debounceTimer = setTimeout(() => {
        fetchQuote();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setQuote(null);
    }
  }, [amount, fromChain, toChain, userAddress]);

  const fetchQuote = async () => {
    if (!amount || !userAddress || fromChain === toChain) return;
    
    setIsLoadingQuote(true);
    setError(null);
    
    try {
      const amountInWei = parseUSDC(amount);
      const quoteResult = await lifiService.getCrossChainTipQuote({
        fromChain,
        toChain,
        amount: amountInWei,
        fromAddress: userAddress,
        toAddress: speakerAddress,
        eventId,
        speakerId,
        message,
      });
      
      setQuote(quoteResult);
    } catch (err: any) {
      console.error('Failed to get quote:', err);
      setError(err.message || 'Failed to get quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const executeTip = async () => {
    if (!quote || !userAddress) return;
    
    setIsExecuting(true);
    setError(null);
    setExecutionProgress({
      status: 'pending',
      currentStep: 0,
      totalSteps: 1,
    });
    
    try {
      const tipId = await lifiService.executeCrossChainTip(
        quote,
        {
          fromChain,
          toChain,
          amount: parseUSDC(amount),
          fromAddress: userAddress,
          toAddress: speakerAddress,
          eventId,
          speakerId,
          message,
        },
        (progress) => {
          setExecutionProgress(progress);
        }
      );
      
      // Success! Call callback and show success state
      if (onTipSuccess) {
        onTipSuccess({
          tipId,
          amount: parseFloat(amount),
          fromChain,
          toChain,
          speakerName,
          message,
        });
      }
      
      // Reset form
      setAmount('');
      setMessage('');
      setQuote(null);
      
    } catch (err: any) {
      console.error('Failed to execute tip:', err);
      setError(err.message || 'Failed to execute tip');
    } finally {
      setIsExecuting(false);
      setExecutionProgress(null);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const getEstimatedCosts = () => {
    if (!quote) return null;
    
    const grossAmount = parseFloat(formatUSDC(quote.fromAmount));
    const netAmount = parseFloat(formatUSDC(quote.toAmount));
    const totalFees = grossAmount - netAmount;
    
    return {
      grossAmount,
      netAmount,
      totalFees,
      platformFee: parseFloat(formatUSDC(quote.fees.platform)),
      gasFee: parseFloat(formatUSDC(quote.fees.gas)),
      bridgeFee: parseFloat(formatUSDC(quote.fees.bridge)),
    };
  };

  const costs = getEstimatedCosts();

  if (!isConnected) {
    return (
      <div className="cross-chain-tip-form">
        <div className="connect-wallet-prompt">
          <h3>🔗 Connect Wallet</h3>
          <p>Please connect your wallet to send cross-chain tips</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cross-chain-tip-form">
      <div className="form-header">
        <h3>🌉 Cross-Chain Tip</h3>
        <p>Tip <strong>{speakerName}</strong> from any chain to any chain!</p>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="chain-selection">
        <div className="chain-selector">
          <label>From Chain:</label>
          <select 
            value={fromChain} 
            onChange={(e) => setFromChain(Number(e.target.value) as ChainId)}
            disabled={isExecuting}
          >
            {SUPPORTED_CHAINS.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.icon} {chain.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="chain-arrow">
          <span>→</span>
        </div>
        
        <div className="chain-selector">
          <label>To Chain:</label>
          <select 
            value={toChain} 
            onChange={(e) => setToChain(Number(e.target.value) as ChainId)}
            disabled={isExecuting}
          >
            {SUPPORTED_CHAINS.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.icon} {chain.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {fromChain === toChain && (
        <div className="warning-message">
          ⚠️ Please select different chains for cross-chain tipping
        </div>
      )}

      <div className="amount-input">
        <label>Amount (USDC):</label>
        <div className="input-group">
          <input
            type="text"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="10.00"
            disabled={isExecuting}
          />
          <span className="currency-label">USDC</span>
        </div>
        <div className="quick-amounts">
          {[5, 10, 25, 50].map(quickAmount => (
            <button
              key={quickAmount}
              onClick={() => setAmount(quickAmount.toString())}
              className="quick-amount-btn"
              disabled={isExecuting}
            >
              ${quickAmount}
            </button>
          ))}
        </div>
      </div>

      <div className="message-input">
        <label>Message (optional):</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Great presentation! 👏"
          maxLength={200}
          disabled={isExecuting}
        />
        <div className="char-count">{message.length}/200</div>
      </div>

      {isLoadingQuote && (
        <div className="quote-loading">
          <LoadingSpinner size="sm" />
          <span>Getting best route...</span>
        </div>
      )}

      {quote && costs && (
        <div className="quote-display">
          <h4>💰 Quote Summary</h4>
          <div className="quote-details">
            <div className="quote-row">
              <span>You send:</span>
              <span>{costs.grossAmount.toFixed(2)} USDC on {getChainName(fromChain)}</span>
            </div>
            <div className="quote-row">
              <span>Speaker receives:</span>
              <span>{costs.netAmount.toFixed(2)} USDC on {getChainName(toChain)}</span>
            </div>
            <div className="quote-row fees">
              <span>Total fees:</span>
              <span>${costs.totalFees.toFixed(4)}</span>
            </div>
            <div className="fee-breakdown">
              <div className="fee-item">
                <span>• Platform fee (5%):</span>
                <span>${costs.platformFee.toFixed(4)}</span>
              </div>
              <div className="fee-item">
                <span>• Gas fee:</span>
                <span>${costs.gasFee.toFixed(4)}</span>
              </div>
              <div className="fee-item">
                <span>• Bridge fee:</span>
                <span>${costs.bridgeFee.toFixed(4)}</span>
              </div>
            </div>
            <div className="quote-row">
              <span>Estimated time:</span>
              <span>{Math.ceil(quote.executionDuration / 60)} minutes</span>
            </div>
            <div className="reputation-boost">
              <span>🏆 Reputation boost:</span>
              <span>+{Math.floor(parseFloat(amount) * 10)} points</span>
            </div>
          </div>
        </div>
      )}

      {executionProgress && (
        <div className="execution-progress">
          <h4>🚀 Executing Cross-Chain Tip</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(executionProgress.currentStep / executionProgress.totalSteps) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            Step {executionProgress.currentStep} of {executionProgress.totalSteps}
          </div>
          {executionProgress.txHash && (
            <div className="tx-link">
              <a 
                href={executionProgress.explorerLink} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View transaction: {executionProgress.txHash.slice(0, 10)}...
              </a>
            </div>
          )}
          {executionProgress.status === 'completed' && (
            <div className="success-message">
              ✅ Cross-chain tip completed successfully!
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="form-actions">
        <button
          onClick={executeTip}
          disabled={!quote || isExecuting || isLoadingQuote || !amount}
          className="execute-tip-btn"
        >
          {isExecuting ? (
            <>
              <LoadingSpinner size="sm" />
              Executing...
            </>
          ) : (
            <>
              Send Cross-Chain Tip 🚀
              {costs && ` ($${costs.grossAmount.toFixed(2)})`}
            </>
          )}
        </button>
        
        {onClose && (
          <button onClick={onClose} className="cancel-btn" disabled={isExecuting}>
            Cancel
          </button>
        )}
      </div>

      <div className="powered-by">
        <span>Powered by</span>
        <div className="integration-logos">
          <span className="logo">LI.FI</span>
          <span className="logo">MetaMask</span>
          <span className="logo">USDC</span>
        </div>
      </div>
    </div>
  );
};
