# MetaMask Card Hackathon - Deployment Guide

This guide explains how to set up environment variables and deploy the SimpleReputation contract to multiple chains for the MetaMask Card Hackathon.

## Environment Variables Setup

### 1. Contract Deployment Environment Variables

The Hardhat deployment requires environment variables to be set in the `contracts/.env` file. A sample file has been provided at `contracts/.env.sample`:

1. Copy the sample file:

   ```bash
   cp contracts/.env.sample contracts/.env
   ```

2. Edit `contracts/.env` with your actual values:
   - `PRIVATE_KEY`: Your deployer account's private key (without 0x prefix)
   - `INFURA_KEY`: Your Infura API key for accessing testnets
   - `ETHERSCAN_API_KEY`: For verifying contracts on Ethereum networks
   - Other API keys for L2 block explorers
   - Custom RPC URLs if needed

### 2. Frontend Environment Variables

The frontend needs environment variables to connect to the deployed contracts. A sample file has been provided at `frontend/.env.sample`:

1. Copy the sample file for your environment:

   ```bash
   # For local development
   cp frontend/.env.sample frontend/.env.local

   # For production
   cp frontend/.env.sample frontend/.env.production
   ```

2. Edit the file with your values, focusing on these SimpleReputation contract values:

   ```
   # SimpleReputation Contract Addresses
   VITE_SIMPLE_REPUTATION_SEPOLIA=0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa
   VITE_SIMPLE_REPUTATION_BASE_SEPOLIA=
   VITE_SIMPLE_REPUTATION_OP_SEPOLIA=
   VITE_SIMPLE_REPUTATION_ARB_SEPOLIA=
   VITE_SIMPLE_REPUTATION_MANTLE_SEPOLIA=
   ```

3. After deployment, you can use the `update-frontend-config.js` script which will automatically update the contract configuration in the frontend.

## Deployment Process

### Step 1: Deploy to Sepolia (Primary Testnet)

Sepolia is our primary testnet for the hackathon:

```bash
cd contracts
npx hardhat run scripts/deploy-simple-reputation.js --network sepolia
```

### Step 2: Update Deployment Tracking

After successful deployment, update the `contracts/deployed-addresses.json` file with the new contract address:

```json
"11155111": {
  "address": "your_deployed_contract_address",
  "deployedBlock": 1234567,
  "deployedDate": "2025-04-07",
  "notes": "Sepolia Testnet - Primary reputation contract"
}
```

### Step 3: Update Frontend Configuration

Run the helper script to automatically update the frontend configuration:

```bash
cd contracts
node scripts/update-frontend-config.js
```

Or manually update the `.env.local` or `.env.production` file with the new contract addresses.

### Step 4: Deploy to Additional Chains (Optional)

For a complete cross-chain demonstration, deploy to additional testnets:

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

After each deployment:

1. Update `contracts/deployed-addresses.json`
2. Run `node scripts/update-frontend-config.js`

## Verifying Deployment

After deployment, verify your contracts on the block explorers:

```bash
# For Sepolia
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS OWNER_ADDRESS

# For other networks
npx hardhat verify --network baseSepolia YOUR_CONTRACT_ADDRESS OWNER_ADDRESS
npx hardhat verify --network optimismSepolia YOUR_CONTRACT_ADDRESS OWNER_ADDRESS
npx hardhat verify --network arbitrumSepolia YOUR_CONTRACT_ADDRESS OWNER_ADDRESS
npx hardhat verify --network mantleSepolia YOUR_CONTRACT_ADDRESS OWNER_ADDRESS
```

## Testing the Frontend Integration

1. Start the frontend in development mode:

   ```bash
   cd frontend
   npm run dev
   ```

2. Connect your wallet to Sepolia testnet

3. Verify that reputation data is loading correctly

4. Switch to other testnets (if deployed) and verify that the correct contract is used on each chain

## Production Deployment

For the hackathon's production deployment:

1. Set all environment variables in `.env.production`
2. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
3. Deploy the built files to your hosting service

## Troubleshooting

### Contract Deployment Issues

- **Gas errors**: Check the gas settings in your Hardhat config
- **RPC connection errors**: Ensure your RPC URLs and API keys are valid
- **Verification failures**: Make sure the compiler version and settings match

### Frontend Connection Issues

- **Contract not found**: Verify the contract address is correct in your .env file
- **Wrong chain**: Ensure you're connected to the right network in MetaMask
- **Missing environment variables**: Check that all VITE\_\* variables are properly set

If you encounter issues, check the logs in the browser console and the terminal output for more details.
