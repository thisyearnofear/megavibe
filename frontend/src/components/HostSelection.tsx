import React, { useState } from "react";

type HostSelectionProps = {
  onSelect: (selectedHost: string) => void;
  onBack: () => void;
  hosts: string[];
};

function HostSelection({ onSelect, onBack, hosts }: HostSelectionProps) {
  const [selectedHost, setSelectedHost] = useState<string>("");

  const handleHostSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    setSelectedHost(event.target.value);
  };

  const handleConfirmClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    // Validate selected host
    if (!selectedHost) {
      console.error("No host selected");
      return;
    }

    // Pass valid host to parent
    onSelect(selectedHost);
  };

  return (
    <div className="HostSelection">
      <h4>Select Host</h4>
      <select value={selectedHost} onChange={handleHostSelect}>
        <option value=""> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;🌎 </option>
        <option value="London">London</option>
        <option value="Medellin" disabled>
          Medellin
        </option>
        <option value="Nairobi" disabled>
          Nairobi
        </option>
        {hosts.map((host) => (
          <option key={host} value={host}>
            {host}
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

export default HostSelection;
