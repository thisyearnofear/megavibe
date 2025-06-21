import React, { useState, useEffect } from 'react';
import { LiveTipFeed } from './LiveTipFeed';
import { useWallet } from '../../contexts/WalletContext';
import { useToast } from '../../contexts/ToastContext';
import { useLiveTipFeed } from '../../hooks/useLiveTipFeed';
import { api } from '../../services/api';
import { walletService } from '../../services/walletService';
import './TipAndBountyFlow.css';

interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  walletAddress?: string;
  currentTalk?: string;
  todayEarnings?: number;
  tipCount?: number;
  reputation?: number;
}

interface Event {
  id: string;
  name: string;
  venue?: string;
  date?: string;
}

interface TipAndBountyFlowProps {
  speaker: Speaker | null;
  event: Event | null;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
  initialAction?: 'tip' | 'bounty';
}

type FlowStep = 'action' | 'amount' | 'message' | 'confirm' | 'processing' | 'success' | 'cross-sell';
type ActionType = 'tip' | 'bounty' | null;

const TIP_STEPS = [
  { key: 'action', label: 'Choose Action', icon: '🎯' },
  { key: 'amount', label: 'Amount', icon: '💰' },
  { key: 'message', label: 'Message', icon: '💬' },
  { key: 'confirm', label: 'Confirm', icon: '✅' },
  { key: 'processing', label: 'Processing', icon: '⏳' },
  { key: 'success', label: 'Success', icon: '🎉' },
  { key: 'cross-sell', label: 'What\'s Next', icon: '🚀' }
];

const PRESET_TIP_AMOUNTS = [5, 10, 25, 50, 100];
const PRESET_BOUNTY_AMOUNTS = [25, 50, 100, 200, 500];

const TIP_SUGGESTIONS = [
  "Great insights! 🎯",
  "Thanks for the knowledge! 🧠",
  "Loved your presentation! 👏",
  "Keep up the great work! 🚀",
  "Inspiring talk! ✨",
  "Amazing content! 🔥"
];

const BOUNTY_SUGGESTIONS = [
  "Share your best crypto trading tips",
  "Explain DeFi for beginners",
  "Demo your latest project",
  "Answer questions about your experience",
  "Share your journey in crypto",
  "Give career advice for developers"
];

