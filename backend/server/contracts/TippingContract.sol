// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TippingContract {
    address public owner;
    
    event TipSent(address indexed from, address indexed to, uint256 amount, string message);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    // Function to send a tip to an artist
    function sendTip(address payable recipient, string calldata message) external payable {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient address");
        
        // Transfer the tip amount to the recipient
        (bool sent, ) = recipient.call{value: msg.value}("");
        require(sent, "Failed to send tip");
        
        emit TipSent(msg.sender, recipient, msg.value, message);
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
