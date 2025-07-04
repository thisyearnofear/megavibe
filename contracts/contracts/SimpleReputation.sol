// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ISimpleReputation.sol";

/**
 * @title SimpleReputation
 * @dev A simplified reputation contract for the MetaMask Card Hackathon
 * Tracks reputation points for users without complex role management
 */
contract SimpleReputation is ISimpleReputation, Ownable, Pausable {
    // Reputation data
    mapping(address => uint256) private _reputationScores;
    
    // Optional service addresses for permission grants
    address public serviceAddress;
    
    /**
     * @dev Constructor sets up ownership
     * @param _owner Initial owner of the contract
     */
    constructor(address _owner) Ownable(_owner) {}
    
    /**
     * @dev Sets a service address that can modify reputation
     * @param _serviceAddress Address allowed to call reputation methods
     */
    function setServiceAddress(address _serviceAddress) external onlyOwner {
        require(_serviceAddress != address(0), "Invalid service address");
        serviceAddress = _serviceAddress;
        emit ServiceAddressUpdated(_serviceAddress);
    }
    
    /**
     * @dev Modifier to check if caller is authorized to modify reputation
     */
    modifier onlyAuthorized() {
        require(
            owner() == _msgSender() || serviceAddress == _msgSender(),
            "Caller not authorized"
        );
        _;
    }
    
    /**
     * @dev Increases a user's reputation by the specified amount
     * @param user Address of the user to increase reputation for
     * @param amount Amount of reputation to add
     */
    /**
     * @dev Get the reputation score for a user
     * @param user The address of the user
     * @return The user's reputation score
     */
    function reputation(address user) external view override returns (uint256) {
        return _reputationScores[user];
    }
    
    /**
     * @dev Increases a user's reputation by the specified amount
     * @param user Address of the user to increase reputation for
     * @param amount Amount of reputation to add
     */
    function increaseReputation(address user, uint256 amount)
        external
        override
        whenNotPaused
        onlyAuthorized
    {
        require(user != address(0), "Invalid user address");
        _reputationScores[user] += amount;
        emit ReputationUpdated(user, _reputationScores[user]);
    }
    
    /**
     * @dev Decreases a user's reputation by the specified amount
     * @param user Address of the user to decrease reputation for
     * @param amount Amount of reputation to subtract
     */
    function decreaseReputation(address user, uint256 amount) 
        external 
        override 
        whenNotPaused 
        onlyAuthorized 
    {
        require(user != address(0), "Invalid user address");
        
        if (_reputationScores[user] >= amount) {
            _reputationScores[user] -= amount;
        } else {
            _reputationScores[user] = 0;
        }
        
        emit ReputationUpdated(user, _reputationScores[user]);
    }
    
    /**
     * @dev Sets a user's reputation to a specific value
     * @param user Address of the user
     * @param value New reputation value
     */
    function setReputation(address user, uint256 value)
        external
        whenNotPaused
        onlyAuthorized
    {
        require(user != address(0), "Invalid user address");
        _reputationScores[user] = value;
        emit ReputationUpdated(user, value);
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
    function getMultipleReputations(address[] calldata users) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory reputations = new uint256[](users.length);
        
        for (uint256 i = 0; i < users.length; i++) {
            reputations[i] = _reputationScores[users[i]];
        }
        
        return reputations;
    }
}