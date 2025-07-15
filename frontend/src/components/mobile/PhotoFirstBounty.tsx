"use client";

import React, { useState, useRef } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { bountyService, ProviderType } from "@/services/blockchain";
import { MOBILE_CONSTANTS, BOUNTY_TYPES } from "@/constants/mobile";
import { hapticFeedback, generateBountyTitle } from "@/utils/mobile";
import styles from "./PhotoFirstBounty.module.css";

interface PhotoFirstBountyProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const { BOUNTY_PRESETS } = MOBILE_CONSTANTS;

export default function PhotoFirstBounty({
  isOpen,
  onClose,
  onComplete,
}: PhotoFirstBountyProps) {
  const { isConnected, connectWallet } = useWalletConnection();
  const [step, setStep] = useState<"photo" | "details" | "confirm">("photo");
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState("song");
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCamera(true);
      }
    } catch (error) {
      console.error("Camera access failed:", error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg", 0.8);
        setPhoto(dataURL);

        // Stop camera
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach((track) => track.stop());
        setIsCamera(false);
        setStep("details");

        // Haptic feedback
        hapticFeedback("MEDIUM");
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
        setStep("details");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSmartTitle = () => {
    const typeLabel =
      BOUNTY_TYPES.find((t) => t.id === selectedType)?.label || "Request";
    return generateBountyTitle(
      typeLabel,
      customAmount ? parseFloat(customAmount) : amount
    );
  };

  const handleCreateBounty = async () => {
    if (!isConnected) {
      await connectWallet(ProviderType.METAMASK);
      return;
    }

    try {
      setIsCreating(true);

      const bountyData = {
        title: title || generateSmartTitle(),
        description:
          description ||
          `${
            BOUNTY_TYPES.find((t) => t.id === selectedType)?.emoji
          } Check out this photo for details!`,
        amount: customAmount ? customAmount : amount.toString(),
        deadline: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours in seconds
        eventId: "current-event", // TODO: Get from context
        speakerId: "", // Optional
        tags: [selectedType, "photo-bounty"],
        bountyType: "audience-to-performer" as const,
        imageData: photo, // Include photo data
      };

      await bountyService.createBounty(bountyData);

      // Success haptic
      hapticFeedback("HEAVY");
      onComplete();
    } catch (error) {
      console.error("Bounty creation failed:", error);
      hapticFeedback("ERROR"); // Error haptic
    } finally {
      setIsCreating(false);
    }
  };

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handleBar} />

        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === "photo" && "📸 Snap Your Request"}
            {step === "details" && "🎯 Bounty Details"}
            {step === "confirm" && "✅ Confirm Bounty"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Step 1: Photo Capture */}
          {step === "photo" && (
            <div className={styles.photoStep}>
              {!isCamera ? (
                <div className={styles.photoOptions}>
                  <div className={styles.photoPlaceholder}>
                    <span className={styles.cameraIcon}>📷</span>
                    <p>Show what you want performed!</p>
                  </div>

                  <div className={styles.captureButtons}>
                    <button
                      className={styles.cameraButton}
                      onClick={startCamera}
                    >
                      📱 Take Photo
                    </button>
                    <button
                      className={styles.galleryButton}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      🖼️ Choose from Gallery
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.cameraView}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={styles.video}
                  />
                  <button
                    className={styles.captureButton}
                    onClick={capturePhoto}
                  >
                    📸
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          )}

          {/* Step 2: Details */}
          {step === "details" && (
            <div className={styles.detailsStep}>
              {photo && (
                <div className={styles.photoPreview}>
                  <img src={photo} alt="Bounty request" />
                  <button
                    className={styles.retakeButton}
                    onClick={() => setStep("photo")}
                  >
                    🔄 Retake
                  </button>
                </div>
              )}

              {/* Bounty Type */}
              <div className={styles.typeSelection}>
                <h3>What type of request?</h3>
                <div className={styles.typeGrid}>
                  {BOUNTY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      className={`${styles.typeButton} ${
                        selectedType === type.id ? styles.selected : ""
                      }`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <span className={styles.typeEmoji}>{type.emoji}</span>
                      <span className={styles.typeLabel}>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Selection */}
              <div className={styles.amountSelection}>
                <h3>Bounty Amount</h3>
                <div className={styles.amountGrid}>
                  {BOUNTY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      className={`${styles.amountButton} ${
                        amount === preset && !customAmount
                          ? styles.selected
                          : ""
                      }`}
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount("");
                      }}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className={styles.customAmountInput}
                />
              </div>

              {/* Optional Details */}
              <div className={styles.optionalDetails}>
                <input
                  type="text"
                  placeholder="Title (optional - we'll generate one)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.titleInput}
                />

                <textarea
                  placeholder="Additional details (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.descriptionInput}
                  rows={2}
                />
              </div>

              <button
                className={styles.nextButton}
                onClick={() => setStep("confirm")}
                disabled={finalAmount <= 0}
              >
                Preview Bounty →
              </button>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && (
            <div className={styles.confirmStep}>
              <div className={styles.bountyPreview}>
                {photo && (
                  <img
                    src={photo}
                    alt="Bounty"
                    className={styles.previewImage}
                  />
                )}

                <div className={styles.previewDetails}>
                  <h3>{title || generateSmartTitle()}</h3>
                  <p className={styles.bountyAmount}>${finalAmount}</p>
                  <p className={styles.bountyType}>
                    {BOUNTY_TYPES.find((t) => t.id === selectedType)?.emoji}{" "}
                    {BOUNTY_TYPES.find((t) => t.id === selectedType)?.label}
                  </p>
                  {description && (
                    <p className={styles.bountyDescription}>{description}</p>
                  )}
                </div>
              </div>

              <div className={styles.confirmButtons}>
                <button
                  className={styles.backButton}
                  onClick={() => setStep("details")}
                >
                  ← Edit
                </button>
                <button
                  className={`${styles.createButton} ${
                    isCreating ? styles.creating : ""
                  }`}
                  onClick={handleCreateBounty}
                  disabled={isCreating}
                >
                  {isCreating
                    ? "🚀 Creating..."
                    : `🎯 Create $${finalAmount} Bounty`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
