import React, { useState } from "react";

interface RoleSelectionProps {
  onSelect: (selectedRole: string) => void;
  roles: string[];
}

function RoleSelection({ onSelect, roles }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState("");

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    console.log("Selected role:", event.target.value); // Add this line
    setSelectedRole(event.target.value);
  };

  const handleConfirmClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    // Validate selected role
    if (!selectedRole) {
      console.error("No role selected");
      return;
    }

    // Pass valid role to parent
    onSelect(selectedRole);
  };

  return (
    <div className="RoleSelection">
      <select value={selectedRole} onChange={handleSelect}>
        <option value="🎹"> &nbsp;&nbsp;&nbsp;&nbsp;🎹 </option>

        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      <button onClick={handleConfirmClick}>Confirm</button>
    </div>
  );
}

export default RoleSelection;
