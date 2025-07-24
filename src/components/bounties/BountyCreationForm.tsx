"use client";

import React, { useState, useEffect } from "react";
import styles from "./BountyCreationForm.module.css";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { bountyService, BountyCreationData } from "@/services/blockchain";
import { aiService, BountyAIResponse } from "@/services/ai/aiService";
import { DEFAULT_CHAIN_ID } from "@/contracts/addresses";

type BountyType = "audience-to-performer" | "performer-to-audience";

interface BountyCreationFormProps {
  onSuccess?: () => void;
}

export default function BountyCreationForm({
  onSuccess,
}: BountyCreationFormProps) {
  const {
    isConnected,
    walletAddress,
    chainId,
    isNetworkSupported,
    openWalletModal,
    switchNetwork,
  } = useWalletConnection();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawInput, setRawInput] = useState(""); // For AI processing
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [eventId, setEventId] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [bountyType, setBountyType] = useState<BountyType>(
    "audience-to-performer"
  );

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiResponse, setAiResponse] = useState<BountyAIResponse | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Set a default deadline 7 days from now
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setDeadline(defaultDate.toISOString().split("T")[0]);
  }, []);

  // Process raw input with AI to get suggestions
  const processWithAI = async () => {
    if (!rawInput.trim()) return;

    setIsProcessing(true);
    setError("");

    try {
      const response = await aiService.processBountyRequest(rawInput);
      setAiResponse(response);

      // Don't automatically apply suggestions - let user choose
    } catch (error) {
      console.error("AI processing error:", error);
      setError(
        "Failed to process your request with AI. Please try again or fill in the form manually."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply AI suggestions to the form
  const applyAISuggestions = () => {
    if (!aiResponse) return;

    setTitle(aiResponse.title);
    setDescription(aiResponse.description);
    setTags(aiResponse.tags);
    setAmount(aiResponse.suggestedPrice);
    setDeadline(aiResponse.suggestedDeadline);
  };

  // Add or remove a tag
  const toggleTag = (tag: string) => {
    setTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  // Create a bounty
  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isConnected) {
      openWalletModal();
      return;
    }

    if (!isNetworkSupported) {
      switchNetwork(DEFAULT_CHAIN_ID);
      return;
    }

    if (
      !title ||
      !description ||
      !amount ||
      !deadline ||
      !eventId ||
      !speakerId
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Prepare bounty data
      const bountyData: BountyCreationData = {
        eventId:
          bountyType === "performer-to-audience"
            ? `performer-${eventId}` // Prefix to indicate direction
            : eventId,
        speakerId,
        description: `${title}\n\n${description}\n\nTags: ${tags.join(", ")}`,
        amount,
        deadline: new Date(deadline).getTime(),
      };

      // Create bounty on blockchain
      const transaction = await bountyService.createBounty(bountyData);

      // Show success message
      setSuccessMessage(
        `Bounty created successfully! Transaction: ${transaction.hash}`
      );

      // Reset form
      setTitle("");
      setDescription("");
      setRawInput("");
      setAmount("");
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDeadline(defaultDate.toISOString().split("T")[0]);
      setEventId("");
      setSpeakerId("");
      setTags([]);
      setAiResponse(null);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error: unknown) {
      console.error("Failed to create bounty:", error);
      let userMessage = "Failed to create bounty. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "userMessage" in error &&
        typeof (error as { userMessage?: unknown }).userMessage === "string"
      ) {
        userMessage = (error as { userMessage: string }).userMessage;
      }
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Create a Bounty</h2>

      {/* Bounty Type Selection */}
      <div className={styles.bountyTypeSelection}>
        <button
          className={`${styles.typeButton} ${
            bountyType === "audience-to-performer" ? styles.active : ""
          }`}
          onClick={() => setBountyType("audience-to-performer")}
          type="button"
        >
          <span className={styles.typeIcon}>👂</span>
          <div className={styles.typeInfo}>
            <h3>Audience → Performer</h3>
            <p>Request specific content from performers</p>
          </div>
        </button>

        <button
          className={`${styles.typeButton} ${
            bountyType === "performer-to-audience" ? styles.active : ""
          }`}
          onClick={() => setBountyType("performer-to-audience")}
          type="button"
        >
          <span className={styles.typeIcon}>🎭</span>
          <div className={styles.typeInfo}>
            <h3>Performer → Audience</h3>
            <p>Request support or engagement from fans</p>
          </div>
        </button>
      </div>

      {/* AI-Assisted Description */}
      <div className={styles.aiAssistantSection}>
        <h3 className={styles.sectionTitle}>AI-Assisted Bounty Creation</h3>
        <div className={styles.aiInputArea}>
          <textarea
            placeholder="Describe what you're looking for in simple terms..."
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            className={styles.aiInput}
            rows={4}
          />
          <button
            className={styles.processButton}
            onClick={processWithAI}
            disabled={isProcessing || !rawInput.trim()}
            type="button"
          >
            {isProcessing ? "Processing..." : "Get Suggestions"}
          </button>
        </div>

        {aiResponse && (
          <div className={styles.aiSuggestions}>
            <h4>AI Suggestions:</h4>

            <div className={styles.suggestionItem}>
              <span className={styles.suggestionLabel}>Title:</span>
              <span className={styles.suggestionValue}>{aiResponse.title}</span>
            </div>

            <div className={styles.suggestionItem}>
              <span className={styles.suggestionLabel}>Description:</span>
              <p className={styles.suggestionValue}>{aiResponse.description}</p>
            </div>

            <div className={styles.suggestionItem}>
              <span className={styles.suggestionLabel}>Tags:</span>
              <div className={styles.suggestionTags}>
                {aiResponse.tags.map((tag) => (
                  <span key={tag} className={styles.suggestionTag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.suggestionItem}>
              <span className={styles.suggestionLabel}>Suggested Price:</span>
              <span className={styles.suggestionValue}>
                {aiResponse.suggestedPrice} MNT
              </span>
            </div>

            <div className={styles.suggestionItem}>
              <span className={styles.suggestionLabel}>
                Suggested Deadline:
              </span>
              <span className={styles.suggestionValue}>
                {aiResponse.suggestedDeadline}
              </span>
            </div>

            <button
              className={styles.applySuggestionsButton}
              onClick={applyAISuggestions}
              type="button"
            >
              Apply Suggestions
            </button>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleCreateBounty} className={styles.bountyForm}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Bounty Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="E.g., 'Create a remix of my latest track'"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Detailed Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            placeholder="Describe exactly what you're looking for..."
            rows={6}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tags</label>
          <div className={styles.tagsContainer}>
            {[
              "Music",
              "Audio",
              "Vocal",
              "Beat",
              "Remix",
              "Production",
              "Video",
              "Visual",
              "Animation",
              "Design",
              "Artwork",
              "Podcast",
              "Interview",
              "Writing",
              "Lyrics",
              "Translation",
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.tagButton} ${
                  tags.includes(tag) ? styles.activeTag : ""
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.label}>
              Reward Amount (MNT)
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.input}
              placeholder="e.g., 100"
              min="1"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="deadline" className={styles.label}>
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={styles.input}
              required
            />
          </div>
        </div>

        <button
          type="button"
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
        </button>

        {showAdvanced && (
          <div className={styles.advancedOptions}>
            <div className={styles.formGroup}>
              <label htmlFor="eventId" className={styles.label}>
                Event ID
              </label>
              <input
                id="eventId"
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className={styles.input}
                placeholder="Enter event ID"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="speakerId" className={styles.label}>
                {bountyType === "audience-to-performer"
                  ? "Performer ID"
                  : "Your Performer ID"}
              </label>
              <input
                id="speakerId"
                type="text"
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value)}
                className={styles.input}
                placeholder={
                  bountyType === "audience-to-performer"
                    ? "Enter performer ID"
                    : "Enter your performer ID"
                }
                required
              />
            </div>
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Creating Bounty..." : "Create Bounty"}
          </button>
        </div>

        <div className={styles.walletWarning}>
          {!isConnected && <p>Please connect your wallet to create a bounty</p>}
          {isConnected && !isNetworkSupported && (
            <p>Please switch to Mantle Sepolia network</p>
          )}
        </div>
      </form>
    </div>
  );
}
