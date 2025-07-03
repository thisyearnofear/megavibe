// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IReputation
 * @dev Interface for the Reputation contract
 * Defines the external functions for reputation management
 */
interface IReputation {
    /**
     * @dev Emitted when a user's reputation is updated
     * @param user The address of the user whose reputation was updated
     * @param newReputation The new reputation score
     */
    event ReputationUpdated(address indexed user, uint256 newReputation);

    /**
     * @dev Get the reputation score for a user
     * @param user The address of the user
     * @return The user's reputation score
     */
    function reputation(address user) external view returns (uint256);

    /**
     * @dev Increase a user's reputation by the specified amount
     * @param user The address of the user
     * @param amount The amount to increase the reputation by
     */
    function increaseReputation(address user, uint256 amount) external;

    /**
     * @dev Decrease a user's reputation by the specified amount
     * @param user The address of the user
     * @param amount The amount to decrease the reputation by
     */
    function decreaseReputation(address user, uint256 amount) external;

    /**
     * @dev Set the bounty contract address
     * @param _bountyContract The address of the bounty contract
     */
    function setBountyContract(address _bountyContract) external;

    /**
     * @dev Set the tipping contract address
     * @param _tippingContract The address of the tipping contract
     */
    function setTippingContract(address _tippingContract) external;
}