import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StepWizard } from '../common/StepWizard';
import { AmountSelector } from '../common/AmountSelector';
import { MessageComposer } from '../common/MessageComposer';
import { TransactionPreview } from '../common/TransactionPreview';
import { useWallet } from '../../contexts/WalletContext';
import { walletService } from '../../services/walletService';
import contractService from '../../services/contractService';
import { crossChainService, CrossChainTransactionStatus } from '../../services/crossChainService';
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

interface CrossChainTippingModalProps {
  speaker: Speaker;
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

interface ChainOption {
  id: number;
  name: string;
  logo?: string;
  balance?: string;
  isNative?: boolean;
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
  { key: 'chain', label: 'Network', icon: '🌐' },
  { key: 'amount', label: 'Amount', icon: '💰' },
  { key: 'message', label: 'Message', icon: '💬' },
  { key: 'confirm', label: 'Confirm', icon: '✅' },
  { key: 'processing', label: 'Processing', icon: '⏳' },
  { key: 'success', label: 'Success', icon: '🎉' }
];

export const CrossChainTippingModal: React.FC<CrossChainTippingModalProps> = ({
  speaker,
  event,
  onClose,
  onSuccess,
  isOpen
}) => {
  const [step, setStep] = useState<'chain' | 'amount' | 'message' | 'confirm' | 'processing' | 'success'>('chain');
  const [selectedChain, setSelectedChain] = useState<ChainOption | null>(null);
  const [supportedChains, setSupportedChains] = useState<ChainOption[]>([]);
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [isCrossChain, setIsCrossChain] = useState(false);
  const [txStatus, setTxStatus] = useState<CrossChainTransactionStatus | null>(null);
  const [usdcBalances, setUsdcBalances] = useState<Record<number, string>>({});
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  
  const { isConnected, isWalletReady, formatBalance } = useWallet();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('chain');
      setSelectedChain(null);
      setAmount(10);
      setMessage('');
      setError(null);
      setTxHash('');
      setIsProcessing(false);
      setIsCrossChain(false);
      setTxStatus(null);
    }
  }, [isOpen]);

  // Load available chains and balances
  useEffect(() => {
    const loadChainsAndBalances = async () => {
      if (isConnected) {
        try {
          // Get native balance
          const balance = await walletService.getBalance();
          setNativeBalance(balance);
          
          // Get current network info
          const networkInfo = await walletService.getNetworkInfo();
          const currentChainId = networkInfo?.chainId || 5003; // Default to Mantle Sepolia
          
          // Initialize chain options with the current chain
          const chains: ChainOption[] = [
            {
              id: currentChainId,
              name: crossChainService.getChainName(currentChainId),
              isNative: true,
              balance: balance
            }
          ];
          
          // Get supported source chains from cross-chain service
          const supportedSourceChains = await crossChainService.getSupportedSourceChains();
          
          // Get wallet address
          const address = await walletService.getAddress();
          if (address) {
            // Get USDC balances across chains
            const balances = await crossChainService.getUSDCBalances(address);
            setUsdcBalances(balances);
            
            // Add supported chains with their balances
            for (const chainId of supportedSourceChains) {
              chains.push({
                id: chainId,
                name: crossChainService.getChainName(chainId),
                balance: balances[chainId] || '0',
                isNative: false
              });
            }
          }
          
          setSupportedChains(chains);
          
          // Auto-select current chain
          setSelectedChain(chains[0]);
        } catch (error) {
          console.error('Failed to load chains and balances:', error);
          setError('Failed to load available networks. Please try again.');
        }
      }
    };
    
    if (isOpen && isConnected) {
      loadChainsAndBalances();
    }
  }, [isConnected, isOpen]);

  // Handle transaction status updates
  useEffect(() => {
    if (txStatus?.status === 'completed' && step === 'processing') {
      setStep('success');
      setTxHash(txStatus.txHash || '');
      
      // Auto-close after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    }
  }, [txStatus, step, onSuccess, onClose]);

  const validateStep = (currentStep: string): boolean => {
    setError(null);

    switch (currentStep) {
      case 'chain':
        if (!selectedChain) {
          setError('Please select a network');
          return false;
        }
        break;
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
        if (!selectedChain) {
          setError('Please select a network');
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(prev => {
      if (prev === 'chain') return 'amount';
      if (prev === 'amount') return 'message';
      if (prev === 'message') return 'confirm';
      return prev; // Typescript needs this
    });
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => {
      if (prev === 'confirm') return 'message';
      if (prev === 'message') return 'amount';
      if (prev === 'amount') return 'chain';
      return prev; // Typescript needs this
    });
  };

  const handleChainSelect = (chain: ChainOption) => {
    setSelectedChain(chain);
    
    // Determine if this will be a cross-chain transaction
    const targetChainId = contractService.getCurrentChainId();
    setIsCrossChain(chain.id !== targetChainId);
  };

  const handleSubmit = async () => {
    if (!validateStep('confirm')) return;

    setIsProcessing(true);
    setStep('processing');
    setError(null);

    try {
      if (!speaker.walletAddress) {
        throw new Error("Speaker's wallet address is not available.");
      }
      
      if (!selectedChain) {
        throw new Error("Please select a network to send from.");
      }

      const statusCallback = (status: CrossChainTransactionStatus) => {
        setTxStatus(status);
        
        // If there's an error, show it
        if (status.status === 'failed' && status.error) {
          setError(status.error.message);
          setStep('confirm');
        }
      };
      
      // Send tip via cross-chain service (handles both native and cross-chain)
      const result = await crossChainService.sendCrossChainTip(
        selectedChain.id,
        speaker.walletAddress,
        amount,
        message.trim(),
        event.id,
        speaker.id,
        statusCallback
      );
      
      if (result.success) {
        setTxHash(result.txHash || '');
        
        // If not cross-chain, go directly to success
        if (!isCrossChain) {
          setStep('success');
          
          // Auto-close after success
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 3000);
        }
        // For cross-chain, status updates will handle the transition to success
      } else {
        throw new Error(result.error || 'Transaction failed.');
      }

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
      case 'chain': return 'Select Network';
      case 'amount': return 'Select Tip Amount';
      case 'message': return 'Add a Message';
      case 'confirm': return 'Confirm Your Tip';
      case 'processing': return isCrossChain ? 'Bridging Assets...' : 'Sending Tip...';
      case 'success': return 'Tip Sent Successfully!';
      default: return 'Tip Speaker';
    }
  };

  const getFooterButtons = () => {
    switch (step) {
      case 'chain':
        return (
          <button 
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!selectedChain}
          >
            Next: Select Amount
          </button>
        );
      case 'amount':
        return (
          <>
            <button className="btn btn-outline" onClick={handleBack}>
              Back
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleNext}
              disabled={amount <= 0}
            >
              Next: Add Message
            </button>
          </>
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
    if (step !== 'chain') completed.push('chain');
    if (!['chain', 'amount'].includes(step)) completed.push('amount');
    if (!['chain', 'amount', 'message'].includes(step)) completed.push('message');
    if (['processing', 'success'].includes(step)) completed.push('confirm');
    if (step === 'success') completed.push('processing');
    return completed;
  };

  const formatCryptoBalance = (balance: string, decimals: number = 18): string => {
    try {
      const balanceNumber = parseFloat(balance);
      if (isNaN(balanceNumber)) return '0';
      
      // If balance is very small, show more decimals
      if (balanceNumber < 0.01) {
        return balanceNumber.toFixed(6);
      }
      
      // Otherwise round to 2 decimal places
      return balanceNumber.toFixed(2);
    } catch (error) {
      return '0';
    }
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
        {step === 'chain' && (
          <div className="chain-step">
            <h4>Select network to pay from:</h4>
            <div className="chain-options">
              {supportedChains.map(chain => (
                <div 
                  key={chain.id}
                  className={`chain-option ${selectedChain?.id === chain.id ? 'selected' : ''}`}
                  onClick={() => handleChainSelect(chain)}
                >
                  <div className="chain-logo">
                    {chain.logo ? (
                      <img src={chain.logo} alt={chain.name} />
                    ) : (
                      <div className="chain-logo-placeholder">{chain.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="chain-details">
                    <div className="chain-name">{chain.name}</div>
                    <div className="chain-balance">
                      {chain.isNative ? (
                        `${formatBalance(chain.balance || '0')} MNT`
                      ) : (
                        `${formatCryptoBalance(usdcBalances[chain.id] || '0', 6)} USDC`
                      )}
                    </div>
                  </div>
                  {chain.isNative && (
                    <div className="chain-badge">Native</div>
                  )}
                </div>
              ))}
            </div>
            
            {selectedChain && selectedChain.id !== contractService.getCurrentChainId() && (
              <div className="chain-info">
                <div className="info-item">
                  <span className="info-icon">🔄</span>
                  <span>
                    <strong>Cross-chain transfer:</strong> Your USDC will be bridged from {selectedChain.name} to {crossChainService.getChainName(contractService.getCurrentChainId())}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

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
            
            {selectedChain && (
              <div className="wallet-info">
                <div className="balance-display">
                  <span className="balance-label">Your Balance on {selectedChain.name}:</span>
                  <span className="balance-value">
                    {selectedChain.isNative 
                      ? `${formatBalance(nativeBalance)}`
                      : `${formatCryptoBalance(usdcBalances[selectedChain.id] || '0', 6)} USDC`}
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
              gasEstimateUSD={isCrossChain ? 2.50 : 0.01} // Higher gas estimate for cross-chain
              networkName={selectedChain?.name || "Unknown"}
              showBreakdown={true}
              // Cross-chain fee info shown separately below
            />
            
            {message && (
              <div className="message-preview">
                <h4>Your Message:</h4>
                <p>"{message}"</p>
              </div>
            )}
            
            {isCrossChain && (
              <div className="cross-chain-info">
                <div className="info-item warning">
                  <span className="info-icon">⚠️</span>
                  <span>
                    Cross-chain transfers may take 5-15 minutes to complete.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="processing-step">
            <div className="processing-animation">
              <div className="spinner"></div>
            </div>
            
            {isCrossChain ? (
              <>
                <h3>Bridging assets to {crossChainService.getChainName(contractService.getCurrentChainId())}...</h3>
                <p>{txStatus?.message || "Please confirm the transaction in your wallet."}</p>
                <div className="processing-progress">
                  <div className={`progress-step ${txStatus?.status === 'pending' ? 'active' : txStatus?.status === 'bridging' || txStatus?.status === 'confirming' || txStatus?.status === 'completed' ? 'completed' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-label">Preparing</div>
                  </div>
                  <div className={`progress-step ${txStatus?.status === 'bridging' ? 'active' : txStatus?.status === 'confirming' || txStatus?.status === 'completed' ? 'completed' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-label">Bridging</div>
                  </div>
                  <div className={`progress-step ${txStatus?.status === 'confirming' ? 'active' : txStatus?.status === 'completed' ? 'completed' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-label">Confirming</div>
                  </div>
                  <div className={`progress-step ${txStatus?.status === 'completed' ? 'active' : ''}`}>
                    <div className="step-dot"></div>
                    <div className="step-label">Complete</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3>Sending your tip to {speaker.name}...</h3>
                <p>Please confirm the transaction in your wallet.</p>
              </>
            )}
            
            <div className="processing-details">
              <div>Amount: ${amount.toFixed(2)}</div>
              {message && <div>Message: "{message}"</div>}
              {selectedChain && <div>Network: {selectedChain.name}</div>}
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
              Your ${amount.toFixed(2)} tip to {speaker.name} has been {isCrossChain ? 'bridged and' : ''} confirmed 
              on {crossChainService.getChainName(contractService.getCurrentChainId())}.
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
      {step === 'chain' && (
        <div className="payment-info">
          <div className="info-item">
            <span className="info-icon">🌉</span>
            <span>Send tips from any blockchain using our cross-chain bridge</span>
          </div>
          <div className="info-item">
            <span className="info-icon">💸</span>
            <span>Pay with USDC from your preferred network</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <span>Secure transactions powered by LI.FI protocol</span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CrossChainTippingModal;