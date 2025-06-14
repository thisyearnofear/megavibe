// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BountyContract {
    address public owner;
    
    struct Bounty {
        uint256 id;
        address creator;
        string songId;
        uint256 amount;
        bool isActive;
        address winner;
    }
    
    mapping(uint256 => Bounty) public bounties;
    uint256 public nextBountyId = 1;
    
    event BountyCreated(uint256 indexed id, address indexed creator, string songId, uint256 amount);
    event BountyClaimed(uint256 indexed id, address indexed winner);
    event BountyCancelled(uint256 indexed id);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    modifier onlyBountyCreator(uint256 bountyId) {
        require(msg.sender == bounties[bountyId].creator, "Not the bounty creator");
        _;
    }
    
    // Function to create a bounty for a song request
    function createBounty(string calldata songId) external payable {
        require(msg.value > 0, "Bounty amount must be greater than 0");
        require(bytes(songId).length > 0, "Song ID must not be empty");
        
        uint256 bountyId = nextBountyId;
        bounties[bountyId] = Bounty({
            id: bountyId,
            creator: msg.sender,
            songId: songId,
            amount: msg.value,
            isActive: true,
            winner: address(0)
        });
        
        nextBountyId++;
        
        emit BountyCreated(bountyId, msg.sender, songId, msg.value);
    }
    
    // Function for the bounty creator to select a winner and award the bounty
    function claimBounty(uint256 bountyId, address payable winner) external onlyBountyCreator(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.isActive, "Bounty is not active");
        require(winner != address(0), "Invalid winner address");
        
        bounty.isActive = false;
        bounty.winner = winner;
        
        (bool sent, ) = winner.call{value: bounty.amount}("");
        require(sent, "Failed to send bounty amount");
        
        emit BountyClaimed(bountyId, winner);
    }
    
    // Function for the bounty creator to cancel the bounty and reclaim funds
    function cancelBounty(uint256 bountyId) external onlyBountyCreator(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.isActive, "Bounty is not active");
        require(bounty.winner == address(0), "Bounty already claimed");
        
        bounty.isActive = false;
        
        (bool sent, ) = payable(bounty.creator).call{value: bounty.amount}("");
        require(sent, "Failed to refund bounty amount");
        
        emit BountyCancelled(bountyId);
    }
    
    // Function to withdraw any stuck funds (only callable by owner)
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool sent, ) = payable(owner).call{value: balance}("");
        require(sent, "Failed to withdraw funds");
    }
    
    // Function to change the owner (only callable by current owner)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }
    
    // Fallback function to accept ETH
    receive() external payable {}
}
