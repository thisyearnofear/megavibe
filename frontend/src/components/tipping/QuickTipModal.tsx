/**
 * QuickTipModal.tsx
 * 
 * A modal component for quickly sending tips to speakers at events.
 * Uses our service layer and hooks for a clean implementation.
 */

import React, { useState, useEffect } from 'react';
import { useTipping } from '../../hooks/useTipping';
import { useTipForm } from '../../hooks/useTipForm';
import { useEvents } from '../../hooks/useEvents';
import './QuickTipModal.css';

interface QuickTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientAddress?: string;
  eventId?: string;
  speakerId?: string;
}

const QuickTipModal: React.FC<QuickTipModalProps> = ({
  isOpen,
  onClose,
  recipientAddress = '',
  eventId = '',
  speakerId = ''
}) => {
  const [tipSent, setTipSent] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Use our hooks
  const { sendTip, isProcessing, error: tipError } = useTipping();
  const { getEventById } = useEvents();
  
  // Initialize form with provided values
  const tipForm = useTipForm({
    initialValues: {
      recipientAddress,
      amount: 5, // Default amount
      eventId,
      speakerId, // Add speakerId to initialValues
      message: ''
    },
    onSubmitSuccess: (hash) => {
      setTxHash(hash);
      setTipSent(true);
      setShowReceipt(true);
    }
  });
  
  // Fetch event details if eventId is provided
  const [eventName, setEventName] = useState<string>('');
  
  useEffect(() => {
    if (eventId) {
      getEventById(eventId).then((result) => {
        if (result.success && result.data) {
          setEventName(result.data.title);
        }
      });
    }
  }, [eventId, getEventById]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tipForm.isSubmitting) return;
    
    // Validate form
    if (!tipForm.validateForm()) {
      return;
    }
    
    // Submit form
    await tipForm.submitForm();
  };
  
  // Handle modal close
  const handleClose = () => {
    if (isProcessing) return; // Prevent closing while processing
    
    // Reset state if modal is closed
    if (tipSent) {
      setTipSent(false);
      setShowReceipt(false);
      setTxHash(null);
      tipForm.resetForm();
    }
    
    onClose();
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={handleClose}>
          &times;
        </button>
        
        <div className="modal-header">
          <h2>{tipSent ? 'Tip Sent!' : 'Send a Tip'}</h2>
          {eventName && <p className="event-name">Event: {eventName}</p>}
        </div>
        
        {/* Show receipt if tip is sent */}
        {showReceipt ? (
          <div className="tip-receipt">
            <div className="success-icon">✓</div>
            <p>You've successfully sent a tip of {tipForm.values.amount} USDC!</p>
            {txHash && (
              <div className="transaction-details">
                <p>Transaction Hash:</p>
                <code className="tx-hash">{txHash}</code>
              </div>
            )}
            <div className="receipt-actions">
              <button 
                className="btn primary" 
                onClick={handleClose}
              >
                Close
              </button>
              <button 
                className="btn secondary" 
                onClick={() => {
                  setShowReceipt(false);
                  setTipSent(false);
                  tipForm.resetForm();
                }}
              >
                Send Another Tip
              </button>
            </div>
          </div>
        ) : (
          /* Show form if tip is not sent */
          <form onSubmit={handleSubmit} className="tip-form">
            <div className="form-group">
              <label htmlFor="recipient">Recipient Address</label>
              <input
                id="recipient"
                type="text"
                value={tipForm.values.recipientAddress}
                onChange={(e) => tipForm.handleChange('recipientAddress', e.target.value)}
                onBlur={() => tipForm.handleBlur('recipientAddress')}
                disabled={isProcessing}
                placeholder="0x..."
                className={tipForm.touched.recipientAddress && tipForm.errors.recipientAddress ? 'error' : ''}
              />
              {tipForm.touched.recipientAddress && tipForm.errors.recipientAddress && (
                <div className="error-message">{tipForm.errors.recipientAddress}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">Amount (USDC)</label>
              <div className="amount-input-wrapper">
                <button 
                  type="button" 
                  onClick={() => tipForm.handleChange('amount', Math.max(1, tipForm.values.amount - 1))}
                  disabled={isProcessing}
                  className="amount-button"
                >
                  -
                </button>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  max="1000"
                  value={tipForm.values.amount}
                  onChange={(e) => tipForm.handleChange('amount', parseFloat(e.target.value))}
                  onBlur={() => tipForm.handleBlur('amount')}
                  disabled={isProcessing}
                  className={tipForm.touched.amount && tipForm.errors.amount ? 'error' : ''}
                />
                <button 
                  type="button" 
                  onClick={() => tipForm.handleChange('amount', tipForm.values.amount + 1)}
                  disabled={isProcessing}
                  className="amount-button"
                >
                  +
                </button>
              </div>
              {tipForm.touched.amount && tipForm.errors.amount && (
                <div className="error-message">{tipForm.errors.amount}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message (Optional)</label>
              <textarea
                id="message"
                value={tipForm.values.message}
                onChange={(e) => tipForm.handleChange('message', e.target.value)}
                onBlur={() => tipForm.handleBlur('message')}
                disabled={isProcessing}
                placeholder="Add a message..."
                rows={3}
                className={tipForm.touched.message && tipForm.errors.message ? 'error' : ''}
              />
              {tipForm.touched.message && tipForm.errors.message && (
                <div className="error-message">{tipForm.errors.message}</div>
              )}
            </div>
            
            {/* Hidden event ID field */}
            <input
              type="hidden"
              value={tipForm.values.eventId}
            />
            
            {/* Hidden speaker ID field */}
            <input
              type="hidden"
              value={tipForm.values.speakerId}
            />
            
            {/* Form error message */}
            {(tipForm.errors.form || tipError) && (
              <div className="form-error">
                {tipForm.errors.form || tipError}
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={handleClose} 
                disabled={isProcessing}
                className="btn secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isProcessing || Object.keys(tipForm.errors).length > 0}
                className="btn primary"
              >
                {isProcessing ? 'Sending...' : 'Send Tip'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickTipModal;