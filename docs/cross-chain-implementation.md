# MegaVibe Cross-Chain Reputation System

This README provides instructions on how to test and use the cross-chain reputation system that has been implemented for the MetaMask Card Hackathon.

## Deployment Status

The SimpleReputation contract has been successfully deployed to:

- **Ethereum Sepolia**: `0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa`
- **Optimism Sepolia**: `0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718`

## Testing the Cross-Chain Functionality

To test the cross-chain functionality, follow these steps:

1. Navigate to the scripts directory:

   ```
   cd scripts
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Configure your `.env` file:

   - Edit the `.env` file in the scripts directory
   - Add your private key (make sure it's a test account with funds on both networks)

   ```
   PRIVATE_KEY=your_private_key_here
   ```

4. Run the test script:
   ```
   npm run test-cross-chain
   ```

The script will:

- Connect to both Ethereum Sepolia and Optimism Sepolia
- Check initial reputation scores
- Set reputation for a test address
- Increase reputation for another test address
- Verify the updated scores

## Frontend Configuration

The frontend has been configured to support multiple chains:

1. Environment variables have been set in `frontend/.env`
2. The SimpleReputationService has been updated to use the correct contract address based on the chain ID

When a user connects their wallet, the system will:

- Detect the current chain
- Connect to the appropriate contract
- Display reputation scores for that chain

## Documentation

For more detailed information about the cross-chain reputation system:

- See `docs/cross-chain-reputation.md` for architecture and implementation details
- Review the SimpleReputationService code in `frontend/src/services/core/SimpleReputationService.ts`

## Future Work

Future enhancements may include:

- True cross-chain aggregation of reputation scores
- Chain-specific reputation actions
- Integration with additional chains

## Contract Verification

The contracts have been deployed but not yet verified on block explorers. To verify:

1. For Ethereum Sepolia:

   ```
   npx hardhat verify --network sepolia 0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa "OWNER_ADDRESS"
   ```

2. For Optimism Sepolia, navigate to the isolated-deploy directory:
   ```
   cd isolated-deploy
   npx hardhat verify --network optimism-sepolia 0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718 "OWNER_ADDRESS"
   ```

Replace "OWNER_ADDRESS" with the address that was used as the owner during deployment.
