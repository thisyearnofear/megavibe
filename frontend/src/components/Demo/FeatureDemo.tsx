import React from 'react';

interface FeatureDemoProps {
  featureType: string;
  selectedPerformer: string | null;
}

const FeatureDemo: React.FC<FeatureDemoProps> = ({ featureType, selectedPerformer }) => {
  if (!selectedPerformer) return null;
  // Add your feature demo rendering logic here, e.g.:
  return (
    <div className="feature-demo-content">
      <h3>Feature: {featureType}</h3>
      <p>Performer: {selectedPerformer}</p>
      {/* Add more detailed demo UI as needed */}
    </div>
  );
};

export default FeatureDemo;
