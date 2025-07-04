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

/**
 * @title SimpleReputationStandalone
 * @dev A simplified reputation contract with inlined OpenZeppelin functionality
 * Tracks reputation points for users without complex role management
 */
contract SimpleReputationStandalone is ISimpleReputation {
    // --- Context (from OpenZeppelin) ---
    function _msgSender() internal view returns (address) {
        return msg.sender;
    }
    
    // --- Ownership (from OpenZeppelin Ownable) ---
    address private _owner;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert("Owner cannot be zero address");
        }
        _transferOwnership(initialOwner);
    }
    
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Caller is not the owner");
        _;
    }
    
    function owner() public view returns (address) {
        return _owner;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        if (newOwner == address(0)) {
            revert("New owner cannot be zero address");
        }
        _transferOwnership(newOwner);
    }
    
    function _transferOwnership(address newOwner) internal {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    // --- Pausable (from OpenZeppelin) ---
    bool private _paused;
    
    event Paused(address account);
    event Unpaused(address account);
    
    modifier whenNotPaused() {
        require(!_paused, "Contract is paused");
        _;
    }
    
    modifier whenPaused() {
        require(_paused, "Contract is not paused");
        _;
    }
    
    function paused() public view returns (bool) {
        return _paused;
    }
    
    function _pause() internal whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }
    
    function _unpause() internal whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
    
    // --- SimpleReputation Implementation ---
    // Reputation data
    mapping(address => uint256) private _reputationScores;
    
    // Optional service addresses for permission grants
    address public serviceAddress;
    
    /**
     * @dev Sets a service address that can modify reputation
     * @param _serviceAddress Address allowed to call reputation methods
     */
    function setServiceAddress(address _serviceAddress) external override onlyOwner {
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