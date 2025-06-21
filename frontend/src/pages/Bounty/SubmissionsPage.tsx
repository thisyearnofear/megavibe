import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import contractService from '../../services/contractService';
import { PageLayout } from '../../components/Layout/PageLayout';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { SkeletonCard } from '../../components/Loading/SkeletonCard';
import './SubmissionsPage.css';

interface Submission {
  claimant: string;
  submissionHash: string;
  status: number; // 0: Pending, 1: Approved, 2: Rejected
  submittedAt: number;
}

interface Bounty {
    sponsor: string;
    reward: string;
    description: string;
    deadline: number;
    claimed: boolean;
}

export const SubmissionsPage: React.FC = () => {
  const { bountyId } = useParams<{ bountyId: string }>();
  const { address } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!bountyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const bountyData = await contractService.getBounty(parseInt(bountyId, 10));
      setBounty(bountyData);
      const submissionData = await contractService.getSubmissionsForBounty(parseInt(bountyId, 10));
      setSubmissions(submissionData);
    } catch (err: any) {
      setError('Failed to load bounty submissions.');
    } finally {
      setIsLoading(false);
    }
  }, [bountyId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = async (submissionId: number) => {
    if (!bountyId) return;
    try {
      await contractService.approveSubmission(parseInt(bountyId, 10), submissionId);
      fetchSubmissions();
    } catch (err: any) {
      setError('Failed to approve submission.');
    }
  };

  const handleReject = async (submissionId: number) => {
    if (!bountyId) return;
    try {
      await contractService.rejectSubmission(parseInt(bountyId, 10), submissionId);
      fetchSubmissions();
    } catch (err: any) {
      setError('Failed to reject submission.');
    }
  };

  const renderSubmissionCard = (submission: Submission, index: number) => (
    <Card key={index} className="submission-card">
      <div className="submission-header">
        <span className="submission-claimant">
          Claimant: {`${submission.claimant.slice(0, 6)}...${submission.claimant.slice(-4)}`}
        </span>
        <span className={`submission-status status-${submission.status}`}>
          {['Pending', 'Approved', 'Rejected'][submission.status]}
        </span>
      </div>
      <div className="submission-content">
        <a href={submission.submissionHash} target="_blank" rel="noopener noreferrer">
          {submission.submissionHash}
        </a>
      </div>
      {bounty?.sponsor === address && submission.status === 0 && (
        <div className="submission-actions">
          <Button onClick={() => handleApprove(index)} variant="primary" size="sm">Approve</Button>
          <Button onClick={() => handleReject(index)} variant="secondary" size="sm">Reject</Button>
        </div>
      )}
    </Card>
  );

  return (
    <PageLayout title={`Submissions for Bounty #${bountyId}`} subtitle={bounty?.description || ''}>
      <div className="submissions-list">
        {isLoading && <SkeletonCard />}
        {!isLoading && error && <div className="error-container">{error}</div>}
        {!isLoading && !error && submissions.length > 0 ? (
          submissions.map(renderSubmissionCard)
        ) : (
          <div className="empty-state">No submissions yet.</div>
        )}
      </div>
      <Link to="/bounties" className="back-link">Back to Bounties</Link>
    </PageLayout>
  );
};