// ArtistSelection.tsx
import React from "react";
import SwipeableViews from "react-swipeable-views";

type ArtistSelectionProps = {
  onSelect: (selectedArtist: string) => void;
  artists: string[];
};

function ArtistSelection({ onSelect, artists }: ArtistSelectionProps) {
  return (
    <div>
      <h2>Choose an artist:</h2>
      <SwipeableViews>
        {artists.map((artist) => (
          <div key={artist}>
            <button onClick={() => onSelect(artist)}>{artist}</button>
          </div>
        ))}
      </SwipeableViews>
    </div>
  );
}

export default ArtistSelection;
