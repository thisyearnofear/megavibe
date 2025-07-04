#!/bin/bash

# MegaVibe Hackathon Quick Setup Script
# This script sets up the development environment for the MetaMask Card Hackathon

set -e

echo "🎭 MegaVibe Hackathon Setup"
echo "=========================="
echo ""

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
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js $(node -v) is installed"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the MegaVibe root directory"
    exit 1
fi

print_status "In correct directory"

# Install root dependencies
print_info "Installing root dependencies..."
npm install

# Setup Frontend
print_info "Setting up frontend..."
cd frontend

# Install frontend dependencies
npm install

# Setup environment file
if [ ! -f ".env" ]; then
    print_info "Creating frontend .env file from template..."
    cp .env.example .env
    print_warning "Please edit frontend/.env with your actual API keys:"
    print_warning "  - VITE_DYNAMIC_ENVIRONMENT_ID (from Dynamic.xyz)"
    print_warning "  - VITE_LIFI_API_KEY (from LI.FI dashboard)"
    print_warning "  - Other contract addresses as needed"
else
    print_status "Frontend .env file already exists"
fi

cd ..

# Setup Backend
print_info "Setting up backend..."
cd backend

# Install backend dependencies
npm install

# Setup environment file
if [ ! -f ".env" ]; then
    print_info "Creating backend .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        # Create basic .env file
        cat > .env << EOF
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/megavibe
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:5173
EOF
    fi
    print_warning "Please edit backend/.env with your actual configuration:"
    print_warning "  - MONGO_URI (MongoDB connection string)"
    print_warning "  - JWT_SECRET (random secret key)"
else
    print_status "Backend .env file already exists"
fi

cd ..

# Check for MongoDB
print_info "Checking MongoDB..."
if command -v mongod &> /dev/null; then
    print_status "MongoDB is installed"
else
    print_warning "MongoDB not found. Please install MongoDB or use MongoDB Atlas"
    print_info "Install MongoDB: https://docs.mongodb.com/manual/installation/"
    print_info "Or use MongoDB Atlas: https://www.mongodb.com/atlas"
fi

# Setup contracts (if directory exists)
if [ -d "contracts" ]; then
    print_info "Setting up smart contracts..."
    cd contracts
    
    if [ -f "package.json" ]; then
        npm install
        print_status "Contract dependencies installed"
    fi
    
    cd ..
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
print_info "Next steps:"
echo "1. Get your API keys:"
echo "   - LI.FI API Key: https://li.fi/developers"
echo "   - Dynamic.xyz Environment ID: https://app.dynamic.xyz/"
echo ""
echo "2. Update your .env files with the API keys"
echo ""
echo "3. Start MongoDB (if using local):"
echo "   mongod"
echo ""
echo "4. Start the development servers:"
echo "   # Terminal 1 - Backend"
echo "   cd backend && npm run dev"
echo ""
echo "   # Terminal 2 - Frontend"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Visit http://localhost:5173 to see your app"
echo ""
print_info "For hackathon submission, you need:"
print_status "✅ MetaMask SDK integration (already done)"
print_status "✅ USDC payments (already done)"
print_warning "🚧 LI.FI SDK integration (needs API key and testing)"
echo ""
print_info "Prize potential: $12,000 total"
print_info "- Identity & OnChain Reputation: $6k"
print_info "- MetaMask SDK Bonus: $2k"
print_info "- USDC Payments Bonus: $2k"
print_info "- LI.FI SDK Bonus: $2k"
echo ""
print_info "Good luck! 🚀"
