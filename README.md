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
├── scripts/              # Project utilities and scripts
│   ├── blockchain/       # Scripts for blockchain interactions
│   ├── database/         # Scripts for database operations
│   ├── deployment/       # Scripts for deploying to various environments
│   ├── filcdn/           # FilCDN related scripts
│   ├── testing/          # Testing scripts including cross-chain tests
│   ├── utils/            # Utility scripts
│   └── README.md         # Documentation for scripts
│
├── isolated-deploy/      # Standalone deployment environment
│   ├── contracts/        # Simplified contract versions
│   └── scripts/          # Network-specific deployment scripts
│
└── docs/                 # Project documentation
    ├── TECHNICAL_OVERVIEW.md        # Comprehensive technical architecture
    ├── PROJECT_PLANNING.md          # Development roadmap and strategic planning
    └── GETTING_STARTED.md           # Deployment guide and UI concepts
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

See [docs/TECHNICAL_OVERVIEW.md](docs/TECHNICAL_OVERVIEW.md) for details on the implementation.

## Deployment

For instructions on deploying the contracts to various networks, see:

- [Getting Started Guide](docs/GETTING_STARTED.md)

## Testing

To test the cross-chain functionality:

```
cd scripts
npm install
node testing/test-cross-chain-reputation.js
```

For FilCDN testing:

```
cd scripts
npm install
node filcdn/test-filcdn.js
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

Run the FilCDN diagnostic tool:

```
cd scripts
npm install
node filcdn/filcdn-diagnostic.js
```

## License

[MIT License](LICENSE)
