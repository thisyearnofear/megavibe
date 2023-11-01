import React, { useState, useEffect } from "react";
import "./App.css";
import RoleSelection from "./components/RoleSelection";
import HostSelection from "./components/HostSelection";
import ArtistSelection from "./components/ArtistSelection";
import ArtistProfiles from "./components/ArtistProfiles";
import UserInfoForm from "./components/UserInfoForm";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [artist, setArtist] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [showHostSelection, setShowHostSelection] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleButtonClick = () => {
    console.log("handleButtonClick called");
    if (showRoleSelection) {
      console.log("Role selection is showing");
      return;
    }
    if (role === null) {
      console.log("Role is null");
      setRole("selecting");
      setShowRoleSelection(true);
    } else if (role === "Fan") {
      console.log("Role is Fan");
      setShowHostSelection(true);
    } else if (!showForm) {
      console.log("Form is not showing");
      setRole(null);
      setShowForm(false);
      setShowBackButton(false);
    }
  };

  const handleHostSelect = (selectedHost: string) => {
    console.log("handleHostSelect called with host:", selectedHost);
    setHost(selectedHost);
    setArtist(null);
    setShowHostSelection(false);
  };

  const handleRoleSelect = (selectedRole: string) => {
    console.log("handleRoleSelect called with role:", selectedRole);
    setRole((prevRole) => {
      if (prevRole !== selectedRole) {
        if (selectedRole === "Fan") {
          setLocation("London");
        }
        return selectedRole;
      }

      return prevRole;
    });
    setShowRoleSelection(false);
  };

  useEffect(() => {
    console.log("useEffect called with role:", role);
    if (role === "Fan") {
      setShowHostSelection(true);
      setShowForm(false);
    } else if (role === "Artist" || role === "Host") {
      setShowForm(true);
    }
  }, [role]);

  const handleFormSubmit = (data: {
    name: string;
    email: string;
    link: string;
  }) => {
    console.log("handleFormSubmit called with data:", data);
    setRole(null);
    setShowForm(false);
    setShowBackButton(false);
  };

  const handleBackClick = () => {
    console.log("handleBackClick called");
    window.location.reload();
  };

  const handleArtistSelect = (selectedArtist: string) => {
    console.log("handleArtistSelect called with artist:", selectedArtist);
    setArtist(selectedArtist);
    handleButtonClick();
  };

  return (
    <div className="App">
      {error && (
        <div>
          Didn't Work.{" "}
          <a href="https://forms.gle/dvUemCEZ3TEJ8x1b7">Use This.</a>
        </div>
      )}
      <button
        className={`big-button button-class custom-mega-vibe-button${
          isLoading ? " spinning" : ""
        }${showRoleSelection ? " disable-click" : ""}`}
        onClick={handleButtonClick}
      >
        {role === null
          ? "MEGA VIBE"
          : role === "selecting"
          ? "Select Role"
          : ""}
        {showRoleSelection && role === "selecting" && (
          <RoleSelection
            onSelect={handleRoleSelect}
            roles={["Fan", "Artist", "Host"]}
          />
        )}
        {showHostSelection && (
          <HostSelection
            onSelect={handleHostSelect}
            onBack={handleBackClick}
            hosts={[]}
          />
        )}

        {showForm && (
          <UserInfoForm onSubmit={handleFormSubmit} onBack={handleBackClick} />
        )}
      </button>

      {!isLoading && !showRoleSelection && !showForm && (
        <>
          {host && !artist && (
            <ArtistSelection
              onSelect={handleArtistSelect}
              artists={["Papa", "Anatu", "Andrew"]}
            />
          )}
          {showForm && (
            <UserInfoForm
              onSubmit={handleFormSubmit}
              onBack={handleBackClick}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
