"use client";

import React from "react";
import { PerformerProfile } from "@/services/api/performerService";

interface Performer extends PerformerProfile {
  distance?: string;
  distanceKm?: number;
}

interface QuickTipProps {
  performer: Performer;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const QuickTip: React.FC<QuickTipProps> = ({
  performer,
  isOpen,
  onClose,
  onComplete,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.7)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2>Tip {performer.name}</h2>
        <p>This is a simplified QuickTip component for testing build issues.</p>
        <button 
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QuickTip;
