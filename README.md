# MEGAVIBE 🎭

**The Live Performance Economy Platform**

Transform any live event into a collaborative content creation and monetization ecosystem using web3 primitives.

> **Development Status**: 🟢 MVP Ready | [View Implementation Plan](./IMPLEMENTATION_PLAN.md) | [Track Progress](#-current-status) | [Roadmap](./ROADMAP.md)

## 🎯 Vision

**Turn every live moment into valuable assets for everyone involved**

MegaVibe solves the core friction in live events: creators struggle with content marketing, audiences can't find or curate the best moments, and great performances often go unrecorded and unshared.

**Our Solution**: Web3-powered incentives that align everyone's interests through tokenization, tipping, bounties, and fractional ownership.

## 🚀 Key Differentiators

1. **Ease Of Connection Protocol**: GPS venue detection for Shazam-like live experience - instantly know who is there and what they are about
2. **Bounty-Driven Content**: Audience incentivises performers/creators to perform/discuss specific topics or songs (e.g. bounty for funniest ZK proofs talk, POIDH-style)
3. **Moment Tokenization**: Incentivise everyone to capture their perspective - pay to contribute content to pools, get paid when content is used, viral clips become tradeable assets
4. **Live Influence Economy**: Tips and bounties affect performances in real-time; venues/organisers use this for analytics and sentiment gauging
5. **Engagement Reputation**: On-chain proof of expertise and taste across events

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Mantle Sepolia testnet tokens for testing

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd megavibe

# Install dependencies
npm install

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and other secrets
npm install

# Frontend setup
cd ../frontend
cp .env.example .env
# Edit .env with your configuration (see Environment Setup below)
npm install
```

### Environment Setup

The frontend uses environment variables for wallet and network configuration:

```bash
# Frontend .env file
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
VITE_ENVIRONMENT=development

# Dynamic.xyz Configuration
VITE_DYNAMIC_ENVIRONMENT_ID=cd08ffe6-e5d5-49d4-8cb3-f9419a7f5e4d

# Mantle Network Configuration (Sepolia Testnet)
VITE_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
VITE_MANTLE_CHAIN_ID=5003
VITE_MANTLE_NETWORK_NAME=Mantle Sepolia

# Smart Contract Configuration
VITE_TIPPING_CONTRACT_ADDRESS=0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F
VITE_FEE_RECIPIENT_ADDRESS=0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901
VITE_PLATFORM_FEE_PERCENTAGE=5

# Development Features
VITE_DEBUG_MODE=true
```

### Running the Application

```bash
# Start MongoDB (if not running)
mongod

# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Wallet Setup

1. Install a Web3 wallet extension (MetaMask recommended)
2. Add Mantle Sepolia testnet to your wallet:
   - Network Name: Mantle Sepolia
   - RPC URL: https://rpc.sepolia.mantle.xyz
   - Chain ID: 5003
   - Currency Symbol: MNT
   - Block Explorer: https://explorer.sepolia.mantle.xyz
3. Get testnet MNT tokens from the [Mantle faucet](https://faucet.sepolia.mantle.xyz/)
4. Connect your wallet in the app and switch to Mantle Sepolia network

## � Core Features

### For Audiences

- **GPS Auto-Detection**: Walk into any venue and instantly see live performances
- **Proof of Presence**: Crypto-verified attendance at events builds reputation
- **Bounty Requests**: Pay performers to cover specific topics/songs
- **Moment Capture**: Record clips and earn fractional ownership of viral content
- **Engagement Proof**: On-chain history shows your expertise and taste

### For Creators/Speakers/Performers

- **Live Influence**: Audience tips and bounties affect your performance in real-time
- **Automated Content**: Audience creates and shares your content for you
- **Direct Analytics**: See who's engaged through tip data and wallet addresses
- **Instant Monetization**: Receive tips and bounty rewards during performances
- **Reputation Building**: Build verified audience across venues and events

### For Venues

- **Content Multiplication**: Every attendee becomes a potential content creator
- **Engagement Analytics**: Real-time data on audience reactions and preferences
- **Revenue Sharing**: Participate in tip and content monetization
- **Event Intelligence**: Data-driven insights for booking and programming

## 🏗️ Architecture

### Frontend (React + TypeScript)

```
src/
├── components/
│   ├── LiveMusic/        # ✅ VenuePicker, MegaVibeButton, SongIdentifier, TippingModal
│   ├── Social/           # ✅ AudioFeed, SnippetCard, SnippetRecorder
│   ├── WalletConnection/ # ✅ WalletStatusCard (consistent UI)
│   ├── Shared/           # ✅ EnhancedWalletConnector, LoadingStates
│   └── AppProviders.tsx  # ✅ Centralized provider wrapper
├── contexts/
│   └── WalletContext.tsx # ✅ Unified wallet state management
├── services/            # ✅ locationService, audioService, realtimeService, api, walletService
├── config/
│   └── environment.ts   # ✅ Centralized environment configuration
├── hooks/               # ✅ useWallet (wallet state), custom React hooks
├── utils/               # ✅ diagnostics.ts (development debugging)
└── styles/              # ✅ Design system and component styles
```

### Backend (Node.js + Express)

```
server/
├── models/              # ✅ Venue, Event, Song, AudioSnippet, User, Tip, Bounty
├── controllers/         # ✅ venueController, 🚧 eventController, audioController
├── routes/             # ✅ venueRoutes, existing routes, 🚧 new routes
├── services/           # ✅ db, stripe, 🚧 websocket, ipfs
├── middleware/         # ✅ validation, session, cors, security
└── config/             # ✅ Environment configs
```

## 🚀 Current Status

**MVP Ready** - Core platform functional with experience data

### ✅ Foundation Complete

- **GPS-based venue detection** with crypto conference data
- **MegaVibe button** for live performance identification
- **Dynamic.xyz wallet integration** with seamless Mantle Network support
- **Live tipping system** for speakers/performers during events
- **Unified wallet state** across all app pages and routes
- **Audio recording and IPFS storage**
- **Database seeded** with 20 crypto venues, 84 speaking sessions
- **Mobile-optimized responsive design**
- **Environment-based configuration** with validation and debugging

### 🎯 Next: Differentiation Features

- **Bounty System**: Audience pays for specific content requests
- **Moment Tokenization**: Fractional ownership of viral clips
- **Live Influence**: Tips affect performances in real-time
- **Engagement Analytics**: On-chain reputation and proof of presence

## 🔗 Wallet & Network Integration

### Dynamic.xyz Wallet Integration

MegaVibe uses [Dynamic.xyz](https://dynamic.xyz) for seamless wallet connection:

- **Multi-wallet Support**: MetaMask, Coinbase Wallet, WalletConnect, and more
- **Network Auto-switching**: Automatically prompts users to switch to Mantle Sepolia
- **Unified Interface**: Consistent wallet experience across all app pages
- **Error Handling**: Built-in retry logic and user-friendly error messages

### Mantle Network Configuration

- **Network**: Mantle Sepolia Testnet (Chain ID: 5003)
- **RPC**: https://rpc.sepolia.mantle.xyz
- **Explorer**: https://explorer.sepolia.mantle.xyz
- **Token**: MNT for all transactions
- **Gas Fees**: Ultra-low (~$0.01 per transaction)

### Smart Contracts

- **Tipping Contract**: `0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F`
- **Platform Fee**: 5% (95% goes to speakers/performers)
- **Fee Recipient**: `0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901`

### Architecture

```
AppProviders.tsx
├── DynamicContextProvider (wallet management)
├── WagmiProvider (blockchain interactions)
├── QueryClientProvider (data fetching)
└── WalletProvider (centralized state management)
    ├── App.tsx (/)
    └── TipPage.tsx (/tip)
```

**Key Features:**
- **Consistent State**: Single wallet context across all routes
- **Auto-reconnect**: Wallet state persists across page navigation
- **Network Validation**: Ensures users are on correct network
- **Balance Tracking**: Real-time balance updates
- **Error Recovery**: Automatic retry and user-friendly error messages

## 🛣️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed development phases.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

### Development Guidelines

#### Wallet Integration
- Always use the `useWallet()` hook from `WalletContext`
- Never create separate wallet state - use the centralized context
- Check `isWalletReady()` before performing blockchain operations
- Handle network switching through the provided context methods

#### Environment Configuration
- Use the centralized `env` configuration from `src/config/environment.ts`
- Add new environment variables to the validation schema
- Test configuration with `VITE_DEBUG_MODE=true` for detailed logging

#### Code Organization
- Keep wallet-related logic in the WalletContext
- Use AppProviders wrapper for any new top-level providers
- Maintain DRY principles - no duplicate wallet connection logic

## 📄 License

[License Type] - see LICENSE file for details

## 🙏 Acknowledgments

- Built for the Mantle Network ecosystem

---

**Demo**: [Coming Soon]
**Documentation**: [Coming Soon]
**Discord**: [Coming Soon]
