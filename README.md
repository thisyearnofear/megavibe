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
- Mantle Testnet wallet

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
# Edit .env with your API endpoints
npm install
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
│   ├── LiveMusic/        # ✅ VenuePicker, MegaVibeButton, SongIdentifier, TippingModal, BountyModal
│   ├── Social/           # ✅ AudioFeed, SnippetCard, SnippetRecorder
│   └── Shared/           # 🚧 WalletConnector, LoadingStates
├── services/            # ✅ locationService, audioService, realtimeService, api
├── hooks/               # 📋 Custom React hooks (coming soon)
├── utils/               # 📋 Helper functions (coming soon)
└── styles/              # ✅ Design system and component styles (Phase 1 complete)
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

- GPS-based venue detection with crypto conference data
- MegaVibe button for live performance identification
- Dynamic.xyz wallet integration with Mantle Network
- Audio recording and IPFS storage
- Database seeded with 20 crypto venues, 84 speaking sessions
- Mobile-optimized responsive design

### 🎯 Next: Differentiation Features

- **Bounty System**: Audience pays for specific content requests
- **Moment Tokenization**: Fractional ownership of viral clips
- **Live Influence**: Tips affect performances in real-time
- **Engagement Analytics**: On-chain reputation and proof of presence

## 🔗 Mantle Network Integration

- **Wallet Connection**: Via WalletConnect/MetaMask
- **Smart Contracts**: Tipping, bounties, and POAP distribution
- **Token**: MANTLE for all transactions
- **Network**: Mantle Testnet (mainnet coming soon)

## 🛣️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed development phases.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 📄 License

[License Type] - see LICENSE file for details

## 🙏 Acknowledgments

- Built for the Mantle Network ecosystem

---

**Demo**: [Coming Soon]
**Documentation**: [Coming Soon]
**Discord**: [Coming Soon]
