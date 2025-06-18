import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { api } from '../../services/api';

import { walletService } from '../../services/walletService';
import '../../styles/TippingModal.css';

interface TippingModalProps {
  speaker: {
    id: string;
    name: string;
    title?: string;
    avatar?: string;
    walletAddress?: string;
  };
  event: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [5, 10, 25, 50];

export const TippingModal: React.FC<TippingModalProps> = ({
  speaker,
  event,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [txHash, setTxHash] = useState<string>('');
  const [step, setStep] = useState<'setup' | 'confirming' | 'success'>('setup');

  const { isConnected, isWalletReady } = useWallet();

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setUseCustom(false);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setUseCustom(true);
    if (value && !isNaN(Number(value))) {
      setAmount(Number(value));
      setError(null);
    }
  };

  const validateAmount = (): boolean => {
    const tipAmount = useCustom ? Number(customAmount) : amount;

    if (isNaN(tipAmount) || tipAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (tipAmount < 1) {
      setError('Minimum tip amount is $1');
      return false;
    }

    if (tipAmount > 500) {
      setError('Maximum tip amount is $500');
      return false;
    }

    return true;
  };

  // Initialize wallet service
  useEffect(() => {
    const initWallet = async () => {
      if (isConnected) {
        try {
          const balance = await walletService.getBalance();
          setWalletBalance(balance);
        } catch (error) {
          console.error('Failed to get balance:', error);
          setError('Failed to get wallet balance');
        }
      }
    };

    initWallet();
  }, [isConnected]);

  const handleSubmit = async () => {
    if (!validateAmount()) return;

    setIsProcessing(true);
    setError(null);
    setStep('confirming');

    try {
      const tipAmount = useCustom ? Number(customAmount) : amount;

      // Check wallet connection
      if (!isConnected || !isWalletReady()) {
        setError('Please connect your wallet to send tips.');
        return;
      }

      if (!speaker.walletAddress) {
        setError('Speaker wallet address not found.');
        return;
      }

      // Create tip record in backend
      const createResponse = await api.post('/api/tips/create', {
        speakerId: speaker.id,
        eventId: event.id,
        amountUSD: tipAmount,
        message: message.trim(),
      });

      const { tipId, speakerWallet } = createResponse.data;

      // Convert USD to MNT
      const amountMNT = await walletService.convertUSDToMNT(tipAmount);

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
      setStep('setup');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tipping-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {step === 'setup' && 'Tip Speaker'}
            {step === 'confirming' && 'Confirming Transaction...'}
            {step === 'success' && 'Tip Sent Successfully!'}
          </h2>
          <button className="close-button" onClick={onClose} disabled={isProcessing}>
            ×
          </button>
        </div>

        <div className="speaker-info">
          {speaker.avatar && (
            <img src={speaker.avatar} alt={speaker.name} className="speaker-avatar" />
          )}
          <div className="speaker-details">
            <p className="speaker-name">{speaker.name}</p>
            {speaker.title && <p className="speaker-title">{speaker.title}</p>}
            <p className="event-name">at {event.name}</p>
          </div>
        </div>

        {step === 'setup' && (
          <>
            <div className="amount-section">
              <h3>Select Amount</h3>
              <div className="preset-amounts">
                {PRESET_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    className={`amount-button ${amount === preset && !useCustom ? 'selected' : ''}`}
                    onClick={() => handleAmountSelect(preset)}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="custom-amount">
                <label>Custom Amount</label>
                <div className="input-wrapper">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={e => handleCustomAmountChange(e.target.value)}
                    min="1"
                    max="500"
                    step="1"
                  />
                </div>
              </div>
            </div>

            <div className="message-section">
              <label>Add a message (optional)</label>
              <textarea
                placeholder="Great talk! Thanks for the insights... 🎤"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <span className="char-count">{message.length}/200</span>
            </div>
          </>
        )}

        {step === 'confirming' && (
          <div className="confirming-section">
            <div className="loading-spinner"></div>
            <p>Sending your tip to {speaker.name}...</p>
            <p>Please confirm the transaction in your wallet.</p>
            <div className="tip-details">
              <div>Amount: ${(useCustom ? Number(customAmount) || 0 : amount).toFixed(2)}</div>
              {message && <div>Message: "{message}"</div>}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="success-section">
            <div className="success-icon">✅</div>
            <h3>Tip Sent Successfully!</h3>
            <p>Your ${(useCustom ? Number(customAmount) || 0 : amount).toFixed(2)} tip to {speaker.name} has been confirmed on Mantle Network.</p>
            {txHash && (
              <div className="tx-info">
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



        {error && <div className="error-message">{error}</div>}

        {step === 'setup' && (
          <div className="modal-footer">
          <div className="wallet-info">
            <div className="wallet-balance">
              Balance: {parseFloat(walletBalance).toFixed(3)} MNT
            </div>
          </div>

          <div className="tip-summary">
            <div className="summary-row">
              <span>Amount:</span>
              <span>${(useCustom ? Number(customAmount) || 0 : amount).toFixed(2)} USD</span>
            </div>
            <div className="summary-row">
              <span>Platform Fee (5%):</span>
              <span>${((useCustom ? Number(customAmount) || 0 : amount) * 0.05).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Speaker Receives:</span>
              <span>${((useCustom ? Number(customAmount) || 0 : amount) * 0.95).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Gas Fee:</span>
              <span>~$0.01 💚</span>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="cancel-button"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={isProcessing || !validateAmount() || !isConnected || !isWalletReady()}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `💰 Send $${(useCustom ? Number(customAmount) || 0 : amount).toFixed(2)} Tip`
              )}
            </button>
          </div>
        </div>
        )}

        {step === 'setup' && (
          <div className="payment-info">
            <p>💡 Tips are sent via Mantle Sepolia with ultra-low fees</p>
            <p>🔒 Secure transaction powered by smart contracts</p>
            <p>⚡ Speaker receives tips instantly</p>
          </div>
        )}
      </div>
    </div>
  );
};
