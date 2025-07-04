import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaUpload,
  FaFile,
  FaTrash,
  FaClock,
  FaUser,
  FaEthereum,
} from "react-icons/fa";
import { BsPinAngleFill, BsTagsFill } from "react-icons/bs";
import { format } from "date-fns";

import styles from "./BountySubmissionForm.module.css";
import Button from "../ui/Button";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import WalletConnect from "../wallet/WalletConnect";
import { bountyService } from "@/services/blockchain/bountyService";
import { uploadToFilCDN } from "@/services/filcdn/filcdnService";
import { BountyDetails, BountySubmission } from "@/services/blockchain/types";
import {
  formatAddress,
  formatEthAmount,
  formatFileSize,
} from "@/utils/formatting";

interface BountySubmissionFormProps {
  bountyId: string;
  bountyDetails?: BountyDetails;
  onSuccess?: () => void;
}

export default function BountySubmissionForm({
  bountyId,
  bountyDetails,
  onSuccess,
}: BountySubmissionFormProps) {
  const router = useRouter();
  const { walletAddress, isConnected, connectWallet } = useWalletConnection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [bountyData, setBountyData] = useState<BountyDetails | null>(
    bountyDetails || null
  );
  const [files, setFiles] = useState<File[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    contentLink: string;
  }>({
    title: "",
    description: "",
    contentLink: "",
  });

  // Fetch bounty details if not provided
  useEffect(() => {
    const fetchBountyDetails = async () => {
      if (!bountyDetails && bountyId) {
        try {
          setLoading(true);
          const details = await bountyService.getBountyDetails(bountyId);
          setBountyData(details);
          setLoading(false);
        } catch (err) {
          setError("Failed to load bounty details. Please try again.");
          setLoading(false);
          console.error("Error fetching bounty details:", err);
        }
      }
    };

    fetchBountyDetails();
  }, [bountyId, bountyDetails]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    if (!formData.title || !formData.description) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload files to FilCDN if any
      let contentCID = "";
      if (files.length > 0) {
        contentCID = await uploadToFilCDN(files);
      }

      // Prepare submission data
      const submissionData: BountySubmission = {
        bountyId,
        title: formData.title,
        description: formData.description,
        contentCID: contentCID || formData.contentLink,
        submitter: walletAddress || "",
      };

      // Submit to blockchain
      const tx = await bountyService.submitBountyResponse(submissionData);
      await tx.wait();

      setSuccess(true);
      setLoading(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/bounties/${bountyId}`);
      }, 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit response. Please try again.");
      setLoading(false);
      console.error("Error submitting bounty response:", err);
    }
  };

  if (loading && !bountyData) {
    return (
      <div className={styles.submissionContainer}>
        <h2 className={styles.submissionTitle}>Loading Bounty Details...</h2>
      </div>
    );
  }

  if (error && !bountyData) {
    return (
      <div className={styles.submissionContainer}>
        <h2 className={styles.submissionTitle}>Error</h2>
        <div className={styles.errorMessage}>{error}</div>
        <div className={styles.formActions}>
          <Button
            onClick={() => router.push("/bounties")}
            className={styles.submitButton}
          >
            Back to Bounties
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.submissionContainer}>
        <h2 className={styles.submissionTitle}>Submission Successful!</h2>
        <div className={styles.successMessage}>
          <p>
            Your response has been submitted successfully. Redirecting to bounty
            details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.submissionContainer}>
      <h2 className={styles.submissionTitle}>Submit a Response</h2>
      <p className={styles.submissionSubtitle}>
        Create a compelling submission to earn this bounty reward
      </p>

      {/* Bounty Info Card */}
      {bountyData && (
        <div className={styles.bountyInfoCard}>
          <div className={styles.bountyInfoHeader}>
            <h3 className={styles.bountyInfoTitle}>{bountyData.title}</h3>
            <div className={styles.bountyReward}>
              <FaEthereum className={styles.bountyRewardIcon} />
              <span>{formatEthAmount(bountyData.amount)} MNT</span>
            </div>
          </div>

          <p className={styles.bountyDescription}>{bountyData.description}</p>

          <div className={styles.bountyMetadata}>
            <div className={styles.metadataItem}>
              <FaUser className={styles.metadataIcon} />
              <span>By {formatAddress(bountyData.creator)}</span>
            </div>
            <div className={styles.metadataItem}>
              <FaClock className={styles.metadataIcon} />
              <span>
                Deadline:{" "}
                {bountyData.deadline
                  ? format(new Date(bountyData.deadline), "MMM dd, yyyy")
                  : "No deadline"}
              </span>
            </div>
            <div className={styles.metadataItem}>
              <BsPinAngleFill className={styles.metadataIcon} />
              <span>{bountyData.submissionsCount || 0} submissions</span>
            </div>
          </div>

          {bountyData.tags && bountyData.tags.length > 0 && (
            <div className={styles.bountyTags}>
              {bountyData.tags.map((tag, index) => (
                <span key={index} className={styles.bountyTag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wallet Connection Check */}
      {!isConnected ? (
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Connect Your Wallet</h3>
          <p>
            You need to connect your wallet to submit a response to this bounty.
          </p>
          <div style={{ marginTop: "1rem" }}>
            <WalletConnect />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.submissionForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Submission Details */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Submission Details</h3>

            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Give your submission a descriptive title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Describe your submission and how it meets the bounty requirements"
                rows={5}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contentLink" className={styles.label}>
                External Content Link (Optional)
              </label>
              <input
                type="text"
                id="contentLink"
                name="contentLink"
                value={formData.contentLink}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="e.g., https://github.com/yourusername/repo"
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Upload Files</h3>
            <div
              className={styles.fileUploadArea}
              onClick={handleFileUploadClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className={styles.fileInput}
                multiple
              />
              <FaUpload className={styles.fileUploadIcon} />
              <h4 className={styles.fileUploadTitle}>
                Drag & Drop or Click to Upload
              </h4>
              <p className={styles.fileUploadSubtitle}>
                Supported formats: JPG, PNG, PDF, ZIP (Max 50MB)
              </p>
            </div>

            {files.length > 0 && (
              <div className={styles.uploadedFiles}>
                {files.map((file, index) => (
                  <div key={index} className={styles.uploadedFileItem}>
                    <div className={styles.fileInfo}>
                      <FaFile className={styles.fileIcon} />
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileSize}>
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className={styles.removeFileButton}
                      aria-label="Remove file"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className={styles.formSection}>
            <div className={styles.termsCheckbox}>
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className={styles.checkbox}
                required
              />
              <label htmlFor="terms" className={styles.termsText}>
                I confirm that this submission is my original work, and I have
                the right to submit it. I understand that by submitting, I agree
                to the{" "}
                <a
                  href="/terms"
                  className={styles.termsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms and Conditions
                </a>{" "}
                of MegaVibe.
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !isConnected || !agreeToTerms}
            >
              {loading ? "Submitting..." : "Submit Response"}
            </button>

            {!isConnected && (
              <p className={styles.walletWarning}>
                You must connect your wallet to submit a response.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
