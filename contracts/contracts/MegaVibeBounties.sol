// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MegaVibeBounties
 * @dev Smart contract for creating and claiming bounties for content creation
 * Integrates with the tipping system to allow speakers to convert tips into bounties
 */
contract MegaVibeBounties is ReentrancyGuard, Ownable {
    // Platform fee percentage (5% = 500 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 500;
    uint256 public constant BASIS_POINTS = 10000;

    // Minimum bounty amount to prevent spam (0.001 MNT)
    uint256 public constant MIN_BOUNTY_AMOUNT = 1e15;

    // Maximum deadline duration (30 days)
    uint256 public constant MAX_DEADLINE_DURATION = 30 days;

    struct Bounty {
        address sponsor;
        uint256 reward;
        string eventId;
        string speakerId;
        string description;
        uint256 deadline;
        bool claimed;
        address claimant;
        string submissionHash; // IPFS hash of the submission
        uint256 createdAt;
    }

    // Storage
    Bounty[] public bounties;
    mapping(string => uint256[]) public eventBounties;
    mapping(string => uint256[]) public speakerBounties;
    mapping(address => uint256[]) public sponsorBounties;
    mapping(address => uint256[]) public claimantBounties;

    // Platform fee collection
    uint256 public platformFeeCollected;
    address public feeRecipient;

    // Events
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed sponsor,
        uint256 reward,
        string eventId,
        string speakerId,
        string description,
        uint256 deadline
    );

    event BountyClaimed(
        uint256 indexed bountyId,
        address indexed claimant,
        string submissionHash,
        uint256 timestamp
    );

    event BountyExpired(
        uint256 indexed bountyId,
        uint256 timestamp
    );

    event PlatformFeeWithdrawn(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new bounty
     * @param eventId Unique identifier for the event
     * @param speakerId Unique identifier for the speaker
     * @param description Description of what content is needed
     * @param deadline UNIX timestamp when bounty expires
     */
    function createBounty(
        string memory eventId,
        string memory speakerId,
        string memory description,
        uint256 deadline
    ) external payable nonReentrant {
        require(msg.value >= MIN_BOUNTY_AMOUNT, "Bounty amount too small");
        require(bytes(eventId).length > 0, "Event ID required");
        require(bytes(speakerId).length > 0, "Speaker ID required");
        require(bytes(description).length > 0, "Description required");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(deadline <= block.timestamp + MAX_DEADLINE_DURATION, "Deadline too far in future");

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
            createdAt: block.timestamp
        }));

        // Update mappings
        eventBounties[eventId].push(bountyId);
        speakerBounties[speakerId].push(bountyId);
        sponsorBounties[msg.sender].push(bountyId);

        emit BountyCreated(
            bountyId,
            msg.sender,
            msg.value,
            eventId,
            speakerId,
            description,
            deadline
        );
    }

    /**
     * @dev Claim a bounty with content submission
     * @param bountyId The bounty to claim
     * @param submissionHash IPFS hash of the submitted content
     */
    function claimBounty(
        uint256 bountyId,
        string memory submissionHash
    ) external nonReentrant {
        require(bountyId < bounties.length, "Bounty does not exist");
        require(bytes(submissionHash).length > 0, "Submission hash required");

        Bounty storage bounty = bounties[bountyId];
        require(block.timestamp <= bounty.deadline, "Bounty expired");
        require(!bounty.claimed, "Bounty already claimed");
        require(bounty.sponsor != msg.sender, "Cannot claim own bounty");

        // Calculate platform fee
        uint256 platformFee = (bounty.reward * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 claimantAmount = bounty.reward - platformFee;

        // Update bounty state
        bounty.claimed = true;
        bounty.claimant = msg.sender;
        bounty.submissionHash = submissionHash;

        // Update mappings
        claimantBounties[msg.sender].push(bountyId);

        // Collect platform fee
        platformFeeCollected += platformFee;

        // Transfer reward to claimant
        (bool success, ) = payable(msg.sender).call{value: claimantAmount}("");
        require(success, "Transfer failed");

        emit BountyClaimed(bountyId, msg.sender, submissionHash, block.timestamp);
    }

    /**
     * @dev Reclaim expired bounty (sponsor only)
     * @param bountyId The bounty to reclaim
     */
    function reclaimExpiredBounty(uint256 bountyId) external nonReentrant {
        require(bountyId < bounties.length, "Bounty does not exist");

        Bounty storage bounty = bounties[bountyId];
        require(bounty.sponsor == msg.sender, "Only sponsor can reclaim");
        require(block.timestamp > bounty.deadline, "Bounty not expired yet");
        require(!bounty.claimed, "Bounty already claimed");

        // Mark as expired
        bounty.claimed = true; // Prevent further claims

        // Return full amount to sponsor (no platform fee for expired bounties)
        (bool success, ) = payable(msg.sender).call{value: bounty.reward}("");
        require(success, "Transfer failed");

        emit BountyExpired(bountyId, block.timestamp);
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeeCollected;
        require(amount > 0, "No fees to withdraw");

        platformFeeCollected = 0;

        (bool success, ) = payable(feeRecipient).call{value: amount}("");
        require(success, "Fee withdrawal failed");

        emit PlatformFeeWithdrawn(feeRecipient, amount, block.timestamp);
    }

    /**
     * @dev Update fee recipient address (owner only)
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient address");
        feeRecipient = _newRecipient;
    }

    /**
     * @dev Get bounties for a specific event
     * @param eventId The event identifier
     * @return Array of bounty IDs for the event
     */
    function getEventBounties(string memory eventId) external view returns (uint256[] memory) {
        return eventBounties[eventId];
    }

    /**
     * @dev Get bounties for a specific speaker
     * @param speakerId The speaker identifier
     * @return Array of bounty IDs for the speaker
     */
    function getSpeakerBounties(string memory speakerId) external view returns (uint256[] memory) {
        return speakerBounties[speakerId];
    }

    /**
     * @dev Get bounties created by a sponsor
     * @param sponsor The sponsor address
     * @return Array of bounty IDs created by the sponsor
     */
    function getSponsorBounties(address sponsor) external view returns (uint256[] memory) {
        return sponsorBounties[sponsor];
    }

    /**
     * @dev Get bounties claimed by an address
     * @param claimant The claimant address
     * @return Array of bounty IDs claimed by the address
     */
    function getClaimantBounties(address claimant) external view returns (uint256[] memory) {
        return claimantBounties[claimant];
    }

    /**
     * @dev Get bounty details by ID
     * @param bountyId The bounty identifier
     * @return Bounty struct data
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        require(bountyId < bounties.length, "Bounty does not exist");
        return bounties[bountyId];
    }

    /**
     * @dev Get active bounties for an event
     * @param eventId The event identifier
     * @return Array of active bounty data
     */
    function getActiveBountiesForEvent(string memory eventId) 
        external 
        view 
        returns (Bounty[] memory) 
    {
        uint256[] memory bountyIds = eventBounties[eventId];
        uint256 activeCount = 0;

        // Count active bounties
        for (uint256 i = 0; i < bountyIds.length; i++) {
            Bounty memory bounty = bounties[bountyIds[i]];
            if (!bounty.claimed && block.timestamp <= bounty.deadline) {
                activeCount++;
            }
        }

        // Create array of active bounties
        Bounty[] memory activeBounties = new Bounty[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < bountyIds.length; i++) {
            Bounty memory bounty = bounties[bountyIds[i]];
            if (!bounty.claimed && block.timestamp <= bounty.deadline) {
                activeBounties[index] = bounty;
                index++;
            }
        }

        return activeBounties;
    }

    /**
     * @dev Get total number of bounties
     * @return Total bounty count
     */
    function getTotalBounties() external view returns (uint256) {
        return bounties.length;
    }

    /**
     * @dev Get platform statistics
     * @return totalVolume Total bounty volume processed
     * @return totalBounties Total number of bounties
     * @return activeBounties Number of active bounties
     * @return platformFees Total platform fees collected
     */
    function getPlatformStats()
        external
        view
        returns (
            uint256 totalVolume,
            uint256 totalBounties,
            uint256 activeBounties,
            uint256 platformFees
        )
    {
        totalBounties = bounties.length;
        platformFees = platformFeeCollected;
        
        for (uint256 i = 0; i < bounties.length; i++) {
            totalVolume += bounties[i].reward;
            if (!bounties[i].claimed && block.timestamp <= bounties[i].deadline) {
                activeBounties++;
            }
        }
    }

    /**
     * @dev Fallback function to reject direct ETH deposits
     */
    receive() external payable {
        revert("Direct deposits not allowed. Use createBounty function.");
    }
}
