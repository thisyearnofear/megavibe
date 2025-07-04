#!/bin/bash

# Filecoin Calibration Testnet Setup Script
# This script helps set up the environment for FilCDN migration

echo "🌐 Setting up Filecoin Calibration Testnet Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status "Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm is installed: $(npm --version)"

# Navigate to frontend directory
cd frontend

# Check if Synapse SDK is installed
if npm list @filoz/synapse-sdk &> /dev/null; then
    print_status "Synapse SDK is already installed"
else
    print_info "Installing Synapse SDK..."
    npm install @filoz/synapse-sdk
    print_status "Synapse SDK installed successfully"
fi

# Check if ethers is installed
if npm list ethers &> /dev/null; then
    print_status "Ethers.js is already installed"
else
    print_info "Installing Ethers.js..."
    npm install ethers
    print_status "Ethers.js installed successfully"
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    print_info "Creating .env.local file..."
    cp .env.example .env.local
    print_status ".env.local created from template"
else
    print_warning ".env.local already exists"
fi

echo ""
echo "🔧 Configuration Setup"
echo "====================="

# Generate a new private key if needed
print_info "Generating a new Filecoin private key for testing..."
GENERATED_KEY=$(node -e "
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('🔑 Generated Private Key:', wallet.privateKey);
console.log('📍 Address:', wallet.address);
console.log('');
console.log('⚠️  IMPORTANT: This is for TESTNET ONLY!');
console.log('   Never use this private key on mainnet or with real funds.');
console.log('');
console.log('📝 Add this to your .env.local file:');
console.log('VITE_FILECOIN_PRIVATE_KEY=' + wallet.privateKey);
console.log('VITE_FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1');
console.log('VITE_FILECOIN_WS_URL=wss://wss.calibration.node.glif.io/apigw/lotus/rpc/v1');
console.log('VITE_FILCDN_ENABLED=true');
console.log('');
console.log('WALLET_ADDRESS=' + wallet.address);
" | tee /tmp/filecoin_setup.log)

# Extract wallet address for faucet instructions
WALLET_ADDRESS=$(grep "WALLET_ADDRESS=" /tmp/filecoin_setup.log | cut -d'=' -f2)

echo ""
print_info "🌐 Filecoin Calibration Testnet Information:"
echo "   Network: Calibration (testnet)"
echo "   Sector Sizes: 32 GiB and 64 GiB"
echo "   Epoch Duration: 30 seconds"
echo "   Consensus Miner Min Power: 32 GiB"
echo ""

print_info "💰 Getting Testnet Tokens:"
echo "   1. FIL Tokens (for gas fees):"
echo "      - Chainsafe Faucet: https://faucet.calibration.fildev.network/"
echo "      - Zondax Faucet: https://beryx.zondax.ch/faucet"
echo "      - Forest Explorer: https://forest-archive.chainsafe.dev/faucet/"
echo ""
echo "   2. USDFC Tokens (for storage payments):"
echo "      - USDFC Faucet: https://faucet.calibration.fildev.network/"
echo ""
echo "   Your wallet address: $WALLET_ADDRESS"
echo ""

print_info "🔍 Network Explorers:"
echo "   - Filscan: https://calibration.filscan.io/"
echo "   - Beryx: https://beryx.zondax.ch/"
echo "   - Filfox: https://calibration.filfox.info/"

echo ""
print_info "Next steps to complete setup:"
echo ""
echo "1. 📝 Update your .env.local file with the generated private key"
echo "2. 🌐 Get Calibration testnet FIL from: https://faucet.calibration.fildev.network/"
echo "3. 💰 Get USDFC tokens from: https://faucet.calibration.fildev.network/"
echo "4. 🔍 Monitor your transactions at: https://calibration.filscan.io/"
echo ""

print_warning "Remember to:"
echo "   - Never commit your private key to version control"
echo "   - Only use testnet tokens for development"
echo "   - Keep your private key secure"

echo ""
print_status "Filecoin testnet setup complete!"
echo ""
echo "🚀 You can now run the FilCDN migration with:"
echo "   npm run dev"
echo "   Then navigate to the Admin panel and use the FilCDN Dashboard"