# 🎭 MegaVibe - MetaMask Card Hackathon Submission

## 🏆 **Track 3: Identity & OnChain Reputation** - $6k Prize

**Bonus: MetaMask SDK Integration** - $2k Prize

**Total Prize Potential: $8,000**

---

## 🎯 **Project Overview**

MegaVibe transforms live events into collaborative content creation and monetization ecosystems, creating **onchain reputation through real-world behavioral data**. Attendees tip speakers using USDC via MetaMask Card, earning reputation points and unlocking exclusive perks.

### **Hackathon-Specific Features**

✅ **USDC Payments**: All tips and bounties use USDC stablecoin
✅ **MetaMask SDK Primary Auth**: Wallet-first authentication with signature verification
✅ **OnChain Reputation**: Behavioral data from live events creates verifiable reputation
✅ **Identity Integration**: Wallet addresses become portable identity across events
✅ **Loyalty Programs**: Reputation unlocks VIP access, speaking slots, and rewards
✅ **Dual Wallet Support**: MetaMask SDK + Dynamic.xyz fallback for maximum compatibility

---

## 🚀 **Quick Start (5 Minutes)**

### **Prerequisites**

- Node.js 18+
- MetaMask Browser Extension
- Mantle Sepolia testnet MNT tokens ([Get them here](https://faucet.sepolia.mantle.xyz/))

### **1. Clone & Install**

```bash
git clone [your-repo-url]
cd megavibe
npm run install:all
```

### **2. Environment Setup**

```bash
# Frontend environment
cp frontend/.env.example frontend/.env
# Backend environment
cp backend/.env.example backend/.env
```

### **3. Start the Demo**

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### **4. Connect MetaMask**

1. Visit `http://localhost:5173`
2. Click "Connect Wallet" - MetaMask SDK is prioritized automatically
3. Sign authentication message (no password needed!)
4. Switch to Mantle Sepolia network when prompted
5. Start tipping speakers with USDC!

---

## 🏗️ **Technical Architecture**

### **Smart Contracts (Mantle Sepolia)**

- **Tipping Contract**: `0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F`
- **Bounty Contract**: `0x59854F1DCc03E6d65E9C4e148D5635Fb56d3d892`
- **USDC Contract**: `0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9`

### **MetaMask SDK Primary Authentication**

```typescript
// Wallet-first authentication with signature verification
<MetaMaskProvider sdkOptions={{ ... }}>
  <DynamicContextProvider settings={{ ... }}>
    <AuthProvider>
      <AuthButton variant="primary" />
      <AuthModal
        priorityOrder={['metamask', 'dynamic', 'social']}
        onAuthenticated={handleAuth}
      />
    </AuthProvider>
  </DynamicContextProvider>
</MetaMaskProvider>
```

### **USDC Payment Flow**

```typescript
async function tipSpeaker(recipient: string, amount: string) {
  // 1. Approve USDC spending
  await usdcContract.approve(TIPPING_CONTRACT, usdcAmount);

  // 2. Send tip with automatic reputation update
  await tippingContract.tipSpeaker(
    recipient,
    usdcAmount,
    message,
    eventId,
    speakerId
  );

  // 3. Reputation system automatically awards:
  //    - Tipper: +1 reputation point
  //    - Speaker: +5 reputation points
}
```

---

## 🎪 **Demo Scenarios**

### **Scenario 1: Conference Attendee**

1. **Instant Authentication** - Sign message with MetaMask (no password!)
2. **Auto-detect venue** via GPS
3. **Tip favorite speaker** $5 USDC for great presentation
4. **Earn reputation** and unlock VIP networking session

### **Scenario 2: Event Speaker**

1. **Receive USDC tips** directly to wallet during presentation
2. **Build reputation** from audience engagement
3. **Convert tips to bounties** for additional content creation
4. **Unlock speaking fees** at future events based on reputation

### **Scenario 3: Event Organizer**

1. **Set up venue** with speaker profiles
2. **Create content bounties** using USDC
3. **Track engagement** through tip analytics
4. **Reward loyal attendees** with VIP perks

---

## 🔗 **Hackathon Requirements Compliance**

| Requirement                  | ✅ Status   | Implementation                                    |
| ---------------------------- | ----------- | ------------------------------------------------- |
| **USDC Payments**            | ✅ Complete | All transactions use USDC token on Mantle Sepolia |
| **MetaMask Card Use Cases**  | ✅ Complete | Reputation rewards, VIP access, loyalty programs  |
| **MetaMask SDK Integration** | ✅ Complete | Direct SDK integration for $2k bonus              |
| **Real-world Use Cases**     | ✅ Complete | Live event engagement, reputation building        |
| **Working Demo**             | ✅ Complete | Deployed and functional                           |

---

## 🧪 **Testing Instructions**

### **Local Testing**

```bash
# Test API endpoints
cd backend && node scripts/test-api-endpoints.js

# Test smart contract integration
cd frontend && npm run test:contracts

# Test MetaMask SDK
# 1. Open browser devtools
# 2. Connect via MetaMask option
# 3. Verify SDK connection in console
```

### **Live Demo**

- **Frontend**: `https://megavibe.vercel.app`
- **Backend**: `https://megavibe.onrender.com`
- **Health Check**: `https://megavibe.onrender.com/api/health`

---

## 💡 **Innovation Highlights**

### **1. MetaMask SDK Primary Authentication**

- **Signature-based login** eliminates password friction
- **Wallet-first identity** with portable reputation across events
- **Dual wallet support** MetaMask SDK + Dynamic.xyz fallback
- **Social login** for non-crypto users (limited features)

### **2. Behavioral Reputation System**

- **Tip amount correlates** with reputation earned
- **Time-based multipliers** for early event supporters
- **Cross-event reputation** follows users via wallet address

### **3. USDC-Native Design**

- **Gas-optimized contracts** for low-cost transactions
- **Platform fee system** supporting event organizers
- **Automatic USDC to reputation** conversion

### **4. Real-World Integration**

- **GPS venue detection** for proof of presence
- **Live event synchronization** with speaker schedules
- **QR code sharing** for instant tipping

---

## 🏆 **Business Model**

### **Revenue Streams**

1. **Platform fees** (5% of all transactions)
2. **Premium event features** for organizers
3. **Reputation-gated services** (VIP access, speaking slots)
4. **Analytics dashboards** for event insights

### **Value Proposition**

- **For Speakers**: Direct monetization + reputation building
- **For Attendees**: Enhanced engagement + networking perks
- **For Organizers**: Better analytics + revenue sharing

---

## 🛡️ **Security & Production Readiness**

### **Fixed for Hackathon**

✅ **Authentication system** secured  
✅ **CORS configuration** tightened  
✅ **Input validation** added  
✅ **Smart contract security** implemented  
✅ **USDC integration** completed

### **Production Deployment**

- **Vercel** for frontend hosting
- **Render** for backend API
- **MongoDB Atlas** for data persistence
- **Mantle Network** for low-cost transactions

---

## 📹 **Demo Video Script**

### **Opening (30s)**

"Hi! I'm excited to show you MegaVibe - turning live events into onchain reputation systems using USDC and MetaMask SDK."

### **Problem (30s)**

"At conferences, amazing speakers get applause but no direct compensation. Attendees want to show appreciation but have no easy way. And there's no reputation system for event participation."

### **Solution Demo (3min)**

1. **Connect MetaMask** - "First, I'll connect using MetaMask SDK for the hackathon"
2. **Venue Detection** - "The app detects I'm at ETHGlobal via GPS"
3. **Speaker Tipping** - "I'll tip this speaker $5 USDC for their amazing presentation"
4. **Reputation Update** - "Both of us earn reputation points onchain"
5. **VIP Unlock** - "My reputation unlocks VIP networking access"

### **Technical (1min)**

"Under the hood, we're using USDC on Mantle for low gas fees, MetaMask SDK for wallet integration, and smart contracts that automatically manage reputation based on real behavioral data."

### **Closing (30s)**

"MegaVibe transforms passive event attendance into active engagement, creating portable reputation that follows you across the Web3 ecosystem. Thank you!"

---

## 🔧 **Development Notes**

### **Key Fixes Made**

1. **MetaMask SDK Primary Auth** - Wallet-first authentication system
2. **Signature verification** - Secure login without passwords
3. **USDC integration** - Complete smart contract update
4. **Dual wallet support** - MetaMask SDK + Dynamic.xyz fallback
5. **CORS security** - Environment-specific origins

### **Known Limitations**

- **Testnet only** - Currently on Mantle Sepolia
- **Demo data** - Some mock data for presentation
- **Mobile optimization** - Desktop-first design

---

## 🎉 **Submission Checklist**

- [x] **Working demo** deployed and accessible
- [x] **USDC integration** complete and functional
- [x] **MetaMask SDK** integrated for bonus eligibility
- [x] **Real-world use cases** demonstrated
- [x] **README documentation** comprehensive
- [ ] **Demo video** recorded and edited
- [ ] **GitHub repository** public and clean

---

## 📞 **Contact & Links**

- **Demo**: `https://megavibe.vercel.app`
- **GitHub**: `[your-github-repo]`
- **Demo Video**: `[your-demo-video-link]`
- **Team**: `[your-contact-info]`

**Built for MetaMask Card Hackathon 2024** 🦊💳
