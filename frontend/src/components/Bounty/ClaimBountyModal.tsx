import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useWallet } from '../../contexts/WalletContext';
import contractService from '../../services/contractService';
import ModalErrorBanner from '../common/ModalErrorBanner';
import './ClaimBountyModal.css';

interface ClaimBountyModalProps {
  bountyId: string;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

export const ClaimBountyModal: React.FC<ClaimBountyModalProps> = ({
  bountyId,
  onClose,
  onSuccess,
  isOpen
}) => {
  const [submissionHash, setSubmissionHash] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isWalletReady } = useWallet();

  const handleClaim = async () => {
    if (!isWalletReady()) {
      setError('Wallet not ready. Please connect to the Mantle Sepolia network.');
      return;
    }
    if (!submissionHash) {
      setError('Please provide a submission link or IPFS hash.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await contractService.submitForBounty(parseInt(bountyId, 10), submissionHash);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to claim bounty. Please check your wallet and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Claim Bounty"
      onClose={onClose}
      size="medium"
    >
      <div className="claim-bounty-modal-body">
        <h3>Submit Your Work</h3>
        <p>Provide a link to your content (e.g., IPFS hash, GitHub PR, blog post).</p>
        
        <div className="input-group">
          <label htmlFor="submission-hash">Submission Link / IPFS Hash</label>
          <input
            id="submission-hash"
            type="text"
            value={submissionHash}
            onChange={e => setSubmissionHash(e.target.value)}
            placeholder="ipfs://..."
          />
        </div>

        {error && (
          <ModalErrorBanner error={error} onDismiss={() => setError(null)} />
        )}

        <div className="button-group">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleClaim} disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Submitting...' : 'Claim Bounty'}
          </button>
        </div>
      </div>
    </Modal>
  );
};