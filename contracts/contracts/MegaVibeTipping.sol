// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MegaVibeTipping
 * @dev Smart contract for tipping speakers at live events
 * Optimized for Mantle Network's low gas fees
 */
contract MegaVibeTipping is ReentrancyGuard, Ownable {
    // USDC token address
    IERC20 public usdcToken;

    // Platform fee percentage (5% = 500 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 500;
    uint256 public constant BASIS_POINTS = 10000;

    // Minimum tip amount to prevent spam (0.001 USDC)
    uint256 public constant MIN_TIP_AMOUNT = 1e3;

    // Maximum message length
    uint256 public constant MAX_MESSAGE_LENGTH = 200;

    struct Tip {
        address tipper;
        address recipient;
        uint256 amount;
        string message;
        uint256 timestamp;
        string eventId;
        string speakerId;
        bool isWithdrawn;
    }

    // Storage
    Tip[] public tips;
    mapping(string => uint256) public eventTotals;
    mapping(string => uint256) public speakerTotals;
    mapping(address => uint256) public userTipCount;
    mapping(address => uint256) public speakerBalances;
    mapping(string => uint256[]) public eventTipIds;
    mapping(string => uint256[]) public speakerTipIds;

    // Platform fee collection
    uint256 public platformFeeCollected;
    address public feeRecipient;
    address public reputationContract;

    // Events
    event TipSent(
        uint256 indexed tipId,
        address indexed tipper,
        address indexed recipient,
        uint256 amount,
        string message,
        string eventId,
        string speakerId,
        uint256 timestamp
    );

    event TipWithdrawn(
        address indexed speaker,
        uint256 amount,
        uint256 timestamp
    );

    event PlatformFeeWithdrawn(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

    constructor(address _feeRecipient, address _usdcTokenAddress, address _reputationContract) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_usdcTokenAddress != address(0), "Invalid USDC token address");
        require(_reputationContract != address(0), "Invalid reputation contract address");
        feeRecipient = _feeRecipient;
        usdcToken = IERC20(_usdcTokenAddress);
        reputationContract = _reputationContract;
    }

    /**
     * @dev Send a tip to a speaker
     * @param recipient Speaker's wallet address
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
    ) external nonReentrant {
        require(usdcAmount >= MIN_TIP_AMOUNT, "Tip amount too small");
        require(recipient != address(0), "Invalid recipient address");
        require(recipient != msg.sender, "Cannot tip yourself");
        require(bytes(eventId).length > 0, "Event ID required");
        require(bytes(speakerId).length > 0, "Speaker ID required");
        require(bytes(message).length <= MAX_MESSAGE_LENGTH, "Message too long");

        // Transfer USDC from tipper to this contract
        require(usdcToken.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");

        // Calculate platform fee
        uint256 platformFee = (usdcAmount * PLATFORM_FEE_BPS) / BASIS_POINTS;
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

        Reputation(reputationContract).increaseReputation(msg.sender, 1);
        Reputation(reputationContract).increaseReputation(recipient, 5);

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
    function withdrawTips() external nonReentrant {
        uint256 balance = speakerBalances[msg.sender];
        require(balance > 0, "No tips to withdraw");

        speakerBalances[msg.sender] = 0;

        require(usdcToken.transfer(msg.sender, balance), "Withdrawal failed");

        emit TipWithdrawn(msg.sender, balance, block.timestamp);
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeeCollected;
        require(amount > 0, "No fees to withdraw");

        platformFeeCollected = 0;

        require(usdcToken.transfer(feeRecipient, amount), "Fee withdrawal failed");

        emit PlatformFeeWithdrawn(feeRecipient, amount, block.timestamp);
    }

    /**
     * @dev Update fee recipient address (owner only)
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient address");

        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;

        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /**
     * @dev Get tips for a specific event
     * @param eventId The event identifier
     * @return Array of tip IDs for the event
     */
    function getEventTips(string memory eventId) external view returns (uint256[] memory) {
        return eventTipIds[eventId];
    }

    /**
     * @dev Get tips for a specific speaker
     * @param speakerId The speaker identifier
     * @return Array of tip IDs for the speaker
     */
    function getSpeakerTips(string memory speakerId) external view returns (uint256[] memory) {
        return speakerTipIds[speakerId];
    }

    /**
     * @dev Get tip details by ID
     * @param tipId The tip identifier
     * @return Tip struct data
     */
    function getTip(uint256 tipId) external view returns (Tip memory) {
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
     * @dev Get speaker's withdrawable balance
     * @param speaker Speaker's address
     * @return Available balance for withdrawal
     */
    function getSpeakerBalance(address speaker) external view returns (uint256) {
        return speakerBalances[speaker];
    }

    /**
     * @dev Get total number of tips
     * @return Total tip count
     */
    function getTotalTips() external view returns (uint256) {
        return tips.length;
    }


