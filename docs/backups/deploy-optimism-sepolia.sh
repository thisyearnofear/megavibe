#!/bin/bash

# This script deploys the SimpleReputation contract to Optimism Sepolia
# using a focused configuration that avoids dependency issues

echo "Deploying SimpleReputation contract to Optimism Sepolia..."
echo "Using custom configuration to avoid dependency issues"

# Run the deployment with our focused configuration
npx hardhat run scripts/deploy-only-simple-reputation.js --config hardhat.simple-reputation.config.js --network optimismSepolia

echo "Deployment script completed"