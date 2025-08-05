"use client";

import React, { useState } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { ProviderType } from "@/services/blockchain";
import { useLocation } from "@/hooks/useLocation";
import QRCodeGenerator from "./QRCodeGenerator";
import styles from "./PerformerOnboarding.module.css";

interface PerformerProfile {
  name: string;
  type: string;
  description: string;
  genres: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  preferences: {
    acceptsTips: boolean;
    acceptsRequests: boolean;
    requestTypes: string[];
    minimumTip: number;
    minimumRequest: number;
  };
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

export default function PerformerOnboarding() {
  const { walletInfo, connect } = useWalletConnection();
  const isConnected = walletInfo.isConnected;
  const connectWallet = connect;
  const { location, requestLocation } = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<PerformerProfile>>({
    preferences: {
      acceptsTips: true,
      acceptsRequests: true,
      requestTypes: [],
      minimumTip: 1,
      minimumRequest: 5,
    },
  });
  const [isComplete, setIsComplete] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: "wallet",
      title: "Connect Wallet",
      description: "Connect your wallet to receive tips and payments",
      component: WalletStep,
    },
    {
      id: "profile",
      title: "Create Profile",
      description: "Tell audiences about your performances",
      component: ProfileStep,
    },
    {
      id: "preferences",
      title: "Set Preferences",
      description: "Configure tips and request settings",
      component: PreferencesStep,
    },
    {
      id: "location",
      title: "Enable Location",
      description: "Let audiences find you when performing",
      component: LocationStep,
    },
    {
      id: "qrcode",
      title: "Get Your QR Code",
      description: "Display this code for instant audience connection",
      component: QRCodeStep,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateProfile = (updates: Partial<PerformerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  if (isComplete) {
    return <OnboardingComplete profile={profile} />;
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className={styles.onboarding}>
      {/* Progress Header */}
      <div className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className={styles.stepContainer}>
        <div className={styles.stepHeader}>
          <h1 className={styles.stepTitle}>{steps[currentStep].title}</h1>
          <p className={styles.stepDescription}>
            {steps[currentStep].description}
          </p>
        </div>

        <div className={styles.stepContent}>
          <CurrentStepComponent
            profile={profile}
            updateProfile={updateProfile}
            onNext={handleNext}
            onBack={handleBack}
            canProceed={validateStep(currentStep, profile)}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        {currentStep > 0 && (
          <button className={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
        )}
        <div className={styles.navSpacer} />
        <button
          className={`${styles.nextButton} ${
            !validateStep(currentStep, profile) ? styles.disabled : ""
          }`}
          onClick={handleNext}
          disabled={!validateStep(currentStep, profile)}
        >
          {currentStep === steps.length - 1 ? "Complete Setup" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

// Step Components
const WalletStep = ({ onNext }: { onNext: () => void }) => {
  const { walletInfo, connect } = useWalletConnection();
  const isConnected = walletInfo.isConnected;
  const connectWallet = connect;

  React.useEffect(() => {
    if (isConnected) {
      setTimeout(onNext, 1000); // Auto-advance when connected
    }
  }, [isConnected, onNext]);

  return (
    <div className={styles.walletStep}>
      <div className={styles.walletIcon}>🔗</div>
      {isConnected ? (
        <div className={styles.walletConnected}>
          <h3>Wallet Connected!</h3>
          <p>You're ready to receive tips and payments</p>
          <div className={styles.checkmark}>✅</div>
        </div>
      ) : (
        <div className={styles.walletPrompt}>
          <h3>Connect Your Wallet</h3>
          <p>
            Connect your wallet to receive tips and request payments from your
            audience
          </p>
          <button
            className={styles.connectButton}
            onClick={() => connectWallet('metamask' as any)}
          >
            Connect MetaMask
          </button>
        </div>
      )}
    </div>
  );
};

const ProfileStep = ({
  profile,
  updateProfile,
}: {
  profile: Partial<PerformerProfile>;
  updateProfile: (updates: Partial<PerformerProfile>) => void;
}) => {
  const [formData, setFormData] = useState({
    name: profile.name || "",
    type: profile.type || "",
    description: profile.description || "",
    genres: profile.genres || [],
  });

  const performerTypes = [
    "Musician",
    "Comedian",
    "Street Performer",
    "DJ",
    "Dancer",
    "Magician",
    "Poet",
    "Artist",
    "Other",
  ];

  const musicGenres = [
    "Rock",
    "Pop",
    "Jazz",
    "Blues",
    "Folk",
    "Electronic",
    "Hip Hop",
    "Country",
    "Classical",
    "Indie",
  ];

  const handleSubmit = () => {
    updateProfile(formData);
  };

  React.useEffect(() => {
    handleSubmit();
  }, [formData]);

  return (
    <div className={styles.profileStep}>
      <div className={styles.formGroup}>
        <label>Performer Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Your stage name or real name"
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Performance Type</label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, type: e.target.value }))
          }
          className={styles.select}
        >
          <option value="">Select your performance type</option>
          {performerTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Tell your audience about your performances..."
          className={styles.textarea}
          rows={3}
        />
      </div>

      {formData.type === "Musician" && (
        <div className={styles.formGroup}>
          <label>Genres</label>
          <div className={styles.genreGrid}>
            {musicGenres.map((genre) => (
              <button
                key={genre}
                className={`${styles.genreButton} ${
                  formData.genres.includes(genre) ? styles.selected : ""
                }`}
                onClick={() => {
                  const newGenres = formData.genres.includes(genre)
                    ? formData.genres.filter((g) => g !== genre)
                    : [...formData.genres, genre];
                  setFormData((prev) => ({ ...prev, genres: newGenres }));
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PreferencesStep = ({
  profile,
  updateProfile,
}: {
  profile: Partial<PerformerProfile>;
  updateProfile: (updates: Partial<PerformerProfile>) => void;
}) => {
  const [preferences, setPreferences] = useState(
    profile.preferences || {
      acceptsTips: true,
      acceptsRequests: true,
      requestTypes: [],
      minimumTip: 1,
      minimumRequest: 5,
    }
  );

  const requestTypes = [
    "Song Requests",
    "Dedications",
    "Shoutouts",
    "Custom Performances",
    "Encores",
    "Covers",
    "Originals",
  ];

  React.useEffect(() => {
    updateProfile({ preferences });
  }, [preferences, updateProfile]);

  return (
    <div className={styles.preferencesStep}>
      <div className={styles.preferenceGroup}>
        <div className={styles.preferenceHeader}>
          <h3>Tips</h3>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.acceptsTips}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  acceptsTips: e.target.checked,
                }))
              }
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
        {preferences.acceptsTips && (
          <div className={styles.subPreference}>
            <label>Minimum tip amount</label>
            <select
              value={preferences.minimumTip}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  minimumTip: Number(e.target.value),
                }))
              }
              className={styles.select}
            >
              <option value={1}>$1</option>
              <option value={2}>$2</option>
              <option value={5}>$5</option>
              <option value={10}>$10</option>
            </select>
          </div>
        )}
      </div>

      <div className={styles.preferenceGroup}>
        <div className={styles.preferenceHeader}>
          <h3>Requests</h3>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.acceptsRequests}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  acceptsRequests: e.target.checked,
                }))
              }
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
        {preferences.acceptsRequests && (
          <>
            <div className={styles.subPreference}>
              <label>Minimum request amount</label>
              <select
                value={preferences.minimumRequest}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    minimumRequest: Number(e.target.value),
                  }))
                }
                className={styles.select}
              >
                <option value={5}>$5</option>
                <option value={10}>$10</option>
                <option value={15}>$15</option>
                <option value={25}>$25</option>
              </select>
            </div>
            <div className={styles.subPreference}>
              <label>Request types you accept</label>
              <div className={styles.requestTypeGrid}>
                {requestTypes.map((type) => (
                  <button
                    key={type}
                    className={`${styles.requestTypeButton} ${
                      preferences.requestTypes.includes(type)
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => {
                      const newTypes = preferences.requestTypes.includes(type)
                        ? preferences.requestTypes.filter((t) => t !== type)
                        : [...preferences.requestTypes, type];
                      setPreferences((prev) => ({
                        ...prev,
                        requestTypes: newTypes,
                      }));
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const LocationStep = ({ onNext }: { onNext: () => void }) => {
  const { location, hasPermission, requestLocation } = useLocation();

  React.useEffect(() => {
    if (hasPermission) {
      setTimeout(onNext, 1000); // Auto-advance when location enabled
    }
  }, [hasPermission, onNext]);

  return (
    <div className={styles.locationStep}>
      <div className={styles.locationIcon}>📍</div>
      {hasPermission ? (
        <div className={styles.locationEnabled}>
          <h3>Location Enabled!</h3>
          <p>Audiences can now find you when you're performing nearby</p>
          <div className={styles.checkmark}>✅</div>
        </div>
      ) : (
        <div className={styles.locationPrompt}>
          <h3>Enable Location Services</h3>
          <p>
            Allow location access so audiences can discover you when you're
            performing nearby
          </p>
          <button className={styles.enableButton} onClick={requestLocation}>
            Enable Location
          </button>
          <button className={styles.skipButton} onClick={onNext}>
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
};

const QRCodeStep = ({ profile }: { profile: Partial<PerformerProfile> }) => {
  const performerId = `performer_${Date.now()}`; // In real app, this would be from backend

  return (
    <div className={styles.qrCodeStep}>
      <h3>Your Performer QR Code</h3>
      <p>
        Display this code so audiences can instantly connect and support you
      </p>

      <QRCodeGenerator
        performerId={performerId}
        performerName={profile.name || "Performer"}
      />

      <div className={styles.qrInstructions}>
        <h4>How to use your QR code:</h4>
        <ul>
          <li>📱 Save the image to your phone</li>
          <li>🖨️ Print it for your performance setup</li>
          <li>📺 Display it on a screen or tablet</li>
          <li>🎭 Place it where audiences can easily scan</li>
        </ul>
      </div>
    </div>
  );
};

const OnboardingComplete = ({
  profile,
}: {
  profile: Partial<PerformerProfile>;
}) => {
  return (
    <div className={styles.complete}>
      <div className={styles.completeIcon}>🎉</div>
      <h2>Welcome to MegaVibe!</h2>
      <p>
        Your performer profile is ready. Start performing and engaging with your
        audience!
      </p>

      <div className={styles.nextSteps}>
        <h3>Next Steps:</h3>
        <div className={styles.stepCard}>
          <span className={styles.stepIcon}>🎭</span>
          <div>
            <h4>Start Performing</h4>
            <p>Check in at your venue and set your status to "Live"</p>
          </div>
        </div>
        <div className={styles.stepCard}>
          <span className={styles.stepIcon}>📱</span>
          <div>
            <h4>Display Your QR Code</h4>
            <p>Let audiences scan to connect and support you instantly</p>
          </div>
        </div>
        <div className={styles.stepCard}>
          <span className={styles.stepIcon}>📊</span>
          <div>
            <h4>Track Your Performance</h4>
            <p>View analytics and earnings in your performer dashboard</p>
          </div>
        </div>
      </div>

      <button className={styles.dashboardButton}>
        Go to Performer Dashboard
      </button>
    </div>
  );
};

// Validation function
function validateStep(
  step: number,
  profile: Partial<PerformerProfile>
): boolean {
  switch (step) {
    case 0: // Wallet
      return true; // Will be handled by wallet connection state
    case 1: // Profile
      return !!(profile.name && profile.type);
    case 2: // Preferences
      return true; // Preferences have defaults
    case 3: // Location
      return true; // Optional step
    case 4: // QR Code
      return true; // Final step
    default:
      return false;
  }
}
