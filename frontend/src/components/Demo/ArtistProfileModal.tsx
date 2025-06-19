import React from 'react';
import { Modal } from '../common/Modal';
import FeatureDemo from './FeatureDemo';

interface ArtistProfileModalProps {
  isOpen: boolean;
  featureType: string;
  selectedPerformer: string;
  onClose: () => void;
  onBack: () => void;
}

const ArtistProfileModal: React.FC<ArtistProfileModalProps> = ({ isOpen, featureType, selectedPerformer, onClose, onBack }) => (
  <Modal
    isOpen={isOpen}
    title={`${featureType} - ${selectedPerformer}`}
    onClose={onClose}
    size="large"
    className="feature-demo-modal"
  >
    <div className="modal-header">
      <button className="btn btn-outline btn-sm" onClick={onBack} style={{ marginBottom: 'var(--space-sm)' }}>
        ← Back to Artists
      </button>
      <p className="feature-description">Feature demo for {selectedPerformer}</p>
    </div>
    <div className="modal-body">
      <FeatureDemo featureType={featureType} selectedPerformer={selectedPerformer} />
    </div>
  </Modal>
);

export default ArtistProfileModal;
