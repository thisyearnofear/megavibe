import React, { useState } from 'react';
import ArtistSelection from './ArtistSelection';
import ArtistProfiles from './ArtistProfiles';

type ParentComponentProps = {
  onSelect: (selectedArtist: string) => void;
  onBack: () => void;
  artists: string[];
};

const ParentComponent: React.FC<ParentComponentProps> = ({
  onSelect,
  onBack,
  artists,
}) => {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  const handleArtistSelect = (artist: string) => {
    setSelectedArtist(artist);
    onSelect(artist);
  };

  return (
    <>
      {selectedArtist === null ? (
        <ArtistSelection
          onArtistSelect={handleArtistSelect}
          onBack={onBack}
          artists={artists}
        />
      ) : (
        <ArtistProfiles artist={selectedArtist} />
      )}
    </>
  );
};

export default ParentComponent;
