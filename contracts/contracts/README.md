# SimpleReputation Contract

A simplified reputation system designed for the MetaMask Card Hackathon. This contract provides a clean, efficient way to track user reputation across multiple chains.

## Overview

The SimpleReputation contract stores and manages reputation scores for users, with the following key features:

- Get, increase, decrease, and set reputation values
- Multiple reputation lookup in a single call
- Simple permission system with owner and service address
- Emergency pause/unpause functionality

## Deployment Process

### Step 1: Prepare Environment

First, set up your environment variables by creating a `.env` file in the `contracts` directory:

```
PRIVATE_KEY=your_private_key
INFURA_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_api_key
OPTIMISM_API_KEY=your_optimism_api_key
ARBITRUM_API_KEY=your_arbitrum_api_key
BASE_API_KEY=your_base_api_key
```

### Step 2: Deploy to Sepolia Testnet

Sepolia is our primary testnet for the hackathon:

```bash
cd contracts
npx hardhat run scripts/deploy-simple-reputation.js --network sepolia
```

After deployment, update the `deployed-addresses.json` file with the contract address:

```json
"11155111": {
  "address": "your_contract_address",
  "deployedBlock": 1234567,
  "deployedDate": "2025-04-07",
  "notes": "Sepolia Testnet - Primary reputation contract"
}
```

### Step 3: Update Frontend Configuration

Run the update-frontend-config script to automatically update the frontend with your deployed contract addresses:

```bash
node scripts/update-frontend-config.js
```

### Step 4: Deploy to Additional Chains (Optional)

For cross-chain functionality demonstration, deploy to additional testnets:

```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy-simple-reputation.js --network baseSepolia

# Deploy to Optimism Sepolia
npx hardhat run scripts/deploy-simple-reputation.js --network optimismSepolia

# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy-simple-reputation.js --network arbitrumSepolia

# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy-simple-reputation.js --network mantleSepolia
```

Update `deployed-addresses.json` after each deployment and run the frontend config update script.

## Testing the Deployment

### 1. Verify Contract on Etherscan

The deployment script automatically attempts to verify the contract on Etherscan, but you can also do it manually:

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS OWNER_ADDRESS
```

### 2. Test Basic Reputation Functions

Use the Hardhat console to test basic functionality:

```bash
npx hardhat console --network sepolia

// Connect to the deployed contract
const SimpleReputation = await ethers.getContractFactory("SimpleReputation");
const simpleReputation = await SimpleReputation.attach("DEPLOYED_CONTRACT_ADDRESS");

// Check reputation for an address
await simpleReputation.reputation("0xYourAddress");

// Set reputation (if you're the owner)
await simpleReputation.setReputation("0xSomeAddress", 1000);
```

### 3. Test Frontend Integration

1. Start the frontend application
2. Connect your wallet to the Sepolia network
3. Navigate to the profile or reputation section
4. Verify that your reputation score is displayed correctly

## Frontend Integration Details

The frontend interacts with the deployed contracts through:

1. **SimpleReputationService**: Direct interaction with the contract.
2. **ReputationServiceAdapter**: Ensures backward compatibility with UI.

When a user switches chains, the application will:

1. Detect the new chain ID
2. Look up the SimpleReputation contract address for that chain
3. Connect to the contract on the new chain
4. Display reputation data from the new chain

## Cross-Chain Functionality

For the MetaMask Card Hackathon, we're implementing a simplified cross-chain approach:

1. Each chain has its own independent SimpleReputation contract
2. Users can view their reputation on any supported chain
3. The frontend will show the current chain's reputation score
4. Actions (like payments via MetaMask Card) will affect reputation on the current chain

For a full production implementation, a cross-chain messaging solution would be used to synchronize reputation across chains.

## Maintaining Contract Addresses

After deployment, always:

1. Update `deployed-addresses.json` with new addresses
2. Run the update script: `node scripts/update-frontend-config.js`
3. Commit these changes to the repository

This ensures the frontend always has the correct contract addresses for each chain.
