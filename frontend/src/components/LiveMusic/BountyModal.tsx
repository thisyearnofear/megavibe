import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { StepWizard } from '../common/StepWizard';
import { AmountSelector } from '../common/AmountSelector';
import { MessageComposer } from '../common/MessageComposer';
import { TransactionPreview } from '../common/TransactionPreview';
import { useWallet } from '../../contexts/WalletContext';
import contractService from '../../services/contractService';
import ModalErrorBanner from '../common/ModalErrorBanner';
import './BountyModal.css';

interface BountyModalProps {
  eventId: string;
  speakerId: string;
  speakerName: string;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

const STEPS = [
  { key: 'amount', label: 'Reward', icon: '💰' },
  { key: 'details', label: 'Details', icon: '📝' },
  { key: 'confirm', label: 'Confirm', icon: '✅' },
  { key: 'success', label: 'Created', icon: '🎉' }
];

export const BountyModal: React.FC<BountyModalProps> = ({
  eventId,
  speakerId,
  speakerName,
  onClose,
  onSuccess,
  isOpen
}) => {
  const [step, setStep] = useState<'amount' | 'details' | 'confirm' | 'success'>('amount');
  const [amount, setAmount] = useState<number>(10); // Default to 10 MNT
  const [description, setDescription] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isWalletReady } = useWallet();

  const handleNext = () => {
    if (step === 'amount') setStep('details');
    else if (step === 'details') setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'confirm') setStep('details');
    else if (step === 'details') setStep('amount');
  };

  const handleCreate = async () => {
    if (!isWalletReady()) {
      setError('Wallet not ready. Please connect to the Mantle Sepolia network.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);
      
      await contractService.createBounty(
        eventId,
        speakerId,
        description,
        amount.toString(),
        deadlineTs
      );
      
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (e: any) {
      setError(e.message || 'Failed to create bounty. Please check your wallet and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create On-Chain Bounty"
      onClose={onClose}
      size="medium"
    >
      <StepWizard steps={STEPS} activeKey={step} />
      
      {step === 'amount' && (
        <div>
          <h3>Set Reward Amount (in MNT)</h3>
          <AmountSelector
            presets={[5, 10, 25, 50]}
            selected={amount}
            onSelect={setAmount}
            currency="MNT"
          />
          <button onClick={handleNext} className="btn-primary">Next</button>
        </div>
      )}

      {step === 'details' && (
        <div>
          <h3>Bounty Details</h3>
          <MessageComposer
            message={description}
            onChange={setDescription}
            placeholder="Describe the content you want created..."
            maxLength={500}
          />
          <div>
            <label>Deadline:</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          <div className="button-group">
            <button onClick={handleBack} className="btn-secondary">Back</button>
            <button onClick={handleNext} className="btn-primary">Next</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <h3>Confirm Bounty</h3>
          <TransactionPreview
            amountMNT={amount}
            platformFeePct={5}
            gasEstimateUSD={0.01}
          />
          <p><strong>Description:</strong> {description}</p>
          <p><strong>Deadline:</strong> {new Date(deadline).toLocaleString()}</p>
          {error && (
            <ModalErrorBanner error={error} onDismiss={() => setError(null)} />
          )}
          <div className="button-group">
            <button onClick={handleBack} className="btn-secondary">Back</button>
            <button onClick={handleCreate} disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Creating...' : `Create Bounty for ${amount} MNT`}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div>
          <h3>✅ Bounty Created!</h3>
          <p>Your bounty is now live on the Mantle Sepolia network.</p>
        </div>
      )}
    </Modal>
  );
};

export default BountyModal;
