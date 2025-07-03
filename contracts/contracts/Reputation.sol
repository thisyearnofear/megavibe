// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IReputation.sol";

/**
 * @title Reputation
 * @dev Manages reputation points for users based on their activity
 * This contract implements role-based access control to avoid circular dependencies
 */
contract Reputation is IReputation, Ownable, AccessControl, Pausable {
    // Reputation data
    mapping(address => uint256) public reputation;
    
    // Role definitions
    bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");
    
    // Legacy contract addresses (for backward compatibility)
    address public bountyContract;
    address public tippingContract;

    /**
     * @dev Constructor sets up initial roles and ownership
     * @param _owner Initial owner of the contract
     */
    constructor(address _owner) Ownable(_owner) {
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(REPUTATION_MANAGER_ROLE, _owner);
    }
    
    /**
     * @dev Sets the bounty contract address and grants it the reputation manager role
     * @param _bountyContract Address of the bounty contract
     */
    function setBountyContract(address _bountyContract) external onlyOwner {
        require(_bountyContract != address(0), "Invalid bounty contract address");
        
        // Revoke role from old contract if it exists
        if (bountyContract != address(0)) {
            _revokeRole(REPUTATION_MANAGER_ROLE, bountyContract);
        }
        
        // Set new contract and grant role
        bountyContract = _bountyContract;
        _grantRole(REPUTATION_MANAGER_ROLE, _bountyContract);
    }
    
    /**
     * @dev Sets the tipping contract address and grants it the reputation manager role
     * @param _tippingContract Address of the tipping contract
     */
    function setTippingContract(address _tippingContract) external onlyOwner {
        require(_tippingContract != address(0), "Invalid tipping contract address");
        
        // Revoke role from old contract if it exists
        if (tippingContract != address(0)) {
            _revokeRole(REPUTATION_MANAGER_ROLE, tippingContract);
        }
        
        // Set new contract and grant role
        tippingContract = _tippingContract;
        _grantRole(REPUTATION_MANAGER_ROLE, _tippingContract);
    }
    
    /**
     * @dev Grants reputation manager role to an address
     * @param manager Address to grant the role to
     */
    function grantReputationManagerRole(address manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(manager != address(0), "Invalid manager address");
        _grantRole(REPUTATION_MANAGER_ROLE, manager);
    }
    
    /**
     * @dev Revokes reputation manager role from an address
     * @param manager Address to revoke the role from
     */
    function revokeReputationManagerRole(address manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(REPUTATION_MANAGER_ROLE, manager);
    }
    
    /**
     * @dev Increases a user's reputation by the specified amount
     * @param user Address of the user to increase reputation for
     * @param amount Amount of reputation to add
     */
    function increaseReputation(address user, uint256 amount) external override whenNotPaused onlyRole(REPUTATION_MANAGER_ROLE) {
        require(user != address(0), "Invalid user address");
        reputation[user] += amount;
        emit ReputationUpdated(user, reputation[user]);
    }
    
    /**
     * @dev Decreases a user's reputation by the specified amount
     * @param user Address of the user to decrease reputation for
     * @param amount Amount of reputation to subtract
     */
    function decreaseReputation(address user, uint256 amount) external override whenNotPaused onlyRole(REPUTATION_MANAGER_ROLE) {
        require(user != address(0), "Invalid user address");
        
        if (reputation[user] >= amount) {
            reputation[user] -= amount;
        } else {
            reputation[user] = 0;
        }
        
        emit ReputationUpdated(user, reputation[user]);
    }
    
    /**
     * @dev Pause the contract (emergency use)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get reputation for multiple users in a single call
     * @param users Array of user addresses
     * @return reputations Array of reputation scores
     */
    function getMultipleReputations(address[] calldata users) external view returns (uint256[] memory) {
        uint256[] memory reputations = new uint256[](users.length);
        
        for (uint256 i = 0; i < users.length; i++) {
            reputations[i] = reputation[users[i]];
        }
        
        return reputations;
    }
    
    /**
     * @dev Check if an address has the reputation manager role
     * @param manager Address to check
     * @return True if the address has the role, false otherwise
     */
    function isReputationManager(address manager) external view returns (bool) {
        return hasRole(REPUTATION_MANAGER_ROLE, manager);
    }
}
