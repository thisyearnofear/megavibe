// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Reputation is Ownable {
    mapping(address => uint256) public reputation;

    address public bountyContract;
    address public tippingContract;

    event ReputationUpdated(address indexed user, uint256 newReputation);

    constructor(address _bountyContract, address _tippingContract) Ownable(msg.sender) {
        bountyContract = _bountyContract;
        tippingContract = _tippingContract;
    }

    function setBountyContract(address _bountyContract) external onlyOwner {
        bountyContract = _bountyContract;
    }

    function setTippingContract(address _tippingContract) external onlyOwner {
        tippingContract = _tippingContract;
    }

    function increaseReputation(address user, uint256 amount) external {
        require(msg.sender == bountyContract || msg.sender == tippingContract, "Only authorized contracts can update reputation");
        reputation[user] += amount;
        emit ReputationUpdated(user, reputation[user]);
    }

    function decreaseReputation(address user, uint256 amount) external {
        require(msg.sender == bountyContract || msg.sender == tippingContract, "Only authorized contracts can update reputation");
        if (reputation[user] >= amount) {
            reputation[user] -= amount;
        } else {
            reputation[user] = 0;
        }
        emit ReputationUpdated(user, reputation[user]);
    }
}
