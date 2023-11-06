import React, { useState, useEffect } from "react";
import "./App.css";
import RoleSelection from "./components/RoleSelection";
import HostSelection from "./components/HostSelection";
import ArtistProfiles from "./components/ArtistProfiles";
import UserInfoForm from "./components/UserInfoForm";
import ParentComponent from "./components/ParentComponent";
import axios from "axios";

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
  const [showArtistProfile, setShowArtistProfile] = useState(false);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState<
    string | null
  >(null);

  const handleButtonClick = () => {
    console.log("handleButtonClick called");
    if (showRoleSelection || showArtistProfile) {
      console.log("Role selection or Artist selection is showing");
      return;
    }
    if (role === null) {
      console.log("Role is null");
      setRole("selecting");
      setShowRoleSelection(true);
    } else if (role === "Fan" && !artist) {
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
    setHost(null);
    setShowHostSelection(false);
    setShowArtistProfile(true);
    setSelectedArtistProfile(selectedArtist);
  };

  // App.tsx
  return (
    <div className="App">
      {error && (
        <div className="success-message">
          Our Bad. Didn't Work.{" "}
          <a
            href="https://forms.gle/dvUemCEZ3TEJ8x1b7"
            target="_blank"
            rel="noopener noreferrer"
          >
            Use This.
          </a>
        </div>
      )}
      {!showArtistProfile && (
        <button
          className={`big-button button-class custom-mega-vibe-button${
            isLoading ? " spinning" : ""
          }${showRoleSelection ? " disable-click" : ""}`}
          onClick={handleButtonClick}
        >
          {role === null ? "MEGA" : role === "selecting" ? "Select Role" : ""}
          {showRoleSelection && role === "selecting" && (
            <RoleSelection
              onSelect={handleRoleSelect}
              roles={["Fan", "Artist", "Host"]}
            />
          )}
          {showHostSelection && !artist && (
            <HostSelection
              onSelect={handleHostSelect}
              onBack={handleBackClick}
              hosts={[]}
            />
          )}
          {host && !artist && (
            <ParentComponent
              onSelect={handleArtistSelect}
              onBack={handleBackClick}
              artists={["Papa", "Anatu", "Andrew"]}
            />
          )}
          {showForm && (
            <UserInfoForm
              onSubmit={handleFormSubmit}
              onBack={handleBackClick}
              setError={setError}
            />
          )}
        </button>
      )}

      {showArtistProfile && selectedArtistProfile && (
        <ArtistProfiles artist={selectedArtistProfile} />
      )}
    </div>
  );
}

export default App;
