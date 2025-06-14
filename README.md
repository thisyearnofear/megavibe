# MEGAVIBE 🎵

A dual-platform dApp that transforms live music experiences through real-time identification, tipping, and social audio sharing on the Mantle Network.

> **Development Status**: 🟡 65% Complete | [View Roadmap](./ROADMAP.md) | [Track Progress](#-current-status)

## 🎯 Vision

MEGAVIBE combines two powerful experiences:

1. **Live Music Platform** - "Shazam for live music" with GPS-based venue detection, real-time tipping, and song bounties
2. **Social Audio Platform** - Share audio snippets, curate playlists, and build reputation as a taste-maker

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

## 🎵 Core Features

### For Fans

- **GPS Auto-Detection**: Walk into a venue and instantly see what's playing
- **One-Tap Recognition**: Hit the MEGAVIBE button to identify the current song
- **Instant Tipping**: Send tips to artists in MANTLE tokens
- **Song Bounties**: Request specific songs with token rewards
- **Audio Snippets**: Record and share moments from live events
- **Playlist Curation**: Build and share playlists of live recordings

### For Artists

- **Live Analytics**: Real-time metrics on audience engagement
- **Direct Monetization**: Receive tips and bounty rewards instantly
- **Song Catalog Management**: Upload your repertoire for easy identification
- **Performance Tracking**: See which songs resonate most at different venues
- **Fan Connection**: Build relationships with your audience

### For Venues

- **Revenue Generation**: Take a cut of digital tips on quiet nights
- **Event Promotion**: Showcase upcoming performances
- **Audience Analytics**: Understand what music works for your crowd
- **Digital Engagement**: Drive foot traffic through bounties and POAPs

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

The platform is approximately 65% complete with core functionality implemented:

### ✅ What's Working

- GPS-based venue detection with manual override
- Interactive MegaVibe button for song identification
- Tipping and bounty modal interfaces
- Audio recording and snippet creation
- Social feed structure
- Venue management API
- Database models for all core entities
- Design system and CSS styling for consistent UI (Phase 1 complete)

### 🚧 In Development

- Real-time WebSocket connections
- Audio file upload and streaming
- Mantle wallet integration

### 📋 Coming Soon

- Smart contracts for tipping/bounties
- IPFS integration for decentralized storage
- Artist analytics dashboard
- Playlist curation features
- Mobile app versions

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
- Inspired by the need to support live music venues and artists
- Leveraging patterns from the VOISSS project

---

**Demo**: [Coming Soon]
**Documentation**: [Coming Soon]
**Discord**: [Coming Soon]
