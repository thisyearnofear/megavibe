// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ITipping.sol";
import "./interfaces/IReputation.sol";

/**
 * @title MegaVibeTipping
 * @dev Smart contract for tipping speakers at live events
 * Optimized for Mantle Network's low gas fees
 * Includes emergency pause, parameter governance, and security enhancements
 */
contract MegaVibeTipping is ITipping, ReentrancyGuard, Ownable, Pausable {
    // USDC token address
    IERC20 public usdcToken;

    // Platform fee percentage (5% = 500 basis points)
    uint256 public platformFeeBps = 500;
    uint256 public constant BASIS_POINTS = 10000;

    // Minimum tip amount to prevent spam (0.001 USDC)
    uint256 public minTipAmount = 1e3;

    // Maximum message length
    uint256 public maxMessageLength = 200;

    // Timelock duration for parameter changes (24 hours)
    uint256 public constant TIMELOCK_DURATION = 1 days;

    // Parameter change proposals
    struct ParameterProposal {
        uint256 value;
        uint256 timestamp;
        bool executed;
    }

    // Storage
    Tip[] public tips;
    mapping(string => uint256) public eventTotals;
    mapping(string => uint256) public speakerTotals;
    mapping(address => uint256) public userTipCount;
    mapping(address => uint256) public speakerBalances;
    mapping(string => uint256[]) public eventTipIds;
    mapping(string => uint256[]) public speakerTipIds;

    // Parameter governance
    mapping(string => ParameterProposal) public parameterProposals;

    // Platform fee collection
    uint256 public platformFeeCollected;
    address public feeRecipient;
    address public reputationContract;

    // Emergency recovery
    address public emergencyRecoveryAddress;

    // Additional events for parameter governance
    event ParameterChangeProposed(string parameter, uint256 value, uint256 executeAfter);
    event ParameterChangeExecuted(string parameter, uint256 oldValue, uint256 newValue);
    event EmergencyRecoveryUpdated(address indexed oldAddress, address indexed newAddress);

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
     * @dev Send a tip to a speaker
     * @param recipient Speaker's wallet address
     * @param usdcAmount Amount of USDC to tip
     * @param message Optional message from tipper
     * @param eventId Unique identifier for the event
     * @param speakerId Unique identifier for the speaker
     */
    function tipSpeaker(
        address recipient,
        uint256 usdcAmount,
        string memory message,
        string memory eventId,
        string memory speakerId
    ) external nonReentrant whenNotPaused override {
        require(usdcAmount >= minTipAmount, "Tip amount too small");
        require(recipient != address(0), "Invalid recipient address");
        require(recipient != msg.sender, "Cannot tip yourself");
        require(bytes(eventId).length > 0, "Event ID required");
        require(bytes(speakerId).length > 0, "Speaker ID required");
        require(bytes(message).length <= maxMessageLength, "Message too long");

        // Transfer USDC from tipper to this contract
        require(usdcToken.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");

        // Calculate platform fee
        uint256 platformFee = (usdcAmount * platformFeeBps) / BASIS_POINTS;
        uint256 speakerAmount = usdcAmount - platformFee;

        // Create tip record
        uint256 tipId = tips.length;
        tips.push(Tip({
            tipper: msg.sender,
            recipient: recipient,
            amount: usdcAmount,
            message: message,
            timestamp: block.timestamp,
            eventId: eventId,
            speakerId: speakerId,
            isWithdrawn: false
        }));

        // Update mappings
        eventTotals[eventId] += usdcAmount;
        speakerTotals[speakerId] += usdcAmount;
        userTipCount[msg.sender]++;
        speakerBalances[recipient] += speakerAmount;
        eventTipIds[eventId].push(tipId);
        speakerTipIds[speakerId].push(tipId);

        // Collect platform fee
        platformFeeCollected += platformFee;

        // Update reputation
        IReputation(reputationContract).increaseReputation(msg.sender, 1);
        IReputation(reputationContract).increaseReputation(recipient, 5);

        emit TipSent(
            tipId,
            msg.sender,
            recipient,
            usdcAmount,
            message,
            eventId,
            speakerId,
            block.timestamp
        );
    }

    /**
     * @dev Withdraw accumulated tips (speakers only)
     */
    function withdrawTips() external nonReentrant whenNotPaused override {
        uint256 balance = speakerBalances[msg.sender];
        require(balance > 0, "No tips to withdraw");

        speakerBalances[msg.sender] = 0;

        require(usdcToken.transfer(msg.sender, balance), "Withdrawal failed");

        emit TipWithdrawn(msg.sender, balance, block.timestamp);
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant whenNotPaused override {
        uint256 amount = platformFeeCollected;
        require(amount > 0, "No fees to withdraw");

        platformFeeCollected = 0;

        require(usdcToken.transfer(feeRecipient, amount), "Fee withdrawal failed");

        emit PlatformFeeWithdrawn(feeRecipient, amount, block.timestamp);
    }

    /**
     * @dev Update fee recipient address (owner only)
     * @param _newRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner whenNotPaused override {
        require(_newRecipient != address(0), "Invalid recipient address");

        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;

        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
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
     * @dev Propose a change to the minimum tip amount
     * @param _newMinTipAmount New minimum tip amount
     */
    function proposeMinTipAmountChange(uint256 _newMinTipAmount) external onlyOwner {
        require(_newMinTipAmount > 0, "Minimum tip amount must be positive");
        
        parameterProposals["minTipAmount"] = ParameterProposal({
            value: _newMinTipAmount,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit ParameterChangeProposed("minTipAmount", _newMinTipAmount, block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Propose a change to the maximum message length
     * @param _newMaxMessageLength New maximum message length
     */
    function proposeMaxMessageLengthChange(uint256 _newMaxMessageLength) external onlyOwner {
        require(_newMaxMessageLength > 0, "Maximum message length must be positive");
        
        parameterProposals["maxMessageLength"] = ParameterProposal({
            value: _newMaxMessageLength,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit ParameterChangeProposed("maxMessageLength", _newMaxMessageLength, block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Execute a proposed platform fee change after timelock
     */
    function executePlatformFeeChange() external onlyOwner {
        ParameterProposal storage proposal = parameterProposals["platformFeeBps"];
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.timestamp + TIMELOCK_DURATION, "Timelock not expired");
        
        uint256 oldValue = platformFeeBps;
        platformFeeBps = proposal.value;
        proposal.executed = true;
        
        emit ParameterChangeExecuted("platformFeeBps", oldValue, platformFeeBps);
    }
    
    /**
     * @dev Execute a proposed minimum tip amount change after timelock
     */
    function executeMinTipAmountChange() external onlyOwner {
        ParameterProposal storage proposal = parameterProposals["minTipAmount"];
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.timestamp + TIMELOCK_DURATION, "Timelock not expired");
        
        uint256 oldValue = minTipAmount;
        minTipAmount = proposal.value;
        proposal.executed = true;
        
        emit ParameterChangeExecuted("minTipAmount", oldValue, minTipAmount);
    }
    
    /**
     * @dev Execute a proposed maximum message length change after timelock
     */
    function executeMaxMessageLengthChange() external onlyOwner {
        ParameterProposal storage proposal = parameterProposals["maxMessageLength"];
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.timestamp + TIMELOCK_DURATION, "Timelock not expired");
        
        uint256 oldValue = maxMessageLength;
        maxMessageLength = proposal.value;
        proposal.executed = true;
        
        emit ParameterChangeExecuted("maxMessageLength", oldValue, maxMessageLength);
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
     * @dev Get tips for a specific event
     * @param eventId The event identifier
     * @return Array of tip IDs for the event
     */
    function getEventTips(string memory eventId) external view override returns (uint256[] memory) {
        return eventTipIds[eventId];
    }

    /**
     * @dev Get tips for a specific speaker
     * @param speakerId The speaker identifier
     * @return Array of tip IDs for the speaker
     */
    function getSpeakerTips(string memory speakerId) external view override returns (uint256[] memory) {
        return speakerTipIds[speakerId];
    }

    /**
     * @dev Get tip details by ID
     * @param tipId The tip identifier
     * @return Tip struct data
     */
    function getTip(uint256 tipId) external view override returns (Tip memory) {
        require(tipId < tips.length, "Tip does not exist");
        return tips[tipId];
    }

    /**
     * @dev Get recent tips for an event (latest first)
     * @param eventId The event identifier
     * @param limit Maximum number of tips to return
     * @return Array of recent tip data
     */
    function getRecentEventTips(string memory eventId, uint256 limit)
        external
        view
        override
        returns (Tip[] memory)
    {
        uint256[] memory tipIds = eventTipIds[eventId];
        uint256 length = tipIds.length;

        if (length == 0) {
            return new Tip[](0);
        }

        uint256 resultLength = length > limit ? limit : length;
        Tip[] memory result = new Tip[](resultLength);

        // Return latest tips first
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = tips[tipIds[length - 1 - i]];
        }

        return result;
    }

    /**
     * @dev Get paginated tips for an event
     * @param eventId The event identifier
     * @param offset Starting index
     * @param limit Maximum number of tips to return
     * @return Array of tip data
     */
    function getPaginatedEventTips(string memory eventId, uint256 offset, uint256 limit)
        external
        view
        returns (Tip[] memory)
    {
        uint256[] memory tipIds = eventTipIds[eventId];
        uint256 length = tipIds.length;

        if (length == 0 || offset >= length) {
            return new Tip[](0);
        }

        uint256 remaining = length - offset;
        uint256 resultLength = remaining > limit ? limit : remaining;
        Tip[] memory result = new Tip[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = tips[tipIds[offset + i]];
        }

        return result;
    }

    /**
     * @dev Get speaker's withdrawable balance
     * @param speaker Speaker's address
     * @return Available balance for withdrawal
     */
    function getSpeakerBalance(address speaker) external view override returns (uint256) {
        return speakerBalances[speaker];
    }

    /**
     * @dev Get total number of tips
     * @return Total tip count
     */
    function getTotalTips() external view override returns (uint256) {
        return tips.length;
    }

    /**
     * @dev Get contract configuration parameters
     * @return _platformFeeBps Current platform fee in basis points
     * @return _minTipAmount Current minimum tip amount
     * @return _maxMessageLength Current maximum message length
     */
    function getContractParameters() external view returns (
        uint256 _platformFeeBps,
        uint256 _minTipAmount,
        uint256 _maxMessageLength
    ) {
        return (platformFeeBps, minTipAmount, maxMessageLength);
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
