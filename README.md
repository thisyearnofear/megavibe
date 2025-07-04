# MegaVibe Platform

MegaVibe is a web3 platform for live music events, providing tipping, bounties, and cross-chain reputation functionality.

## Project Structure

The repository is organized as follows:

```
megavibe/
├── contracts/            # Smart contracts (Solidity)
│   ├── contracts/        # Contract source files
│   ├── scripts/          # Deployment scripts for main contracts
│   └── deployed-addresses.json  # Record of deployed contract addresses
│
├── frontend/             # Next.js frontend application
│   ├── src/              # Source code
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   └── services/     # Service layer for blockchain interaction
│   └── .env.local        # Frontend environment configuration
│
├── scripts/              # Cross-chain testing scripts
│   ├── test-cross-chain-reputation.js  # Multi-chain test script
│   └── .env              # Testing environment configuration
│
├── isolated-deploy/      # Standalone deployment environment
│   ├── contracts/        # Simplified contract versions
│   └── scripts/          # Network-specific deployment scripts
│
└── docs/                 # Project documentation
    ├── cross-chain-reputation.md    # Architecture documentation
    ├── cross-chain-deployment.md    # Deployment guide
    └── technical.md                 # Technical overview
```

## Features

- **Cross-Chain Reputation System**: Track user reputation across multiple blockchains
- **Live Tipping**: Send tips to performers during live events
- **Bounties**: Create and fulfill bounties for event tasks
- **Web3 Integration**: Connect with MetaMask and other wallets

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MetaMask or compatible wallet
- Access to testnet ETH (Sepolia, Optimism Sepolia, Unichain Sepolia)

### Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/megavibe.git
   cd megavibe
   ```

2. Install dependencies:

   ```
   npm install
   cd frontend && npm install
   cd ../contracts && npm install
   ```

3. Configure environment:

   - Copy `.env.example` to `.env` in both the root and frontend directories
   - Update the values with your API keys and contract addresses

4. Start the frontend:
   ```
   cd frontend
   npm run dev
   ```

## MetaMask Card Hackathon Implementation

For the MetaMask Card Hackathon, we've implemented:

1. **Cross-Chain Reputation**: Working on Optimism Sepolia and Unichain Sepolia
2. **LI.FI SDK Integration**: For cross-chain transfers
3. **MetaMask SDK**: For seamless wallet connections

See [docs/cross-chain-reputation.md](docs/cross-chain-reputation.md) for details on the implementation.

## Deployment

For instructions on deploying the contracts to various networks, see:

- [Cross-Chain Deployment Guide](docs/cross-chain-deployment.md)

## Testing

To test the cross-chain functionality:

```
cd scripts
npm install
npm run test-cross-chain
```

## Next Steps: FilCDN Integration

The next phase of development focuses on the FilCDN implementation:

1. **Decentralized Storage** - Using Filecoin for content storage
2. **Content Delivery Network** - Fast access to decentralized content
3. **MetaMask Card Integration** - Using MetaMask Card for content purchasing

To get started with FilCDN integration:

```
# Set the environment variables in frontend/.env.local
# Private key is kept server-side for security
FILECOIN_PRIVATE_KEY=your_filecoin_private_key_here
NEXT_PUBLIC_FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
NEXT_PUBLIC_FILCDN_ENABLED=true
```

See [docs/filcdn-integration.md](docs/filcdn-integration.md) for detailed implementation guides.

## License

[MIT License](LICENSE)
