import React, { useState } from 'react';
import { api } from '../../services/api';
import { realtimeService } from '../../services/realtimeService';
import '../../styles/TippingModal.css';

interface TippingModalProps {
  song: {
    id: string;
    title: string;
    artistId: string;
    artistName: string;
  };
  venueId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [1, 5, 10, 20];

export const TippingModal: React.FC<TippingModalProps> = ({
  song,
  venueId,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);

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

    if (tipAmount < 0.5) {
      setError('Minimum tip amount is $0.50');
      return false;
    }

    if (tipAmount > 100) {
      setError('Maximum tip amount is $100');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateAmount()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const tipAmount = useCustom ? Number(customAmount) : amount;

      // Check if wallet is connected (assuming a global state or context for wallet)
      // This is a placeholder for actual wallet connection check
      const walletConnected = window.localStorage.getItem('wallet_connected') === 'true';
      if (!walletConnected) {
        setError('Please connect your wallet to send tips.');
        return;
      }

      // Create tip transaction on Mantle Network
      // This is a placeholder for actual transaction logic with Mantle Network
      const transactionResponse = await api.post('/tips', {
        songId: song.id,
        artistId: song.artistId,
        venueId,
        amount: tipAmount,
        message: message.trim(),
        currency: 'USD', // Will be converted to MANTLE
        network: 'mantle',
        chainId: 5000
      });

      // Assuming transaction is successful, send real-time notification
      realtimeService.sendTip({
        songId: song.id,
        artistId: song.artistId,
        amount: tipAmount,
        message: message.trim(),
      });

      // Update live tip counters (handled by WebSocket)
      // Show success animation with transaction confirmation
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to process tip. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tipping-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tip Artist</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="song-info">
          <p className="song-title">{song.title}</p>
          <p className="artist-name">by {song.artistName}</p>
        </div>

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
                min="0.50"
                max="100"
                step="0.50"
              />
            </div>
          </div>
        </div>

        <div className="message-section">
          <label>Add a message (optional)</label>
          <textarea
            placeholder="Great performance! 🎵"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={100}
            rows={3}
          />
          <span className="char-count">{message.length}/100</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-footer">
          <div className="tip-summary">
            <span>Total:</span>
            <span className="total-amount">
              ${(useCustom ? Number(customAmount) || 0 : amount).toFixed(2)}
            </span>
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
              disabled={isProcessing || !validateAmount()}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `Send Tip $${(useCustom ? Number(customAmount) || 0 : amount).toFixed(2)}`
              )}
            </button>
          </div>
        </div>

        <div className="payment-info">
          <p>💡 Tips are sent via Mantle Network with minimal fees</p>
          <p>🔒 Secure transaction powered by Web3</p>
        </div>
      </div>
    </div>
  );
};
