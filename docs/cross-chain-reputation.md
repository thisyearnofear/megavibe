# Cross-Chain Reputation System

This document outlines the implementation of the cross-chain reputation system for the MegaVibe platform, created for the MetaMask Card Hackathon.

## Overview

The SimpleReputation contract has been deployed to multiple EVM-compatible chains to demonstrate cross-chain functionality. Users can build reputation on any supported chain, and the MegaVibe frontend will aggregate and display these reputation scores across chains.

## Deployed Contracts

The SimpleReputation contract has been deployed to the following networks:

| Network          | Chain ID | Contract Address                             |
| ---------------- | -------- | -------------------------------------------- |
| Ethereum Sepolia | 11155111 | `0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa` |
| Optimism Sepolia | 11155420 | `0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718` |

## Architecture

### Smart Contracts

1. **SimpleReputation.sol**: The main contract implementing the reputation system with the following features:

   - Track user reputation scores
   - Increase/decrease reputation
   - Admin functions to set reputation directly
   - View functions to retrieve reputation scores

2. **SimpleReputationStandalone.sol**: A standalone version with inlined dependencies, used for deployment to chains where the normal compilation process had issues.

### Frontend Integration

The frontend services have been updated to support multi-chain reputation:

1. **SimpleReputationService.ts**: Core service that interfaces with the contract across multiple chains

   - Determines which contract to use based on the current chain ID
   - Provides methods to read and modify reputation scores

2. **ReputationServiceAdapter.ts**: Adapter that maintains backward compatibility with existing UI components
   - Translates SimpleReputationScore to the original ReputationScore format
   - Adds mock category breakdowns for UI display

## Deployment Process

The deployment process involved two main approaches:

1. **Standard Deployment** (Ethereum Sepolia):

   - Used the regular Hardhat configuration
   - Deployed with standard OpenZeppelin imports

2. **Isolated Deployment** (Optimism Sepolia):
   - Created a standalone version of the contract with inlined dependencies
   - Used a separate deployment environment to avoid compilation issues
   - Successfully deployed to Optimism Sepolia

## How It Works

1. **User Interaction**:

   - Users interact with the MegaVibe platform across different chains
   - Actions like tipping, content creation, and event participation earn reputation points

2. **Reputation Tracking**:

   - Each chain has its own SimpleReputation contract that tracks user points
   - Authorized services can increase/decrease reputation based on user actions

3. **Frontend Display**:
   - The frontend connects to the appropriate contract based on the current chain
   - When viewing profiles, the system can query reputation across chains
   - Future implementation may include cross-chain aggregation of scores

## Testing Cross-Chain Functionality

A test script has been provided to verify the cross-chain functionality:

```
node scripts/test-cross-chain-reputation.js
```

Make sure to:

1. Set your private key in `scripts/.env`
2. Have funds on both Ethereum Sepolia and Optimism Sepolia for gas fees
3. Configure RPC endpoints in the `.env` file if needed

## Future Enhancements

1. **Cross-Chain Aggregation**:

   - Implement a score aggregator that combines reputation across chains
   - Use cross-chain messaging protocols for syncing reputation

2. **Chain-Specific Actions**:

   - Define actions that are specific to certain chains
   - Weight reputation differently based on the chain

3. **Verifiable Credentials**:
   - Implement verifiable credentials for portable reputation
   - Allow users to prove their reputation without direct contract interaction

## Implementation Notes

- The current implementation uses separate contract instances on each chain
- Future versions could explore cross-chain messaging protocols for synchronization
- For the hackathon, we've focused on demonstrating functionality rather than full cross-chain synchronization

## References

- [SimpleReputation Contract](../contracts/contracts/SimpleReputation.sol)
- [Deployed Addresses](../contracts/deployed-addresses.json)
- [Frontend Service](../frontend/src/services/core/SimpleReputationService.ts)
