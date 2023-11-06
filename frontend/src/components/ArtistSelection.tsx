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
    event.stopPropagation();
    const selectedArtist = event.target.value;
    setSelectedArtist(selectedArtist);
    onArtistSelect(selectedArtist);
  };

  const handleConfirmClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    // Validate selected artist
    if (!selectedArtist) {
      console.error("No artist selected");
      return;
    }
  };

  return (
    <div className="ArtistSelection">
      <h4>Select Artist</h4>
      <select value={selectedArtist} onChange={handleArtistSelect}>
        <option value=""> &nbsp;&nbsp;&nbsp;&nbsp;🎤 </option>
        {artists.map((artist) => (
          <option
            key={artist}
            value={artist}
            disabled={artist === "Anatu" || artist === "Andrew"}
          >
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
