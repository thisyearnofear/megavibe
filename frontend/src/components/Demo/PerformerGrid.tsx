import React from 'react';

interface Performer {
  id: string;
  name: string;
  genre: string;
  // ...other fields as needed
}

interface PerformerGridProps {
  performers: Performer[];
  onSelect: (performer: Performer) => void;
}

const PerformerGrid: React.FC<PerformerGridProps> = ({ performers, onSelect }) => (
  <div className="performers-grid">
    {performers.map((performer) => (
      <div
        key={performer.id}
        className={`performer-card`}
        onClick={() => onSelect(performer)}
      >
        <div className="performer-info">
          <h3>{performer.name}</h3>
          <p>{performer.genre}</p>
        </div>
      </div>
    ))}
  </div>
);

export default PerformerGrid;
