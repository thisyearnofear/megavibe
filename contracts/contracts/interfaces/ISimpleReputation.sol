// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISimpleReputation
 * @dev Interface for the SimpleReputation contract
 * Defines the external functions for the simplified reputation management
 */
interface ISimpleReputation {
    /**
     * @dev Emitted when a user's reputation is updated
     * @param user The address of the user whose reputation was updated
     * @param newReputation The new reputation score
     */
    event ReputationUpdated(address indexed user, uint256 newReputation);
    
    /**
     * @dev Emitted when the service address is updated
     * @param serviceAddress The new service address
     */
    event ServiceAddressUpdated(address indexed serviceAddress);

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
     * @dev Set the service address that can modify reputation
     * @param _serviceAddress The address of the service
     */
    function setServiceAddress(address _serviceAddress) external;
}