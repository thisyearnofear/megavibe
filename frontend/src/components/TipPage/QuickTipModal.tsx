import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { useWallet } from '../../contexts/WalletContext';
import { USDCService } from '../../services/usdcService';
import contractService from '../../services/contractService';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import './QuickTipModal.css';

interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  walletAddress?: string;
}

interface Event {
  id: string;
  name: string;
}

interface QuickTipModalProps {
  speaker: Speaker;
  event: Event;
  initialAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];
const MESSAGE_SUGGESTIONS = [
  "Great insights! 🎯",
  "Thanks for the knowledge! 🧠", 
  "Loved your presentation! 👏",
  "Keep up the great work! 🚀",
  "Inspiring talk! ✨"
];

export const QuickTipModal: React.FC<QuickTipModalProps> = ({
  speaker,
  event,
  initialAmount,
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  // State
  const [amount, setAmount] = useState(initialAmount);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input');
  const [txHash, setTxHash] = useState<string>('');

  // Hooks
  const { isConnected, chainId, address } = useWallet();

  // Load USDC balance
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && chainId && address) {
        try {
          const balance = await contractService.getUsdcBalance();
          setUsdcBalance(balance);
        } catch (error) {
          console.error('Failed to load USDC balance:', error);
          setUsdcBalance('0');
        }
      }
    };

    if (isOpen) {
      loadBalance();
    }
  }, [isConnected, chainId, address, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setMessage('');
      setStep('input');
      setTxHash('');
      setIsProcessing(false);
    }
  }, [isOpen, initialAmount]);

  // Validation
  const isValidAmount = amount > 0 && amount <= 500;
  const hasEnoughBalance = parseFloat(usdcBalance) >= amount;
  const canProceed = isValidAmount && hasEnoughBalance && isConnected;

  // Handlers
  const handleAmountChange = useCallback((value: string) => {
    const numValue = parseFloat(value) || 0;
    setAmount(Math.min(Math.max(numValue, 0), 500));
  }, []);

  const handleMessageSelect = useCallback((selectedMessage: string) => {
    setMessage(selectedMessage);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!canProceed) return;
    setStep('confirm');
  }, [canProceed]);

  const handleSendTip = useCallback(async () => {
    if (!speaker.walletAddress || !canProceed) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      const txHash = await contractService.tipSpeaker(
        speaker.walletAddress,
        amount.toString(),
        message.trim(),
        event.id,
        speaker.id
      );

      setTxHash(txHash);
      setStep('success');

      // Auto-close after success
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error: any) {
      console.error('Tip failed:', error);
      onError(error.message || 'Failed to send tip. Please try again.');
      setStep('confirm'); // Go back to confirm step
    } finally {
      setIsProcessing(false);
    }
  }, [speaker.walletAddress, amount, message, event.id, speaker.id, canProceed, onSuccess, onError]);

  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('input');
    }
  }, [step]);

  // Calculate fees
  const platformFee = amount * 0.05; // 5%
  const netAmount = amount - platformFee;
  const gasEstimate = 0.01; // ~$0.01 on Mantle

  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <div className="tip-input-step">
            {/* Amount Selection */}
            <div className="amount-section">
              <h4>💰 Tip Amount</h4>
              <div className="preset-amounts">
                {PRESET_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    className={`preset-btn ${amount === preset ? 'active' : ''}`}
                    onClick={() => setAmount(preset)}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
              <div className="custom-amount">
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Custom amount"
                  min="1"
                  max="500"
                  step="0.01"
                />
                <span className="currency">USDC</span>
              </div>
              {!isValidAmount && amount > 0 && (
                <p className="error-text">Amount must be between $1 and $500</p>
              )}
              {!hasEnoughBalance && amount > 0 && (
                <p className="error-text">Insufficient USDC balance</p>
              )}
            </div>

            {/* Message Section */}
            <div className="message-section">
              <h4>💬 Message (Optional)</h4>
              <div className="message-suggestions">
                {MESSAGE_SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    className={`suggestion-btn ${message === suggestion ? 'active' : ''}`}
                    onClick={() => handleMessageSelect(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                maxLength={200}
                rows={3}
              />
              <div className="char-count">{message.length}/200</div>
            </div>

            {/* Balance Info */}
            {isConnected && (
              <div className="balance-info">
                <div className="balance-row">
                  <span>Your USDC Balance:</span>
                  <span>{parseFloat(usdcBalance).toFixed(2)} USDC</span>
                </div>
                <div className="balance-row">
                  <span>Network:</span>
                  <span>{chainId ? USDCService.getChainInfo(chainId).name : 'Unknown'}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'confirm':
        return (
          <div className="tip-confirm-step">
            <h4>✅ Confirm Your Tip</h4>
            
            <div className="tip-summary">
              <div className="summary-row">
                <span>Tip Amount:</span>
                <span>${amount.toFixed(2)} USDC</span>
              </div>
              <div className="summary-row fee">
                <span>Platform Fee (5%):</span>
                <span>-${platformFee.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Gas Fee (est.):</span>
                <span>~$0.01</span>
              </div>
              <div className="summary-row total">
                <span>Speaker Receives:</span>
                <span>${netAmount.toFixed(2)} USDC</span>
              </div>
            </div>

            {message && (
              <div className="message-preview">
                <h5>Your Message:</h5>
                <p>"{message}"</p>
              </div>
            )}

            <div className="recipient-info">
              <h5>Recipient:</h5>
              <p>{speaker.name} at {event.name}</p>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="tip-processing-step">
            <LoadingSpinner size="lg" />
            <h4>Sending Your Tip...</h4>
            <p>Please confirm the transaction in your wallet</p>
            <div className="processing-details">
              <div>Amount: ${amount.toFixed(2)} USDC</div>
              <div>To: {speaker.name}</div>
              {message && <div>Message: "{message}"</div>}
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="tip-success-step">
            <div className="success-icon">🎉</div>
            <h4>Tip Sent Successfully!</h4>
            <p>
              Your ${amount.toFixed(2)} tip to {speaker.name} has been confirmed!
            </p>
            {txHash && (
              <div className="transaction-link">
                <a
                  href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-tx-btn"
                >
                  View Transaction →
                </a>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getFooterButtons = () => {
    switch (step) {
      case 'input':
        return (
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!canProceed}
          >
            Review Tip
          </button>
        );

      case 'confirm':
        return (
          <>
            <button
              className="btn btn-outline"
              onClick={handleBack}
              disabled={isProcessing}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSendTip}
              disabled={isProcessing}
            >
              {isProcessing ? 'Sending...' : `Send $${amount} Tip`}
            </button>
          </>
        );

      case 'processing':
        return null;

      case 'success':
        return (
          <button
            className="btn btn-primary"
            onClick={onSuccess}
          >
            Done
          </button>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case 'input': return `Tip ${speaker.name}`;
      case 'confirm': return 'Confirm Tip';
      case 'processing': return 'Sending Tip...';
      case 'success': return 'Success!';
      default: return 'Tip Speaker';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={getModalTitle()}
      onClose={onClose}
      footer={getFooterButtons()}
      size="medium"
      className="quick-tip-modal"
    >
      {/* Speaker Info */}
      <div className="speaker-header">
        <div className="speaker-avatar">
          {speaker.avatar ? (
            <img src={speaker.avatar} alt={speaker.name} />
          ) : (
            <div className="avatar-placeholder">
              {speaker.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="speaker-details">
          <h3>{speaker.name}</h3>
          {speaker.title && <p>{speaker.title}</p>}
          <p className="event-name">at {event.name}</p>
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </Modal>
  );
};

export default QuickTipModal;