"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaEthereum,
  FaClock,
  FaUser,
  FaLink,
  FaArrowLeft,
} from "react-icons/fa";
import styles from "./page.module.css";
import Button from "@/components/ui/Button";
import BountySubmissionForm from "@/components/bounties/BountySubmissionForm";
import { formatAddress, formatEthAmount, formatDate } from "@/utils/formatting";
import { bountyService } from "@/services/blockchain";
import {
  BountyDetails,
  BountyStatus,
  BountySubmission,
} from "@/services/blockchain/types";
import { useWalletConnection } from "@/hooks/useWalletConnection";

// Mock type for attachments until we update the interfaces
interface Attachment {
  name: string;
  url: string;
}

// Extended types to handle UI needs
interface ExtendedBountyDetails extends BountyDetails {
  reward: string;
  imageUrl?: string;
  attachments?: Attachment[];
}

interface ExtendedBountySubmission extends BountySubmission {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  timestamp: number;
  attachments?: Attachment[];
}

export default function BountyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { walletAddress: account } = useWalletConnection();
  const [bounty, setBounty] = useState<ExtendedBountyDetails | null>(null);
  const [submissions, setSubmissions] = useState<ExtendedBountySubmission[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  useEffect(() => {
    const fetchBountyDetails = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const bountyId = Array.isArray(id) ? id[0] : id;
        const bountyDetails = await bountyService.getBountyDetails(bountyId);

        // Extend the bounty details with UI-specific properties
        const extendedDetails: ExtendedBountyDetails = {
          ...bountyDetails,
          reward: bountyDetails.amount, // Map amount to reward for UI
          // Mock image URL - would come from metadata in real implementation
          imageUrl:
            bountyDetails.type === "audience-to-performer"
              ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop",
          // Mock attachments - would come from IPFS/FilCDN in real implementation
          attachments:
            bountyDetails.type === "audience-to-performer"
              ? [
                  {
                    name: "Reference Document.pdf",
                    url: "https://example.com/document.pdf",
                  },
                  {
                    name: "Example.mp3",
                    url: "https://example.com/example.mp3",
                  },
                ]
              : [],
        };

        setBounty(extendedDetails);

        // Mock submissions data - would come from contract in real implementation
        if (bountyDetails.creator.toLowerCase() === account?.toLowerCase()) {
          // This would be a real API call in production: await bountyService.getBountySubmissions(bountyId);
          const mockSubmissions: ExtendedBountySubmission[] = [
            {
              bountyId: bountyId,
              title: "First Submission",
              description:
                "This is my submission for the bounty. I have created exactly what was requested.",
              contentCID: "QmXyz123",
              submitter: "0x1234567890123456789012345678901234567890",
              id: "1",
              status: "PENDING",
              timestamp: Date.now() - 86400000, // 1 day ago
              attachments: [
                {
                  name: "Submission.pdf",
                  url: "https://example.com/submission.pdf",
                },
              ],
            },
          ];
          setSubmissions(mockSubmissions);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching bounty details:", err);
        setError("Failed to load bounty details. Please try again later.");
        setLoading(false);
      }
    };

    if (id) {
      fetchBountyDetails();
    }
  }, [id, account]);

  const handleSubmit = async () => {
    setShowSubmitForm(true);
  };

  const handleBack = () => {
    router.back();
  };

  // Mock functions for submission actions - would call contract in real implementation
  const acceptSubmission = async (bountyId: string, submissionId: string) => {
    console.log(`Accepting submission ${submissionId} for bounty ${bountyId}`);
    // In a real implementation:
    // await bountyService.acceptSubmission(bountyId, submissionId);

    // Update local state for demo purposes
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId ? { ...sub, status: "ACCEPTED" } : sub
      )
    );
  };

  const rejectSubmission = async (bountyId: string, submissionId: string) => {
    console.log(`Rejecting submission ${submissionId} for bounty ${bountyId}`);
    // In a real implementation:
    // await bountyService.rejectSubmission(bountyId, submissionId);

    // Update local state for demo purposes
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId ? { ...sub, status: "REJECTED" } : sub
      )
    );
  };

  // Mock function for canceling bounty - would call contract in real implementation
  const cancelBounty = async (bountyId: string) => {
    console.log(`Canceling bounty ${bountyId}`);
    // In a real implementation:
    // await bountyService.cancelBounty(bountyId);

    // Navigate back for demo purposes
    router.back();
  };

  const isCreator =
    bounty && account && bounty.creator.toLowerCase() === account.toLowerCase();
  const canSubmit =
    bounty && account && !isCreator && bounty.status === BountyStatus.OPEN;
  const hasExpired =
    bounty && bounty.deadline
      ? new Date(bounty.deadline * 1000) < new Date()
      : false;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading bounty details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className={styles.errorContainer}>
        <h2>Bounty Not Found</h2>
        <p>The bounty you're looking for doesn't exist or has been removed.</p>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <button onClick={handleBack} className={styles.backButton}>
          <FaArrowLeft /> Back to Bounties
        </button>

        <div className={styles.header}>
          <div className={styles.bountyInfo}>
            <h1 className={styles.title}>{bounty.title}</h1>

            <div className={styles.metaInfo}>
              <div className={styles.creator}>
                <FaUser />
                <span>Created by {formatAddress(bounty.creator)}</span>
              </div>

              <div className={styles.reward}>
                <FaEthereum />
                <span>{formatEthAmount(bounty.reward)} ETH</span>
              </div>

              <div className={styles.deadline}>
                <FaClock />
                <span>
                  {bounty.deadline
                    ? formatDate(bounty.deadline * 1000)
                    : "No deadline"}
                </span>
                {hasExpired && <span className={styles.expired}>Expired</span>}
              </div>
            </div>
          </div>

          {bounty.imageUrl && (
            <div className={styles.imageContainer}>
              <Image
                src={bounty.imageUrl}
                alt={bounty.title}
                fill
                className={styles.image}
              />
            </div>
          )}
        </div>

        <div className={styles.descriptionContainer}>
          <h2>Description</h2>
          <div className={styles.description}>
            {bounty.description.split("\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        {bounty.attachments && bounty.attachments.length > 0 && (
          <div className={styles.attachmentsContainer}>
            <h2>Attachments</h2>
            <div className={styles.attachments}>
              {bounty.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.attachment}
                >
                  <FaLink />
                  <span>{attachment.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {isCreator && submissions.length > 0 && (
          <div className={styles.submissionsContainer}>
            <h2>Submissions ({submissions.length})</h2>
            <div className={styles.submissions}>
              {submissions.map((submission, index) => (
                <div key={index} className={styles.submissionCard}>
                  <div className={styles.submissionHeader}>
                    <h3>
                      Submission from {formatAddress(submission.submitter)}
                    </h3>
                    <span className={styles.submissionDate}>
                      {formatDate(submission.timestamp)}
                    </span>
                  </div>
                  <p className={styles.submissionDescription}>
                    {submission.description}
                  </p>
                  {submission.attachments &&
                    submission.attachments.length > 0 && (
                      <div className={styles.submissionAttachments}>
                        <h4>Attachments</h4>
                        {submission.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.attachment}
                          >
                            <FaLink />
                            <span>{attachment.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  {submission.status === "PENDING" && (
                    <div className={styles.submissionActions}>
                      <Button
                        onClick={() =>
                          acceptSubmission(bounty.id, submission.id)
                        }
                        variant="primary"
                      >
                        Accept & Pay Reward
                      </Button>
                      <Button
                        onClick={() =>
                          rejectSubmission(bounty.id, submission.id)
                        }
                        variant="secondary"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {submission.status === "ACCEPTED" && (
                    <div className={styles.submissionStatus}>
                      <span className={styles.accepted}>Accepted</span>
                    </div>
                  )}
                  {submission.status === "REJECTED" && (
                    <div className={styles.submissionStatus}>
                      <span className={styles.rejected}>Rejected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actionsContainer}>
          {canSubmit && !hasExpired && !showSubmitForm && (
            <Button onClick={handleSubmit} variant="primary">
              Submit Response
            </Button>
          )}

          {isCreator && (
            <>
              <Button
                onClick={() => router.push(`/bounties/edit/${bounty.id}`)}
                variant="secondary"
              >
                Edit Bounty
              </Button>
              {bounty.status === BountyStatus.OPEN && (
                <Button
                  onClick={() => cancelBounty(bounty.id)}
                  variant="danger"
                >
                  Cancel Bounty
                </Button>
              )}
            </>
          )}
        </div>

        {showSubmitForm && (
          <div className={styles.submissionForm}>
            <h2>Submit Your Response</h2>
            <BountySubmissionForm
              bountyId={bounty.id}
              bountyDetails={bounty}
              onSuccess={() => {
                setShowSubmitForm(false);
                router.refresh();
              }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
