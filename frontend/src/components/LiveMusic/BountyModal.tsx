import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { StepWizard } from '../common/StepWizard';
import { AmountSelector } from '../common/AmountSelector';
import { MessageComposer } from '../common/MessageComposer';
import { TransactionPreview } from '../common/TransactionPreview';
import { useWallet } from '../../contexts/WalletContext';
import { api } from '../../services/api';
import { walletService } from '../../services/walletService';

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
  const [amount, setAmount] = useState<number>(50);
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
      setError('Wallet not ready');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Convert deadline to timestamp
      const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);
      
      // Create bounty on-chain
      const tx = await walletService.createBounty(
        eventId,
        speakerId,
        description,
        deadlineTs,
        amount
      );
      
      await tx.wait();

      // Save to backend
      await api.post('/api/bounties/create', {
        contractBountyId: tx.logs[0].args.bountyId.toNumber(),
        eventId,
        speakerId,
        description,
        deadline
      });

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (e: any) {
      setError(e.message || 'Failed to create bounty');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create Content Bounty"
      onClose={onClose}
      size="medium"
    >
      <StepWizard steps={STEPS} activeKey={step} />
      
      {step === 'amount' && (
        <div>
          <h3>Set Reward Amount</h3>
          <AmountSelector
            presets={[25, 50, 100, 200]}
            selected={amount}
            onSelect={setAmount}
            currency="$"
          />
          <button onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 'details' && (
        <div>
          <h3>Bounty Details</h3>
          <MessageComposer
            message={description}
            onChange={setDescription}
            placeholder="Describe what content you want created..."
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
          <button onClick={handleBack}>Back</button>
          <button onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <h3>Confirm Bounty</h3>
          <TransactionPreview
            amountUSD={amount}
            platformFeePct={5}
            gasEstimateUSD={0.01}
          />
          <p>Description: {description}</p>
          <p>Deadline: {new Date(deadline).toLocaleString()}</p>
          {error && <div className="error">{error}</div>}
          <button onClick={handleBack}>Back</button>
          <button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Bounty'}
          </button>
        </div>
      )}

      {step === 'success' && (
        <div>
          <h3>✅ Bounty Created!</h3>
          <p>Your bounty is now live and ready for submissions.</p>
        </div>
      )}
    </Modal>
  );
};

export default BountyModal;
