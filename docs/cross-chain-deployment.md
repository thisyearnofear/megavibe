# Cross-Chain Deployment Guide

This document provides comprehensive instructions for deploying and managing the MegaVibe SimpleReputation contract across multiple chains.

## Deployed Contracts

The SimpleReputation contract has been successfully deployed to the following networks:

| Network          | Chain ID | Contract Address                             | Status     |
| ---------------- | -------- | -------------------------------------------- | ---------- |
| Optimism Sepolia | 11155420 | `0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718` | ✅ Working |
| Unichain Sepolia | 1301     | `0x53628a5d15cfFac8C8F6c95b76b4FA436C7eaD1A` | ✅ Working |
| Ethereum Sepolia | 11155111 | `0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa` | ❌ Issues  |

## Deployment Process

### Prerequisites

- Node.js 16+ and npm
- Access to private keys with funds on target networks
- RPC endpoints for target networks

### Deployment Steps

1. **Configure Environment**:

   - Create environment file for the target network (example: `.env.unichain`)
   - Set private key and RPC endpoint

   ```
   # Network-specific .env file
   PRIVATE_KEY=your_private_key
   NETWORK_RPC=https://your-network-rpc.com
   OWNER_ADDRESS=0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901
   ```

2. **Deploy the Contract**:

   - Use the appropriate deployment script for your target network:

   ```bash
   # For Unichain Sepolia
   cd isolated-deploy
   ./deploy-unichain-sepolia.sh

   # For Optimism Sepolia
   cd contracts
   ./deploy-optimism-sepolia.sh
   ```

3. **Update Configuration**:
   After successful deployment, update the following files:

   - `contracts/deployed-addresses.json`: Update with new contract address
   - `frontend/.env`: Add the contract address to appropriate environment variable
   - `scripts/.env`: Update for cross-chain testing

## Testing Deployed Contracts

To verify functionality across multiple chains:

```bash
cd scripts
npm install
npm run test-cross-chain
```

To test specific chains:

```bash
# Test only Unichain Sepolia
node test-cross-chain-reputation.js --unichain

# Test only Optimism Sepolia
node test-cross-chain-reputation.js --optimism
```

## Troubleshooting

If you encounter issues during deployment:

1. **Contract Verification Fails**: Check that the contract version matches the verification service requirements
2. **Transaction Errors**: Ensure you have enough funds for gas on the target network
3. **RPC Connection Issues**: Try alternative RPC providers for the network
