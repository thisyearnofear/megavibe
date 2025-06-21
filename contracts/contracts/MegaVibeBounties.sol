// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MegaVibeBounties is ReentrancyGuard, Ownable {
    uint256 public constant PLATFORM_FEE_BPS = 500;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_BOUNTY_AMOUNT = 1e15;
    uint256 public constant MAX_DEADLINE_DURATION = 30 days;
    uint256 public submissionStakeAmount = 1 ether; // Stake 1 MNT to submit

    enum SubmissionStatus { Pending, Approved, Rejected }

    struct Submission {
        address claimant;
        string submissionHash;
        SubmissionStatus status;
        uint256 submittedAt;
    }

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

    Bounty[] public bounties;
    mapping(uint256 => Submission[]) public submissions;
    mapping(string => uint256[]) public eventBounties;
    mapping(address => uint256[]) public sponsorBounties;

    uint256 public platformFeeCollected;
    address public feeRecipient;

    event BountyCreated(uint256 indexed bountyId, address indexed sponsor, uint256 reward, string eventId, string speakerId);
    event SubmissionReceived(uint256 indexed bountyId, uint256 indexed submissionId, address indexed claimant, string submissionHash);
    event SubmissionApproved(uint256 indexed bountyId, uint256 indexed submissionId, address indexed claimant);
    event SubmissionRejected(uint256 indexed bountyId, uint256 indexed submissionId, address indexed claimant);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    function createBounty(string memory eventId, string memory speakerId, string memory description, uint256 deadline) external payable nonReentrant {
        require(msg.value >= MIN_BOUNTY_AMOUNT, "Bounty amount too small");
        require(deadline > block.timestamp, "Deadline must be in the future");
        uint256 bountyId = bounties.length;
        bounties.push(Bounty({
            sponsor: msg.sender,
            reward: msg.value,
            eventId: eventId,
            speakerId: speakerId,
            description: description,
            deadline: deadline,
            claimed: false,
            claimant: address(0),
            submissionHash: "",
            createdAt: block.timestamp,
            submissionCount: 0
        }));
        eventBounties[eventId].push(bountyId);
        sponsorBounties[msg.sender].push(bountyId);
        emit BountyCreated(bountyId, msg.sender, msg.value, eventId, speakerId);
    }

    function submitForBounty(uint256 bountyId, string memory submissionHash) external payable nonReentrant {
        require(bountyId < bounties.length, "Bounty does not exist");
        require(msg.value == submissionStakeAmount, "Incorrect stake amount");
        Bounty storage bounty = bounties[bountyId];
        require(!bounty.claimed, "Bounty already claimed");
        require(block.timestamp <= bounty.deadline, "Bounty has expired");

        uint submissionId = submissions[bountyId].length;
        submissions[bountyId].push(Submission({
            claimant: msg.sender,
            submissionHash: submissionHash,
            status: SubmissionStatus.Pending,
            submittedAt: block.timestamp
        }));
        bounty.submissionCount++;
        emit SubmissionReceived(bountyId, submissionId, msg.sender, submissionHash);
    }

    function approveSubmission(uint256 bountyId, uint256 submissionId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.sponsor, "Only the sponsor can approve");
        require(!bounty.claimed, "Bounty already claimed");
        Submission storage submission = submissions[bountyId][submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");

        bounty.claimed = true;
        bounty.claimant = submission.claimant;
        bounty.submissionHash = submission.submissionHash;
        submission.status = SubmissionStatus.Approved;

        uint256 platformFee = (bounty.reward * PLATFORM_FEE_BPS) / BASIS_POINTS;
        platformFeeCollected += platformFee;
        uint256 claimantAmount = bounty.reward - platformFee;

        (bool success, ) = payable(submission.claimant).call{value: claimantAmount}("");
        require(success, "Reward transfer failed");

        (success, ) = payable(submission.claimant).call{value: submissionStakeAmount}("");
        require(success, "Stake refund failed");

        emit SubmissionApproved(bountyId, submissionId, submission.claimant);
    }

    function rejectSubmission(uint256 bountyId, uint256 submissionId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.sponsor, "Only the sponsor can reject");
        Submission storage submission = submissions[bountyId][submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");

        submission.status = SubmissionStatus.Rejected;

        (bool success, ) = payable(submission.claimant).call{value: submissionStakeAmount}("");
        require(success, "Stake refund failed");

        emit SubmissionRejected(bountyId, submissionId, submission.claimant);
    }
    
    function getSubmissionsForBounty(uint256 bountyId) external view returns (Submission[] memory) {
        return submissions[bountyId];
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        require(bountyId < bounties.length, "Bounty does not exist");
        return bounties[bountyId];
    }
    
    function getActiveBountiesForEvent(string memory eventId) external view returns (Bounty[] memory) {
        uint256[] memory bountyIds = eventBounties[eventId];
        uint256 activeCount = 0;
        for (uint i = 0; i < bountyIds.length; i++) {
            if (!bounties[bountyIds[i]].claimed && block.timestamp <= bounties[bountyIds[i]].deadline) {
                activeCount++;
            }
        }
        Bounty[] memory activeBounties = new Bounty[](activeCount);
        uint256 index = 0;
        for (uint i = 0; i < bountyIds.length; i++) {
            if (!bounties[bountyIds[i]].claimed && block.timestamp <= bounties[bountyIds[i]].deadline) {
                activeBounties[index] = bounties[bountyIds[i]];
                index++;
            }
        }
        return activeBounties;
    }
}
