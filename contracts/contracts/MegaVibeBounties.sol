// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IBounty.sol";
import "./interfaces/IReputation.sol";

/**
 * @title MegaVibeBounties
 * @dev Smart contract for creating and managing content bounties
 * Includes emergency pause, parameter governance, and security enhancements
 */
contract MegaVibeBounties is IBounty, ReentrancyGuard, Ownable, Pausable {
    // USDC token contract
    IERC20 public usdcToken;
    
    // Fee and pricing constants (now adjustable)
    uint256 public platformFeeBps = 500;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public minBountyAmount = 1e3; // 0.001 USDC
    uint256 public maxDeadlineDuration = 30 days;
    uint256 public submissionStakeAmount = 1e6; // Stake 1 USDC to submit

    // Timelock duration for parameter changes
    uint256 public constant TIMELOCK_DURATION = 1 days;
    
    // Parameter change proposals
    struct ParameterProposal {
        uint256 value;
        uint256 timestamp;
        bool executed;
    }
    
    // Storage
    Bounty[] public bounties;
    mapping(uint256 => Submission[]) public submissions;
    mapping(string => uint256[]) public eventBounties;
    mapping(address => uint256[]) public sponsorBounties;
    mapping(address => uint256[]) public claimantSubmissions;
    
    // Platform fee collection
    uint256 public platformFeeCollected;
    address public feeRecipient;
    address public reputationContract;
    
    // Emergency recovery
    address public emergencyRecoveryAddress;
    
    // Parameter governance
    mapping(string => ParameterProposal) public parameterProposals;
    
    // Additional events
    event ParameterChangeProposed(string parameter, uint256 value, uint256 executeAfter);
    event ParameterChangeExecuted(string parameter, uint256 oldValue, uint256 newValue);
    event EmergencyRecoveryUpdated(address indexed oldAddress, address indexed newAddress);
    event BountyStakeRefunded(uint256 indexed bountyId, address indexed sponsor, uint256 amount);

    /**
     * @dev Constructor initializes the contract with required addresses
     * @param _feeRecipient Address to receive platform fees
     * @param _usdcTokenAddress USDC token contract address
     * @param _reputationContract Reputation contract address
     * @param _emergencyRecoveryAddress Address for emergency fund recovery
     */
    constructor(
        address _feeRecipient,
        address _usdcTokenAddress,
        address _reputationContract,
        address _emergencyRecoveryAddress
    ) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_usdcTokenAddress != address(0), "Invalid USDC token address");
        require(_reputationContract != address(0), "Invalid reputation contract address");
        require(_emergencyRecoveryAddress != address(0), "Invalid emergency recovery address");
        
        feeRecipient = _feeRecipient;
        usdcToken = IERC20(_usdcTokenAddress);
        reputationContract = _reputationContract;
        emergencyRecoveryAddress = _emergencyRecoveryAddress;
    }

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
    ) external nonReentrant whenNotPaused override {
        require(bountyAmount >= minBountyAmount, "Bounty amount too small");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(deadline <= block.timestamp + maxDeadlineDuration, "Deadline too far in future");
        require(bytes(eventId).length > 0, "Event ID required");
        require(bytes(speakerId).length > 0, "Speaker ID required");
        require(bytes(description).length > 0, "Description required");
        require(bytes(description).length <= 1000, "Description too long");

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
        
        // Update reputation
        IReputation(reputationContract).increaseReputation(msg.sender, 10);
        
        emit BountyCreated(bountyId, msg.sender, bountyAmount, eventId, speakerId);
    }

    /**
     * @dev Submit for a bounty
     * @param bountyId ID of the bounty
     * @param submissionHash Hash or reference to the submission content
     */
    function submitForBounty(uint256 bountyId, string memory submissionHash) external nonReentrant whenNotPaused override {
        require(bountyId < bounties.length, "Bounty does not exist");
        Bounty storage bounty = bounties[bountyId];
        require(!bounty.claimed, "Bounty already claimed");
        require(block.timestamp <= bounty.deadline, "Bounty has expired");
        require(bytes(submissionHash).length > 0, "Submission hash required");
        require(bytes(submissionHash).length <= 200, "Submission hash too long");

        // Check for duplicate submissions from the same claimant
        uint256 submissionCount = submissions[bountyId].length;
        for (uint256 i = 0; i < submissionCount; i++) {
            require(submissions[bountyId][i].claimant != msg.sender, "Already submitted");
        }

        require(usdcToken.transferFrom(msg.sender, address(this), submissionStakeAmount), "USDC stake transfer failed");

        uint256 submissionId = submissions[bountyId].length;
        submissions[bountyId].push(Submission({
            claimant: msg.sender,
            submissionHash: submissionHash,
            status: SubmissionStatus.Pending,
            submittedAt: block.timestamp
        }));
        
        bounty.submissionCount++;
        claimantSubmissions[msg.sender].push(bountyId);
        
        emit SubmissionReceived(bountyId, submissionId, msg.sender, submissionHash);
    }

    /**
     * @dev Approve a submission (sponsor only)
     * @param bountyId ID of the bounty
     * @param submissionId ID of the submission
     */
    function approveSubmission(uint256 bountyId, uint256 submissionId) external nonReentrant whenNotPaused override {
        require(bountyId < bounties.length, "Bounty does not exist");
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.sponsor, "Only the sponsor can approve");
        require(!bounty.claimed, "Bounty already claimed");
        require(submissionId < submissions[bountyId].length, "Submission does not exist");
        
        Submission storage submission = submissions[bountyId][submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");

        bounty.claimed = true;
        bounty.claimant = submission.claimant;
        bounty.submissionHash = submission.submissionHash;
        submission.status = SubmissionStatus.Approved;

        uint256 platformFee = (bounty.reward * platformFeeBps) / BASIS_POINTS;
        platformFeeCollected += platformFee;
        uint256 claimantAmount = bounty.reward - platformFee;

        require(usdcToken.transfer(submission.claimant, claimantAmount), "Reward transfer failed");
        require(usdcToken.transfer(submission.claimant, submissionStakeAmount), "Stake refund failed");

        // Update reputation
        IReputation(reputationContract).increaseReputation(submission.claimant, 25);
        
        emit SubmissionApproved(bountyId, submissionId, submission.claimant);
    }

    /**
     * @dev Reject a submission (sponsor only)
     * @param bountyId ID of the bounty
     * @param submissionId ID of the submission
     */
    function rejectSubmission(uint256 bountyId, uint256 submissionId) external nonReentrant whenNotPaused override {
        require(bountyId < bounties.length, "Bounty does not exist");
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.sponsor, "Only the sponsor can reject");
        require(submissionId < submissions[bountyId].length, "Submission does not exist");
        
        Submission storage submission = submissions[bountyId][submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");

        submission.status = SubmissionStatus.Rejected;

        // Transfer stake to sponsor as compensation for review
        require(usdcToken.transfer(bounty.sponsor, submissionStakeAmount), "Stake transfer failed");

        // Update reputation (penalty for sponsor to prevent arbitrary rejections)
        IReputation(reputationContract).decreaseReputation(bounty.sponsor, 5);
        
        emit SubmissionRejected(bountyId, submissionId, submission.claimant);
    }
    
    /**
     * @dev Cancel a bounty and refund the sponsor (only if no submissions exist)
     * @param bountyId ID of the bounty
     */
    function cancelBounty(uint256 bountyId) external nonReentrant whenNotPaused {
        require(bountyId < bounties.length, "Bounty does not exist");
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.sponsor, "Only the sponsor can cancel");
        require(!bounty.claimed, "Bounty already claimed");
        require(bounty.submissionCount == 0, "Cannot cancel with submissions");
        
        bounty.claimed = true; // Mark as claimed to prevent further submissions
        bounty.claimant = bounty.sponsor; // Set sponsor as claimant for refund
        
        // Refund the sponsor
        require(usdcToken.transfer(bounty.sponsor, bounty.reward), "Refund failed");
        
        // Small reputation penalty for cancellation
        IReputation(reputationContract).decreaseReputation(bounty.sponsor, 2);
        
        emit BountyStakeRefunded(bountyId, bounty.sponsor, bounty.reward);
    }
    
    /**
     * @dev Refund submission stake for expired bounty
     * @param bountyId ID of the bounty
     * @param submissionId ID of the submission
     */
    function refundExpiredSubmission(uint256 bountyId, uint256 submissionId) external nonReentrant whenNotPaused {
        require(bountyId < bounties.length, "Bounty does not exist");
        Bounty storage bounty = bounties[bountyId];
        require(block.timestamp > bounty.deadline + 7 days, "Wait 7 days after expiry");
        require(!bounty.claimed, "Bounty already claimed");
        require(submissionId < submissions[bountyId].length, "Submission does not exist");
        
        Submission storage submission = submissions[bountyId][submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");
        require(msg.sender == submission.claimant, "Only claimant can refund");
        
        submission.status = SubmissionStatus.Rejected; // Mark as rejected to prevent double refund
        
        // Refund the submission stake
        require(usdcToken.transfer(submission.claimant, submissionStakeAmount), "Stake refund failed");
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant whenNotPaused {
        uint256 amount = platformFeeCollected;
        require(amount > 0, "No fees to withdraw");
        
        platformFeeCollected = 0;
        
        require(usdcToken.transfer(feeRecipient, amount), "Fee withdrawal failed");
    }
    
    /**
     * @dev Update fee recipient address (owner only)
     * @param _newRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner whenNotPaused {
        require(_newRecipient != address(0), "Invalid recipient address");
        feeRecipient = _newRecipient;
    }
    
    /**
     * @dev Propose a change to the platform fee percentage
     * @param _newFeeBps New fee in basis points (e.g., 500 = 5%)
     */
    function proposePlatformFeeChange(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 1000, "Fee cannot exceed 10%");
        
        parameterProposals["platformFeeBps"] = ParameterProposal({
            value: _newFeeBps,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit ParameterChangeProposed("platformFeeBps", _newFeeBps, block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Propose a change to the minimum bounty amount
     * @param _newMinBountyAmount New minimum bounty amount
     */
    function proposeMinBountyAmountChange(uint256 _newMinBountyAmount) external onlyOwner {
        require(_newMinBountyAmount > 0, "Minimum bounty amount must be positive");
        
        parameterProposals["minBountyAmount"] = ParameterProposal({
            value: _newMinBountyAmount,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit ParameterChangeProposed("minBountyAmount", _newMinBountyAmount, block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Propose a change to the submission stake amount
     * @param _newStakeAmount New stake amount required for submissions
     */
    function proposeStakeAmountChange(uint256 _newStakeAmount) external onlyOwner {
        require(_newStakeAmount > 0, "Stake amount must be positive");
        
        parameterProposals["submissionStakeAmount"] = ParameterProposal({
            value: _newStakeAmount,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit ParameterChangeProposed("submissionStakeAmount", _newStakeAmount, block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Propose a change to the maximum deadline duration
     * @param _newMaxDuration New maximum duration in seconds
     */
    function proposeMaxDeadlineDurationChange(uint256 _newMaxDuration) external onlyOwner {
        require(_newMaxDuration >= 1 days, "Duration too short");
        require(_newMaxDuration <= 365 days, "Duration too long");
        
        parameterProposals["maxDeadlineDuration"] = ParameterProposal({
            value: _newMaxDuration,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit ParameterChangeProposed("maxDeadlineDuration", _newMaxDuration, block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Execute a proposed parameter change after timelock
     * @param parameterName Name of the parameter to update
     */
    function executeParameterChange(string memory parameterName) external onlyOwner {
        ParameterProposal storage proposal = parameterProposals[parameterName];
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.timestamp + TIMELOCK_DURATION, "Timelock not expired");
        
        uint256 oldValue;
        
        if (keccak256(abi.encodePacked(parameterName)) == keccak256(abi.encodePacked("platformFeeBps"))) {
            oldValue = platformFeeBps;
            platformFeeBps = proposal.value;
        } else if (keccak256(abi.encodePacked(parameterName)) == keccak256(abi.encodePacked("minBountyAmount"))) {
            oldValue = minBountyAmount;
            minBountyAmount = proposal.value;
        } else if (keccak256(abi.encodePacked(parameterName)) == keccak256(abi.encodePacked("submissionStakeAmount"))) {
            oldValue = submissionStakeAmount;
            submissionStakeAmount = proposal.value;
        } else if (keccak256(abi.encodePacked(parameterName)) == keccak256(abi.encodePacked("maxDeadlineDuration"))) {
            oldValue = maxDeadlineDuration;
            maxDeadlineDuration = proposal.value;
        } else {
            revert("Unknown parameter");
        }
        
        proposal.executed = true;
        emit ParameterChangeExecuted(parameterName, oldValue, proposal.value);
    }
    
    /**
     * @dev Update the emergency recovery address
     * @param _newEmergencyRecoveryAddress New emergency recovery address
     */
    function updateEmergencyRecoveryAddress(address _newEmergencyRecoveryAddress) external onlyOwner {
        require(_newEmergencyRecoveryAddress != address(0), "Invalid address");
        
        address oldAddress = emergencyRecoveryAddress;
        emergencyRecoveryAddress = _newEmergencyRecoveryAddress;
        
        emit EmergencyRecoveryUpdated(oldAddress, emergencyRecoveryAddress);
    }
    
    /**
     * @dev Pause the contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract after emergency is resolved
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function (only callable when paused)
     * @param token Address of the token to withdraw (zero address for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner whenPaused {
        if (token == address(0)) {
            // ETH withdrawal
            (bool success, ) = emergencyRecoveryAddress.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 withdrawal
            require(IERC20(token).transfer(emergencyRecoveryAddress, amount), "Token transfer failed");
        }
    }
    
    /**
     * @dev Get submissions for a bounty
     * @param bountyId ID of the bounty
     * @return Array of submissions
     */
    function getSubmissionsForBounty(uint256 bountyId) external view override returns (Submission[] memory) {
        require(bountyId < bounties.length, "Bounty does not exist");
        return submissions[bountyId];
    }
    
    /**
     * @dev Get paginated submissions for a bounty
     * @param bountyId ID of the bounty
     * @param offset Starting index
     * @param limit Maximum number of submissions to return
     * @return Array of submissions
     */
    function getPaginatedSubmissions(uint256 bountyId, uint256 offset, uint256 limit) 
        external 
        view 
        returns (Submission[] memory) 
    {
        require(bountyId < bounties.length, "Bounty does not exist");
        Submission[] storage bountySubmissions = submissions[bountyId];
        uint256 length = bountySubmissions.length;
        
        if (length == 0 || offset >= length) {
            return new Submission[](0);
        }
        
        uint256 remaining = length - offset;
        uint256 resultLength = remaining > limit ? limit : remaining;
        Submission[] memory result = new Submission[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = bountySubmissions[offset + i];
        }
        
        return result;
    }

    /**
     * @dev Get bounty details
     * @param bountyId ID of the bounty
     * @return Bounty details
     */
    function getBounty(uint256 bountyId) external view override returns (Bounty memory) {
        require(bountyId < bounties.length, "Bounty does not exist");
        return bounties[bountyId];
    }
    
    /**
     * @dev Get active bounties for an event
     * @param eventId Event identifier
     * @return Array of active bounties
     */
    function getActiveBountiesForEvent(string memory eventId) external view override returns (Bounty[] memory) {
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
    
    /**
     * @dev Get paginated active bounties for an event
     * @param eventId Event identifier
     * @param offset Starting index
     * @param limit Maximum number of bounties to return
     * @return Array of active bounties
     */
    function getPaginatedActiveBounties(string memory eventId, uint256 offset, uint256 limit) 
        external 
        view 
        returns (Bounty[] memory) 
    {
        uint256[] memory bountyIds = eventBounties[eventId];
        uint256[] memory activeBountyIds = new uint256[](bountyIds.length);
        uint256 activeCount = 0;
        
        // First, filter to active bounties
        for (uint i = 0; i < bountyIds.length; i++) {
            if (!bounties[bountyIds[i]].claimed && block.timestamp <= bounties[bountyIds[i]].deadline) {
                activeBountyIds[activeCount] = bountyIds[i];
                activeCount++;
            }
        }
        
        // Apply pagination
        if (activeCount == 0 || offset >= activeCount) {
            return new Bounty[](0);
        }
        
        uint256 remaining = activeCount - offset;
        uint256 resultLength = remaining > limit ? limit : remaining;
        Bounty[] memory result = new Bounty[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = bounties[activeBountyIds[offset + i]];
        }
        
        return result;
    }
    
    /**
     * @dev Get all bounties created by a sponsor
     * @param sponsor Address of the sponsor
     * @return Array of bounty IDs
     */
    function getBountiesBySponsor(address sponsor) external view returns (uint256[] memory) {
        return sponsorBounties[sponsor];
    }
    
    /**
     * @dev Get all bounties a user has submitted for
     * @param claimant Address of the claimant
     * @return Array of bounty IDs
     */
    function getSubmissionsByClaimant(address claimant) external view returns (uint256[] memory) {
        return claimantSubmissions[claimant];
    }
    
    /**
     * @dev Get the total number of bounties
     * @return Total bounty count
     */
    function getTotalBounties() external view returns (uint256) {
        return bounties.length;
    }
    
    /**
     * @dev Get contract configuration parameters
     * @return _platformFeeBps Current platform fee in basis points
     * @return _minBountyAmount Current minimum bounty amount
     * @return _submissionStakeAmount Current submission stake amount
     * @return _maxDeadlineDuration Current maximum deadline duration
     */
    function getContractParameters() external view returns (
        uint256 _platformFeeBps,
        uint256 _minBountyAmount,
        uint256 _submissionStakeAmount,
        uint256 _maxDeadlineDuration
    ) {
        return (platformFeeBps, minBountyAmount, submissionStakeAmount, maxDeadlineDuration);
    }
    
    /**
     * @dev Get timelock status for a parameter change
     * @param parameterName Name of the parameter
     * @return value Proposed value
     * @return timestamp Time when the proposal was made
     * @return executed Whether the proposal has been executed
     * @return canExecute Whether the timelock period has passed
     */
    function getParameterProposalStatus(string memory parameterName) external view returns (
        uint256 value,
        uint256 timestamp,
        bool executed,
        bool canExecute
    ) {
        ParameterProposal storage proposal = parameterProposals[parameterName];
        return (
            proposal.value,
            proposal.timestamp,
            proposal.executed,
            !proposal.executed && block.timestamp >= proposal.timestamp + TIMELOCK_DURATION
        );
    }
    
    // Function to receive ETH (for emergency recovery if needed)
    receive() external payable {}
}
