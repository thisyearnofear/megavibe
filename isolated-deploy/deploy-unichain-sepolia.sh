#!/bin/bash

# deploy-unichain-sepolia.sh
# Script to deploy SimpleReputation contract to Unichain Sepolia testnet

echo "🚀 Deploying SimpleReputation to Unichain Sepolia..."

# Make sure the .env.unichain file is set up
if [ ! -f .env.unichain ]; then
  echo "❌ .env.unichain file not found!"
  echo "Please create .env.unichain with your PRIVATE_KEY and UNICHAIN_SEPOLIA_RPC."
  exit 1
fi

# Check if the private key is set
grep -q "YOUR_PRIVATE_KEY_HERE" .env.unichain
if [ $? -eq 0 ]; then
  echo "❌ Please update your PRIVATE_KEY in .env.unichain"
  exit 1
fi

# Make sure npm packages are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Deploy the contract
echo "🔨 Deploying contract..."
npx hardhat run scripts/deploy-unichain.js --network unichainSepolia

echo "✅ Deployment process complete!"