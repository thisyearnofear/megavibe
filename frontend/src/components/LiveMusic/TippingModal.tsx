import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StepWizard } from '../common/StepWizard';
import { AmountSelector } from '../common/AmountSelector';
import { MessageComposer } from '../common/MessageComposer';
import { TransactionPreview } from '../common/TransactionPreview';
import { useWallet } from '../../contexts/WalletContext';
import { api } from '../../services/api';
import { walletService } from '../../services/walletService';
import ModalErrorBanner from '../common/ModalErrorBanner';
import './TippingModal.css';

interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  walletAddress?: string;
  currentTalk?: string;
  todayEarnings?: number;
  tipCount?: number;
}

interface Event {
  id: string;
  name: string;
}

interface TippingModalProps {
  speaker: Speaker;
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];
const MESSAGE_SUGGESTIONS = [
  "Great insights! 🎯",
  "Thanks for the knowledge! 🧠", 
  "Loved your presentation! 👏",
  "Keep up the great work! 🚀",
  "Inspiring talk! ✨",
  "Amazing content! 🔥"
];

const STEPS = [
  { key: 'amount', label: 'Amount', icon: '💰' },
  { key: 'message', label: 'Message', icon: '💬' },
  { key: 'confirm', label: 'Confirm', icon: '✅' },
  { key: 'processing', label: 'Processing', icon: '⏳' },
  { key: 'success', label: 'Success', icon: '🎉' }
];

