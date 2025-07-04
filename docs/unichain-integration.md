# MegaVibe Cross-Chain Reputation System with Unichain Sepolia

This README provides instructions on how to deploy and test the cross-chain reputation system on Unichain Sepolia for the MetaMask Card Hackathon.

## Current Deployment Status

The SimpleReputation contract has been successfully deployed to:

- **Optimism Sepolia**: `0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718` (working)
- **Ethereum Sepolia**: `0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa` (needs troubleshooting)
- **Unichain Sepolia**: (to be deployed)

## Deploying to Unichain Sepolia

1. Navigate to the isolated deployment directory:

   ```
   cd isolated-deploy
   ```

2. Configure the environment file for Unichain Sepolia:

   ```
   # Edit .env.unichain with your private key
   nano .env.unichain
   ```

   Replace `YOUR_PRIVATE_KEY_HERE` with your actual private key. Make sure this account has ETH on Unichain Sepolia.

3. Run the deployment script:

   ```
   ./deploy-unichain-sepolia.sh
   ```

4. After successful deployment, note the contract address and update the following files:
   - `frontend/.env`: Add the contract address to `VITE_SIMPLE_REPUTATION_UNICHAIN_SEPOLIA`

## Testing Cross-Chain Functionality

To test the cross-chain functionality including Unichain Sepolia:

1. Update the `.env` file in the scripts directory:

   ```
   cd scripts
   nano .env
   ```

   Add the following to your `.env` file:

   ```
   UNICHAIN_SEPOLIA_RPC=https://1301.rpc.thirdweb.com
   UNICHAIN_SEPOLIA_CONTRACT=<your-deployed-contract-address>
   ```

2. Run the cross-chain test script:

   ```
   npm run test-cross-chain
   ```

   You can also test individual chains:

   ```
   # Test only Optimism Sepolia
   node test-cross-chain-reputation.js --optimism

   # Test only Unichain Sepolia
   node test-cross-chain-reputation.js --unichain
   ```

## Frontend Interaction

The frontend has been configured to support Unichain Sepolia with Chain ID 1301. When a user connects to Unichain Sepolia, the application will automatically use the correct contract address.

## Benefits of Using Unichain Sepolia

Unichain Sepolia provides several advantages for our cross-chain demonstration:

1. **Low gas fees**: Transaction costs are minimal on Unichain Sepolia
2. **Fast transaction times**: Confirmations happen quickly
3. **USDC available**: The testnet has USDC tokens available at address `0x31d0220469e10c4E71834a79b1f276d740d3768F`
4. **Chain ID 1301**: Easily distinguishable from other testnets

## Contract Details

The SimpleReputation contract deployed to Unichain Sepolia has the same functionality as other deployments:

- Track user reputation scores
- Increase/decrease reputation based on user actions
- Admin functions to set reputation directly
- Query reputation for multiple users at once

## Documentation

For more detailed information about the cross-chain reputation system:

- See `docs/cross-chain-reputation.md` for architecture and implementation details
- Review the SimpleReputationService code in `frontend/src/services/core/SimpleReputationService.ts`
