// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBounty
 * @dev Interface for the MegaVibeBounties contract
 * Defines the external functions for bounty functionality
 */
interface IBounty {
    /**
     * @dev Enum representing the status of a submission
     */
    enum SubmissionStatus { Pending, Approved, Rejected }

    /**
     * @dev Struct representing a submission for a bounty
     */
    struct Submission {
        address claimant;
        string submissionHash;
        SubmissionStatus status;
        uint256 submittedAt;
    }

    /**
     * @dev Struct representing a bounty
     */
    struct Bounty {
        address sponsor;
        uint256 reward;
        string eventId;
        string speakerId;
        string description;
        uint256 deadline;
        bool claimed;
        address claimant;
        string submissionHash;
        uint256 createdAt;
        uint submissionCount;
    }

    /**
     * @dev Emitted when a new bounty is created
     */
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed sponsor,
        uint256 reward,
        string eventId,
        string speakerId
    );

    /**
     * @dev Emitted when a submission is received for a bounty
     */
    event SubmissionReceived(
        uint256 indexed bountyId,
        uint256 indexed submissionId,
        address indexed claimant,
        string submissionHash
    );

    /**
     * @dev Emitted when a submission is approved
     */
    event SubmissionApproved(
        uint256 indexed bountyId,
        uint256 indexed submissionId,
        address indexed claimant
    );

    /**
     * @dev Emitted when a submission is rejected
     */
    event SubmissionRejected(
        uint256 indexed bountyId,
        uint256 indexed submissionId,
        address indexed claimant
    );

    /**
     * @dev Create a new bounty
     * @param bountyAmount Amount of USDC for the bounty reward
     * @param eventId Unique identifier for the event
     * @param speakerId Unique identifier for the speaker
     * @param description Description of the bounty
     * @param deadline Deadline for submissions
     */
    function createBounty(
        uint256 bountyAmount,
        string memory eventId,
        string memory speakerId,
        string memory description,
        uint256 deadline
    ) external;

    /**
     * @dev Submit for a bounty
     * @param bountyId ID of the bounty
     * @param submissionHash Hash or reference to the submission content
     */
    function submitForBounty(uint256 bountyId, string memory submissionHash) external;

    /**
     * @dev Approve a submission (sponsor only)
     * @param bountyId ID of the bounty
     * @param submissionId ID of the submission
     */
    function approveSubmission(uint256 bountyId, uint256 submissionId) external;

    /**
     * @dev Reject a submission (sponsor only)
     * @param bountyId ID of the bounty
     * @param submissionId ID of the submission
     */
    function rejectSubmission(uint256 bountyId, uint256 submissionId) external;

    /**
     * @dev Get submissions for a bounty
     * @param bountyId ID of the bounty
     * @return Array of submissions
     */
    function getSubmissionsForBounty(uint256 bountyId) external view returns (Submission[] memory);

    /**
     * @dev Get bounty details
     * @param bountyId ID of the bounty
     * @return Bounty details
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory);

    /**
     * @dev Get active bounties for an event
     * @param eventId Event identifier
     * @return Array of active bounties
     */
    function getActiveBountiesForEvent(string memory eventId) external view returns (Bounty[] memory);
}