export const TippingModal: React.FC<TippingModalProps> = ({
  speaker,
  event,
  onClose,
  onSuccess,
  isOpen
}) => {
  const [step, setStep] = useState<'amount' | 'message' | 'confirm' | 'processing' | 'success'>('amount');
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('0');

  const { isConnected, isWalletReady, formatBalance } = useWallet();

  // Load wallet balance
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected) {
        try {
          const balance = await walletService.getBalance();
          setWalletBalance(balance);
        } catch (error) {
          // Error already logged, nothing else needed
        }
      }
    };
    loadBalance();
  }, [isConnected]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount(10);
      setMessage('');
      setError(null);
      setTxHash('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const validateStep = (currentStep: string): boolean => {
    setError(null);

    switch (currentStep) {
      case 'amount':
        if (amount <= 0) {
          setError('Please select a valid amount');
          return false;
        }
        if (amount > 500) {
          setError('Maximum tip amount is $500');
          return false;
        }
        break;
      case 'message':
        // Message is optional, always valid
        break;
      case 'confirm':
        if (!isConnected || !isWalletReady()) {
          setError('Please connect your wallet to continue');
          return false;
        }
        if (!speaker.walletAddress) {
          setError('Speaker wallet address not found');
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(prev => {
      if (prev === 'amount') return 'message';
      if (prev === 'message') return 'confirm';
      // No further step, so do not return prev (unreachable)
    });
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => {
      if (prev === 'confirm') return 'message';
      if (prev === 'message') return 'amount';
      // No further step, so do not return prev (unreachable)
    });
  };

  const handleSubmit = async () => {
    if (!validateStep('confirm')) return;

    setIsProcessing(true);
    setStep('processing');
    setError(null);

    try {
      // Create tip record in backend
      const createResponse = await api.post('/api/tips/create', {
        speakerId: speaker.id,
        eventId: event.id,
        amountUSD: amount,
        message: message.trim(),
      });

      const { tipId, speakerWallet } = createResponse.data;

      // Convert USD to MNT
      const amountMNT = await walletService.convertUSDToMNT(amount);

      // Send transaction
      const txResult = await walletService.sendTip(
        speakerWallet,
        amountMNT,
        message.trim(),
        event.id,
        speaker.id
      );

      if (!txResult.success) {
        throw new Error('Transaction failed');
      }

      setTxHash(txResult.txHash);

      // Confirm tip in backend
      await api.post('/api/tips/confirm', {
        tipId: tipId,
        txHash: txResult.txHash,
        amountMNT: amountMNT,
        blockNumber: txResult.blockNumber,
        gasUsed: txResult.gasUsed,
      });

      setStep('success');

      // Auto-close after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);

    } catch (err: unknown) {
      console.error('Tip failed:', err);
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        'Failed to process tip. Please try again.'
      );
      setStep('confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case 'amount': return 'Select Tip Amount';
      case 'message': return 'Add a Message';
      case 'confirm': return 'Confirm Your Tip';
      case 'processing': return 'Sending Tip...';
      case 'success': return 'Tip Sent Successfully!';
      default: return 'Tip Speaker';
    }
  };

  const getFooterButtons = () => {
    switch (step) {
      case 'amount':
        return (
          <button 
            className="btn btn-primary"
            onClick={handleNext}
            disabled={amount <= 0}
          >
            Next: Add Message
          </button>
        );
      case 'message':
        return (
          <>
            <button className="btn btn-outline" onClick={handleBack}>
              Back
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
              Next: Review
            </button>
          </>
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
              onClick={handleSubmit}
              disabled={isProcessing || !isWalletReady()}
            >
              {isProcessing ? 'Processing...' : `Send $${amount} Tip`}
            </button>
          </>
        );
      default:
        return null;
    }
  };

  const completedSteps = () => {
    const completed = [];
    if (step !== 'amount') completed.push('amount');
    if (!['amount', 'message'].includes(step)) completed.push('message');
    if (['processing', 'success'].includes(step)) completed.push('confirm');
    if (step === 'success') completed.push('processing');
    return completed;
  };

  return (
    <Modal
      isOpen={isOpen}
      title={getModalTitle()}
      onClose={onClose}
      footer={getFooterButtons()}
      size="medium"
      className="tipping-modal"
    >
      {/* Step Progress */}
      <StepWizard 
        steps={STEPS.filter(s => s.key !== 'processing' || step === 'processing')}
        activeKey={step}
        completedKeys={completedSteps()}
      />

      {/* Speaker Spotlight */}
      <div className="speaker-spotlight">
        <div className="speaker-avatar">
          {speaker.avatar ? (
            <img src={speaker.avatar} alt={speaker.name} />
          ) : (
            <div className="avatar-placeholder">
              {speaker.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="speaker-info">
          <h3 className="speaker-name">{speaker.name}</h3>
          {speaker.title && <p className="speaker-title">{speaker.title}</p>}
          {speaker.currentTalk && (
            <p className="current-talk">
              <span className="live-dot"></span>
              {speaker.currentTalk}
            </p>
          )}
          <p className="event-name">at {event.name}</p>
        </div>
        {(speaker.todayEarnings !== undefined || speaker.tipCount !== undefined) && (
          <div className="speaker-stats">
            {speaker.todayEarnings !== undefined && (
              <div className="stat">
                <span className="stat-value">${speaker.todayEarnings}</span>
                <span className="stat-label">earned today</span>
              </div>
            )}
            {speaker.tipCount !== undefined && (
              <div className="stat">
                <span className="stat-value">{speaker.tipCount}</span>
                <span className="stat-label">tips received</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="step-content">
        {step === 'amount' && (
          <div className="amount-step">
            <AmountSelector
              presets={PRESET_AMOUNTS}
              selected={amount}
              onSelect={setAmount}
              currency="$"
              showCustomInput={true}
              customPlaceholder="Enter custom amount"
              min={1}
              max={500}
            />
            
            {isConnected && (
              <div className="wallet-info">
                <div className="balance-display">
                  <span className="balance-label">Your Balance:</span>
                  <span className="balance-value">
                    {formatBalance(walletBalance)} MNT
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'message' && (
          <div className="message-step">
            <MessageComposer
              message={message}
              onChange={setMessage}
              maxLength={200}
              placeholder="Add a personal message to your tip..."
              suggestions={MESSAGE_SUGGESTIONS}
              showCharCount={true}
            />
          </div>
        )}

        {step === 'confirm' && (
          <div className="confirm-step">
            <TransactionPreview
              amountUSD={amount}
              platformFeePct={5}
              gasEstimateUSD={0.01}
              networkName="Mantle Sepolia"
              showBreakdown={true}
            />
            
            {message && (
              <div className="message-preview">
                <h4>Your Message:</h4>
                <p>"{message}"</p>
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="processing-step">
            <div className="processing-animation">
              <div className="spinner"></div>
            </div>
            <h3>Sending your tip to {speaker.name}...</h3>
            <p>Please confirm the transaction in your wallet.</p>
            <div className="processing-details">
              <div>Amount: ${amount.toFixed(2)}</div>
              {message && <div>Message: "{message}"</div>}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="success-step">
            <div className="success-animation">
              <div className="success-icon">✅</div>
            </div>
            <h3>Tip Sent Successfully!</h3>
            <p>
              Your ${amount.toFixed(2)} tip to {speaker.name} has been confirmed 
              on Mantle Network.
            </p>
            {txHash && (
              <div className="transaction-info">
                <p>Transaction: {walletService.formatTxHash(txHash)}</p>
                <a
                  href={walletService.getTxExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-tx-btn"
                >
                  View on Explorer →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <ModalErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {/* Payment Info */}
      {step === 'amount' && (
        <div className="payment-info">
          <div className="info-item">
            <span className="info-icon">💡</span>
            <span>Tips are sent via Mantle Sepolia with ultra-low fees</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <span>Secure transaction powered by smart contracts</span>
          </div>
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <span>Speaker receives tips instantly</span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TippingModal;
