// ArtistSelection.tsx
import React, { useState } from "react";

type ArtistSelectionProps = {
  onArtistSelect: (selectedArtist: string) => void; // Add this line
  onBack: () => void;
  artists: string[];
};

function ArtistSelection({
  onArtistSelect,
  onBack,
  artists,
}: ArtistSelectionProps) {
  const [selectedArtist, setSelectedArtist] = useState<string>("");

  const handleArtistSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedArtist(event.target.value);
  };

  const handleConfirmClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    // Validate selected artist
    if (!selectedArtist) {
      console.error("No artist selected");
      return;
    }

    // Pass valid artist to parent
    onArtistSelect(selectedArtist);
  };

  return (
    <div className="ArtistSelection">
      <h4>Select Artist</h4>
      <select value={selectedArtist} onChange={handleArtistSelect}>
        <option value="">🎤 🎵 🎶</option>
        {artists.map((artist) => (
          <option key={artist} value={artist}>
            {artist}
          </option>
        ))}
      </select>

      <div className="button-container">
        <button onClick={handleConfirmClick}>Confirm</button>
        <button onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

export default ArtistSelection;