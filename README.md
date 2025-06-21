# MEGAVIBE 🎭

**The Live Performance Economy Platform**

Transform any live event into a collaborative content creation and monetization ecosystem

---

## 🚀 Quick Start

**Prerequisites:**

- Node.js 18+, MongoDB, Web3 wallet (MetaMask), Mantle Sepolia testnet tokens

**Install & Run:**

```bash
git clone [repository-url]
cd megavibe
npm install

# Backend
cd backend
cp .env.example .env  # Edit with your MongoDB URI
npm install

# Frontend
cd ../frontend
cp .env.example .env  # Edit with your config
npm install
```

**Start:**

```bash
# Start MongoDB if not running
mongod

# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173`

---

## 🌐 Wallet & Network

- Add Mantle Sepolia to your wallet:
  - RPC: https://rpc.sepolia.mantle.xyz, Chain ID: 5003, Symbol: MNT
- Get testnet MNT: [Mantle faucet](https://faucet.sepolia.mantle.xyz/)
- Connect wallet in app, switch to Mantle Sepolia

---

## 🎯 Features

- **Audience:** GPS auto-detect, proof of presence, bounties, moment capture, on-chain engagement
- **Creators:** Live tips/bounties, analytics, instant monetization, reputation
- **Venues:** Content from attendees, engagement analytics, revenue sharing

---

## 🏗️ Architecture

**Frontend:** React + TypeScript

- `src/components/` (UI, LiveMusic, Social, Wallet, AppProviders)
- `src/contexts/` (WalletContext)
- `src/hooks/` (useLiveTipFeed, useBountiesForEvent, useWallet)
- `src/services/` (walletService, api, realtimeService)
- `src/config/` (environment.ts)
- `src/styles/` (design system)

**Backend:** Node.js + Express

- `server/models/` (Venue, Event, User, Tip, Bounty)
- `server/controllers/`, `routes/`, `services/`, `middleware/`, `config/`

---

## ⚙️ Environment Setup

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
VITE_EVENT_CONTRACT_ADDRESS=0x3332Af8198A2b7382153f0F21f94216540c98598
VITE_TIPPING_CONTRACT_ADDRESS=0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F
VITE_BOUNTY_CONTRACT_ADDRESS=0x59854F1DCc03E6d65E9C4e148D5635Fb56d3d892
VITE_FEE_RECIPIENT_ADDRESS=0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901
VITE_PLATFORM_FEE_PERCENTAGE=5

# Development Features
VITE_DEBUG_MODE=true
```

---

## 🎯 Active Smart Contracts

- **Event Contract**: `0x3332Af8198A2b7382153f0F21f94216540c98598`
- **Tipping**: `0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F`
- **Bounties**: `0x59854F1DCc03E6d65E9C4e148D5635Fb56d3d892`
- **Platform Fee**: 5% across all transactions
- **Network**: Mantle Sepolia (ultra-low gas ~$0.01)

### 🔄 Integrated User Flows

- **Tip-to-Bounty**: Speakers convert earnings into content bounties
- **Real-time Engagement**: Live tip feed + bounty notifications
- **Cross-feature Navigation**: Seamless speaker → audience workflows

---

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

- **Event Contract**: `0x3332Af8198A2b7382153f0F21f94216540c98598`
- **Tipping Contract**: `0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F`
- **Bounty Contract**: `0x59854F1DCc03E6d65E9C4e148D5635Fb56d3d892`
- **Platform Fee**: 5% (95% goes to speakers/performers)
- **Fee Recipient**: `0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901`

---

## 🤝 Contributing

- Use `useWallet()` from WalletContext
- Centralize env config in `src/config/environment.ts`
- Keep wallet logic in WalletContext, use AppProviders for new providers
- DRY: No duplicate wallet logic