export const TipAndBountyFlow: React.FC<TipAndBountyFlowProps> = ({
  speaker,
  event,
  onClose,
  onSuccess,
  isOpen,
  initialAction = null
}) => {
  const [step, setStep] = useState<FlowStep>(initialAction ? 'amount' : 'action');
  const [actionType, setActionType] = useState<ActionType>(initialAction);
  const [amount, setAmount] = useState<number>(initialAction === 'tip' ? 10 : 50);
  const [message, setMessage] = useState<string>('');
  const [bountyDescription, setBountyDescription] = useState<string>('');
  const [bountyDeadline, setBountyDeadline] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [showLiveFeed, setShowLiveFeed] = useState(false);

  const { isConnected, isCorrectNetwork, connectWallet } = useWallet();
  const { showSuccess, showError, showWarning } = useToast();
  const { stats } = useLiveTipFeed(event?.id || '');

  // Load wallet balance
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && isCorrectNetwork) {
        try {
          const balance = await walletService.getBalance();
          setWalletBalance(balance);
        } catch (error) {
          console.error('Failed to get balance:', error);
          showError('Balance Error', 'Could not load wallet balance.');
        }
      }
    };

    loadBalance();
  }, [isConnected, isCorrectNetwork]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(initialAction ? 'amount' : 'action');
      setActionType(initialAction);
      setAmount(initialAction === 'tip' ? 10 : 50);
      setMessage('');
      setBountyDescription('');
      setBountyDeadline('');
      setError(null);
      setTxHash('');
    }
  }, [isOpen, initialAction]);

  // Early return after hooks if required props are missing
  if (!isOpen || !speaker || !event) {
    return null;
  }

  const handleActionSelect = (action: 'tip' | 'bounty') => {
    setActionType(action);
    setAmount(action === 'tip' ? 10 : 50);
    setStep('amount');
  };

  const handleNext = () => {
    if (step === 'action') {
      // Action should be selected first
      return;
    } else if (step === 'amount') {
      setStep('message');
    } else if (step === 'message') {
      setStep('confirm');
    } else if (step === 'success') {
      setStep('cross-sell');
    }
  };

  const handleBack = () => {
    if (step === 'amount') {
      setStep(initialAction ? 'action' : 'action');
    } else if (step === 'message') {
      setStep('amount');
    } else if (step === 'confirm') {
      setStep('message');
    } else if (step === 'cross-sell') {
      setStep('success');
    }
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      showWarning('Connect Wallet', 'Please connect your wallet to proceed.');
      connectWallet(); // Or trigger a modal
      return;
    }

    if (!isCorrectNetwork) {
      showWarning('Wrong Network', 'Please switch to the correct network.');
      return;
    }

    if (!actionType) {
      showError('Action Required', 'Please select either a tip or a bounty.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      let result;
      if (actionType === 'tip') {
        result = await submitTip();
      } else {
        result = await submitBounty();
      }

      if (result.success) {
        setTxHash(result.txHash);
        setStep('success');
        showSuccess('Transaction Successful!', `Your ${actionType} has been submitted.`);
        if (actionType === 'tip') {
          setShowLiveFeed(true);
        }
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('Submission failed:', error);
      setError(error.message || 'An unexpected error occurred.');
      showError('Transaction Failed', error.message || 'An unexpected error occurred.');
      setStep('confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const submitTip = async () => {
    if (!speaker.walletAddress) {
      throw new Error('Speaker wallet address not found');
    }

    const amountMNT = await walletService.convertUSDToMNT(amount);
    const result = await walletService.sendTip(
      speaker.walletAddress,
      amountMNT,
      message,
      event.id,
      speaker.id
    );

    if (result.success) {
      // Save tip to backend
      try {
        await api.post('/api/tips/create', {
          eventId: event.id,
          speakerId: speaker.id,
          amount,
          message,
          txHash: result.txHash,
          recipientAddress: speaker.walletAddress
        });
      } catch (error) {
        console.warn('Failed to save tip to backend:', error);
      }
    }

    return result;
  };

  const submitBounty = async () => {
    // Convert deadline to timestamp
    const deadlineTs = Math.floor(new Date(bountyDeadline).getTime() / 1000);

    const result = await walletService.createBounty(
      event.id,
      speaker.id,
      bountyDescription,
      deadlineTs,
      amount
    );

    if (result.success) {
      // Save bounty to backend
      try {
        await api.post('/api/bounties/create', {
          eventId: event.id,
          speakerId: speaker.id,
          description: bountyDescription,
          deadline: bountyDeadline,
          amount,
          txHash: result.txHash
        });
      } catch (error) {
        console.warn('Failed to save bounty to backend:', error);
      }
    }

    return result;
  };

  const handleCrossAction = () => {
    // Switch to opposite action
    const newAction = actionType === 'tip' ? 'bounty' : 'tip';
    setActionType(newAction);
    setAmount(newAction === 'tip' ? 10 : 50);
    setMessage('');
    setBountyDescription('');
    setBountyDeadline('');
    setError(null);
    setStep('amount');
  };

  const handleClose = () => {
    if (step === 'success' || step === 'cross-sell') {
      onSuccess();
    }
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'action':
        return (
          <div className="action-selection">
            <div className="action-header">
              <h3>How would you like to engage with {speaker?.name || 'this speaker'}?</h3>
              <p>Choose your preferred way to interact</p>
            </div>

            <div className="action-cards">
              <button
                className="action-card tip-card"
                onClick={() => handleActionSelect('tip')}
              >
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h4>Send a Tip</h4>
                  <p>Show appreciation for their talk</p>
                  <span className="card-benefit">Instant reward • Real-time feedback</span>
                </div>
                <div className="card-arrow">→</div>
              </button>

              <button
                className="action-card bounty-card"
                onClick={() => handleActionSelect('bounty')}
              >
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h4>Create a Bounty</h4>
                  <p>Request specific content from them</p>
                  <span className="card-benefit">Custom content • Time-bound</span>
                </div>
                <div className="card-arrow">→</div>
              </button>
            </div>

            <div className="action-stats">
              <div className="stat">
                <span className="stat-value">${stats.totalAmount.toFixed(0)}</span>
                <span className="stat-label">Total tips today</span>
              </div>
              <div className="stat">
                <span className="stat-value">{stats.tipCount}</span>
                <span className="stat-label">Active tips</span>
              </div>
            </div>
          </div>
        );

      case 'amount':
        return (
          <div className="amount-selection">
            <div className="amount-header">
              <h3>
                {actionType === 'tip' ? 'How much would you like to tip?' : 'Set your bounty reward'}
              </h3>
              <p>
                {actionType === 'tip'
                  ? 'Your tip will be sent directly to the speaker'
                  : 'This amount will be held until the bounty is completed'
                }
              </p>
            </div>

            <div className="amount-selector-wrapper">
              <div className="preset-amounts">
                {(actionType === 'tip' ? PRESET_TIP_AMOUNTS : PRESET_BOUNTY_AMOUNTS).map((preset) => (
                  <button
                    key={preset}
                    className={`preset-button ${amount === preset ? 'active' : ''}`}
                    onClick={() => setAmount(preset)}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="amount-input"
                placeholder="Custom amount"
                min="1"
                max="1000"
              />
            </div>

            <div className="amount-breakdown">
              <div className="breakdown-item">
                <span>Amount</span>
                <span>${amount}</span>
              </div>
              <div className="breakdown-item">
                <span>Platform Fee (5%)</span>
                <span>${(amount * 0.05).toFixed(2)}</span>
              </div>
              <div className="breakdown-item total">
                <span>Total</span>
                <span>${(amount * 1.05).toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      case 'message':
        return (
          <div className="message-composition">
            <div className="message-header">
              <h3>
                {actionType === 'tip' ? 'Add a message (optional)' : 'Describe your bounty request'}
              </h3>
              <p>
                {actionType === 'tip'
                  ? 'Let the speaker know what you appreciated'
                  : 'Be specific about what content you want'
                }
              </p>
            </div>

            {actionType === 'tip' ? (
              <div className="message-composer">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Great insights about DeFi..."
                  maxLength={200}
                  className="message-input"
                />
                <div className="suggestions">
                  {TIP_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-button"
                      onClick={() => setMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bounty-details">
                <div className="message-composer">
                  <textarea
                    value={bountyDescription}
                    onChange={(e) => setBountyDescription(e.target.value)}
                    placeholder="Please create a 5-minute video explaining..."
                    maxLength={500}
                    className="message-input"
                    required
                  />
                  <div className="suggestions">
                    {BOUNTY_SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-button"
                        onClick={() => setBountyDescription(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="deadline-selector">
                  <label>Deadline</label>
                  <input
                    type="datetime-local"
                    value={bountyDeadline}
                    onChange={(e) => setBountyDeadline(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'confirm':
        return (
          <div className="transaction-confirmation">
            <div className="preview-card">
              <h3>Review {actionType === 'tip' ? 'Tip' : 'Bounty'}</h3>
              <div className="preview-details">
                <div className="detail-row">
                  <span>Recipient:</span>
                  <span>{speaker.name}</span>
                </div>
                <div className="detail-row">
                  <span>Amount:</span>
                  <span>${amount}</span>
                </div>
                <div className="detail-row">
                  <span>Platform Fee (5%):</span>
                  <span>${(amount * 0.05).toFixed(2)}</span>
                </div>
                <div className="detail-row total">
                  <span>Total:</span>
                  <span>${(amount * 1.05).toFixed(2)}</span>
                </div>
                {(actionType === 'tip' ? message : bountyDescription) && (
                  <div className="detail-row">
                    <span>Message:</span>
                    <span>{actionType === 'tip' ? message : bountyDescription}</span>
                  </div>
                )}
                {actionType === 'bounty' && bountyDeadline && (
                  <div className="detail-row">
                    <span>Deadline:</span>
                    <span>{new Date(bountyDeadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              {error && (
                <div className="error-message">{error}</div>
              )}
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="processing-state">
            <div className="processing-spinner">⏳</div>
            <h3>Processing your {actionType}...</h3>
            <p>Please wait while we confirm your transaction</p>
            <div className="processing-steps">
              <div className="process-step active">
                <span>1</span> Transaction submitted
              </div>
              <div className="process-step">
                <span>2</span> Waiting for confirmation
              </div>
              <div className="process-step">
                <span>3</span> Updating feed
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="success-state">
            <div className="success-icon">🎉</div>
            <h3>
              {actionType === 'tip' ? 'Tip sent successfully!' : 'Bounty created successfully!'}
            </h3>
            <p>
              {actionType === 'tip'
                ? `Your $${amount} tip has been sent to ${speaker.name}`
                : `Your $${amount} bounty is now live and waiting for submissions`
              }
            </p>

            <div className="success-details">
              <div className="detail-item">
                <span>Transaction</span>
                <a
                  href={walletService.getTxExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {walletService.formatTxHash(txHash)}
                </a>
              </div>
              <div className="detail-item">
                <span>Gas Used</span>
                <span>~$0.01</span>
              </div>
            </div>

            {actionType === 'tip' && showLiveFeed && (
              <div className="live-feed-preview">
                <h4>🔴 Live Feed Updated</h4>
                <div className="mini-feed">
                  <LiveTipFeed eventId={event.id} className="mini" />
                </div>
              </div>
            )}
          </div>
        );

      case 'cross-sell':
        return (
          <div className="cross-sell">
            <div className="cross-sell-header">
              <h3>Want to do more?</h3>
              <p>You've just {actionType === 'tip' ? 'tipped' : 'created a bounty for'} {speaker?.name || 'this speaker'}</p>
            </div>

            <div className="cross-sell-options">
              <button
                className="cross-sell-card"
                onClick={handleCrossAction}
              >
                <div className="card-icon">
                  {actionType === 'tip' ? '🎯' : '💰'}
                </div>
                <div className="card-content">
                  <h4>
                    {actionType === 'tip' ? 'Create a Bounty' : 'Send Another Tip'}
                  </h4>
                  <p>
                    {actionType === 'tip'
                      ? 'Request specific content from them'
                      : 'Show additional appreciation'
                    }
                  </p>
                </div>
              </button>

              <button
                className="cross-sell-card"
                onClick={() => setShowLiveFeed(!showLiveFeed)}
              >
                <div className="card-icon">📺</div>
                <div className="card-content">
                  <h4>View Live Feed</h4>
                  <p>See all activity at this event</p>
                </div>
              </button>
            </div>

            <div className="speaker-stats">
              <h4>{speaker?.name || 'Speaker'}'s Stats Today</h4>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-value">${speaker?.todayEarnings || 0}</span>
                  <span className="stat-label">Earned</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{speaker?.tipCount || 0}</span>
                  <span className="stat-label">Tips</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{speaker?.reputation || 0}</span>
                  <span className="stat-label">Reputation</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="tip-bounty-flow-modal">
        <div className="flow-container">
          <div className="flow-header">
            <div className="speaker-info">
              <div className="speaker-avatar">
                {speaker?.avatar ? (
                  <img src={speaker.avatar} alt={speaker.name || 'Speaker'} />
                ) : (
                  <div className="avatar-placeholder">
                    {speaker?.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <div className="speaker-details">
                <h2>{speaker?.name || 'Speaker'}</h2>
                <p>{speaker?.title || ''}</p>
                {speaker?.currentTalk && (
                  <span className="current-talk">🎤 {speaker.currentTalk}</span>
                )}
              </div>
            </div>

            <button className="close-button" onClick={handleClose}>×</button>
          </div>

          <div className="flow-progress">
            <div className="step-wizard">
              {TIP_STEPS.map((stepInfo) => (
                <div
                  key={stepInfo.key}
                  className={`step ${step === stepInfo.key ? 'active' : ''}`}
                  onClick={() => {
                    const stepIndex = Array.isArray(TIP_STEPS) ? TIP_STEPS.findIndex(s => s.key === stepInfo.key) : -1;
                    const currentIndex = Array.isArray(TIP_STEPS) ? TIP_STEPS.findIndex(s => s.key === step) : -1;
                    if (stepIndex < currentIndex) {
                      setStep(stepInfo.key as FlowStep);
                    }
                  }}
                >
                  <span className="step-icon">{stepInfo.icon}</span>
                  <span className="step-label">{stepInfo.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flow-content">
            {renderStepContent()}
          </div>

          <div className="flow-actions">
            {step !== 'action' && step !== 'processing' && step !== 'success' && (
              <button
                className="secondary-button"
                onClick={handleBack}
              >
                Back
              </button>
            )}

            {step === 'action' && (
              <button
                className="secondary-button"
                onClick={handleClose}
              >
                Cancel
              </button>
            )}

            {(step === 'amount' || step === 'message') && (
              <button
                className="primary-button"
                onClick={handleNext}
                disabled={
                  (step === 'message' && actionType === 'bounty' && !bountyDescription) ||
                  (step === 'message' && actionType === 'bounty' && !bountyDeadline)
                }
              >
                Next
              </button>
            )}

            {step === 'confirm' && (
              <button
                className="primary-button"
                onClick={handleSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Send ${actionType}`}
              </button>
            )}

            {(step === 'success' || step === 'cross-sell') && (
              <button
                className="primary-button"
                onClick={handleClose}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipAndBountyFlow;
