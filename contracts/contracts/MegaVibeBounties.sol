// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MegaVibeBounties is ReentrancyGuard, Ownable {
    IERC20 public usdcToken;
    uint256 public constant PLATFORM_FEE_BPS = 500;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_BOUNTY_AMOUNT = 1e3; // 0.001 USDC
    uint256 public constant MAX_DEADLINE_DURATION = 30 days;
    uint256 public submissionStakeAmount = 1e6; // Stake 1 USDC to submit

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
    address public reputationContract;

    event BountyCreated(uint256 indexed bountyId, address indexed sponsor, uint256 reward, string eventId, string speakerId);
    event SubmissionReceived(uint256 indexed bountyId, uint256 indexed submissionId, address indexed claimant, string submissionHash);
    event SubmissionApproved(uint256 indexed bountyId, uint256 indexed submissionId, address indexed claimant);
    event SubmissionRejected(uint256 indexed bountyId, uint256 indexed submissionId, address indexed claimant);

    constructor(address _feeRecipient, address _usdcTokenAddress, address _reputationContract) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_usdcTokenAddress != address(0), "Invalid USDC token address");
        require(_reputationContract != address(0), "Invalid reputation contract address");
        feeRecipient = _feeRecipient;
        usdcToken = IERC20(_usdcTokenAddress);
        reputationContract = _reputationContract;
    }

    function createBounty(uint256 bountyAmount, string memory eventId, string memory speakerId, string memory description, uint256 deadline) external nonReentrant {
        require(bountyAmount >= MIN_BOUNTY_AMOUNT, "Bounty amount too small");
        require(deadline > block.timestamp, "Deadline must be in the future");

        require(usdcToken.transferFrom(msg.sender, address(this), bountyAmount), "USDC transfer failed");

        uint256 bountyId = bounties.length;
        bounties.push(Bounty({
            sponsor: msg.sender,
            reward: bountyAmount,
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
        Reputation(reputationContract).increaseReputation(msg.sender, 10);
        emit BountyCreated(bountyId, msg.sender, bountyAmount, eventId, speakerId);
    }

    function submitForBounty(uint256 bountyId, string memory submissionHash) external nonReentrant {
        require(bountyId < bounties.length, "Bounty does not exist");
        Bounty storage bounty = bounties[bountyId];
        require(!bounty.claimed, "Bounty already claimed");
        require(block.timestamp <= bounty.deadline, "Bounty has expired");

        require(usdcToken.transferFrom(msg.sender, address(this), submissionStakeAmount), "USDC stake transfer failed");

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

        require(usdcToken.transfer(submission.claimant, claimantAmount), "Reward transfer failed");
        require(usdcToken.transfer(submission.claimant, submissionStakeAmount), "Stake refund failed");

        Reputation(reputationContract).increaseReputation(submission.claimant, 25);
        emit SubmissionApproved(bountyId, submissionId, submission.claimant);
    }

    function rejectSubmission(uint256 bountyId, uint256 submissionId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.sponsor, "Only the sponsor can reject");
        Submission storage submission = submissions[bountyId][submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");

        submission.status = SubmissionStatus.Rejected;

        require(usdcToken.transfer(bounty.sponsor, submissionStakeAmount), "Stake refund to sponsor failed");

        Reputation(reputationContract).decreaseReputation(bounty.sponsor, 5);
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
