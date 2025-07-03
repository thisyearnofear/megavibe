// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITipping
 * @dev Interface for the MegaVibeTipping contract
 * Defines the external functions for tipping functionality
 */
interface ITipping {
    /**
     * @dev Struct representing a tip
     */
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

    /**
     * @dev Emitted when a tip is sent
     */
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

    /**
     * @dev Emitted when a speaker withdraws tips
     */
    event TipWithdrawn(
        address indexed speaker,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Emitted when platform fees are withdrawn
     */
    event PlatformFeeWithdrawn(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Emitted when the fee recipient is updated
     */
    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

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
    ) external;

    /**
     * @dev Withdraw accumulated tips (speakers only)
     */
    function withdrawTips() external;

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external;

    /**
     * @dev Update fee recipient address (owner only)
     * @param _newRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newRecipient) external;

    /**
     * @dev Get tips for a specific event
     * @param eventId The event identifier
     * @return Array of tip IDs for the event
     */
    function getEventTips(string memory eventId) external view returns (uint256[] memory);

    /**
     * @dev Get tips for a specific speaker
     * @param speakerId The speaker identifier
     * @return Array of tip IDs for the speaker
     */
    function getSpeakerTips(string memory speakerId) external view returns (uint256[] memory);

    /**
     * @dev Get tip details by ID
     * @param tipId The tip identifier
     * @return Tip struct data
     */
    function getTip(uint256 tipId) external view returns (Tip memory);

    /**
     * @dev Get recent tips for an event (latest first)
     * @param eventId The event identifier
     * @param limit Maximum number of tips to return
     * @return Array of recent tip data
     */
    function getRecentEventTips(string memory eventId, uint256 limit)
        external
        view
        returns (Tip[] memory);

    /**
     * @dev Get speaker's withdrawable balance
     * @param speaker Speaker's address
     * @return Available balance for withdrawal
     */
    function getSpeakerBalance(address speaker) external view returns (uint256);

    /**
     * @dev Get total number of tips
     * @return Total tip count
     */
    function getTotalTips() external view returns (uint256);
}