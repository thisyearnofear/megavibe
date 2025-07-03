# 🛠️ Technical Architecture and Decentralization - MegaVibe

## 🌐 Overview of Web3-Native Architecture

MegaVibe is built on a **Web3-native architecture**, prioritizing decentralization, censorship resistance, and alignment with blockchain principles. This approach eliminates traditional backend dependencies, reduces hosting costs, and ensures scalability through direct interactions with smart contracts, social identity protocols, and decentralized storage solutions.

### Architecture Decision: Web3-Native vs Hybrid

- **Chosen Approach: Pure Web3-Native** (Recommended for simplicity and alignment with Web3 principles)
  ```
  Frontend → Smart Contracts (Mantle)
          → Neynar API (Farcaster)
          → Static Data (IPFS/CDN)
  ```
- **Benefits**:

  - True decentralization and censorship resistance.
  - Simplified architecture with fewer moving parts.
  - Lower costs by eliminating backend hosting.
  - Scalable through blockchain and CDN infrastructure.

- **Alternative Considered: Hybrid with Bridge**
  ```
  Frontend → Smart Contracts + Neynar API (Primary)
          → Backend + MongoDB (Fallback/Admin)
  ```
  - Benefits include fallback during API outages and admin tools for manual curation, but adds complexity.

### Current Implementation Status

- **Farcaster Integration (Complete)**:
  - Live Neynar API for real Farcaster profiles.
  - Speaker discovery by username or wallet address.
  - Rich profiles with follower counts, bios, power badges, and verifications.
  - Web3 Speaker Cards for enhanced UI with social and on-chain data.
  - Talent page (`/talent`) for full discovery interface.
- **Smart Contract Integration**:
  - Tipping Contract: `0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F`
  - Bounty Contract: `0xf6D9428094bD1EF3427c8f0bBce6A4068B900b5F`
  - Cross-platform flow: Discover → Tip → Bounty → Track Impact.

### Core Services Architecture

- **Data Sources Priority**:
  1. **Smart Contracts (Mantle)**: Tips, bounties, reputation.
  2. **Neynar API (Farcaster)**: Social profiles, verification.
  3. **Static Data (CDN/IPFS)**: Events, venues, metadata.
- **Key Components**:
  - `web3SocialService.ts`: Neynar integration for profile fetching.
  - `contractService.ts`: On-chain interactions and reputation scoring.
  - `Web3SpeakerCard`: Rich profile display with social and on-chain data.

### User Journey

```
🔍 Discover → 💰 Tip → 🎯 Bounty → 🧠 Track Impact
   /talent     Live      Create     /infonomy
   Browse      Event     Content    Knowledge
   Speakers    Tips      Bounties   Flywheel
```

### Environment Configuration

```bash
# Required Environment Variables
VITE_NEYNAR_API_KEY=<YOUR_KEY>
VITE_NEYNAR_CLIENT_ID=<YOUR_CLIENT_ID>
VITE_TIPPING_CONTRACT_ADDRESS=0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F
VITE_BOUNTY_CONTRACT_ADDRESS=0xf6D9428094bD1EF3427c8f0bBce6A4068B900b5F
```

### Success Metrics

- ✅ **Integration**: Real Farcaster profiles displaying.
- ✅ **Contracts**: Live tipping and bounty creation.
- ✅ **UX**: Seamless cross-platform navigation.
- ✅ **Performance**: Fast loading with fallbacks.

### Next Steps for Web3 Integration

- **High Priority**:
  1. Deploy and test current integration in production.
  2. Add more speaker addresses for better discovery.
  3. Implement caching for improved performance.
- **Medium Priority**: 4. Enhanced search filters (follower count, power badge). 5. Real contract event integration for reputation. 6. Mobile optimization for better UX.
- **Future Enhancements**: 7. Lens Protocol integration for broader social coverage. 8. Cast display from speaker's recent activity. 9. Social actions (like, recast, follow).

---

## 🌐 FilCDN Migration and Decentralized Storage

MegaVibe is undergoing a significant transition from a traditional Web2 backend (Node.js + MongoDB) to a fully decentralized Web3 storage solution using **FilCDN** and **Filecoin PDP**. This migration eliminates single points of failure, reduces infrastructure costs by 85-90%, and ensures global content delivery with censorship resistance.

### Migration Overview

- **Current Architecture**: Traditional Web2 backend with MongoDB and local/S3 storage.
- **Target Architecture**: Decentralized Web3 storage with FilCDN and Filecoin.
- **Why Migrate?**:
  - ✅ **Decentralized Storage**: Eliminate single points of failure.
  - ✅ **Cost Efficiency**: Reduce hosting costs from $100-220/month to $8-26/month.
  - ✅ **Global CDN**: Sub-100ms response times worldwide.
  - ✅ **Censorship Resistance**: Unstoppable content availability.
  - ✅ **Web3 Native**: Align with blockchain principles.
  - ✅ **Hackathon Advantage**: Showcase cutting-edge technology.

### Current vs Future Architecture

- **Current Backend Dependencies**:

  ```
  Backend Services:
  ├── Event Management (MongoDB)
  ├── Speaker Profiles (MongoDB)
  ├── Tip History (MongoDB)
  ├── Real-time Updates (WebSocket)
  ├── File Storage (Local/S3)
  └── API Endpoints (Express.js)

  Issues:
  ❌ Single point of failure
  ❌ High hosting costs ($50-200/month)
  ❌ Centralized control
  ❌ Geographic latency
  ❌ Scaling complexity
  ```

- **Future FilCDN Architecture**:

  ```
  Decentralized Services:
  ├── Event Storage (FilCDN + Filecoin)
  ├── Speaker Profiles (IPFS + FilCDN)
  ├── Tip History (Blockchain + FilCDN)
  ├── Real-time Updates (P2P + WebRTC)
  ├── Media Storage (FilCDN)
  └── Client-side State (IndexedDB)

  Benefits:
  ✅ Decentralized resilience
  ✅ Near-zero hosting costs
  ✅ Censorship resistant
  ✅ Global CDN performance
  ✅ Web3 native architecture
  ```

### Current Migration Status: **READY FOR TESTING**

- **Completed Infrastructure (Phase 3.1)**:
  - **Core Services**:
    - FilCDN Service with full Synapse SDK integration on Calibration testnet.
    - Migration Service for batch processing with progress tracking.
    - Decentralized API with automatic fallback to backend.
    - Storage Services for event, speaker, and tip data.
  - **User Interface**:
    - FilCDN Dashboard for real-time monitoring.
    - Admin Integration with tab-based interface.
    - Connection Testing for connectivity verification.
    - Comprehensive error handling and display.
  - **Network Configuration**:
    - Calibration Testnet optimized for 32/64 GiB sectors, 30s epochs.
    - WebSocket Support via `wss://wss.calibration.node.glif.io`.
    - Multiple RPCs for reliability and network explorers (Filscan, Beryx, Filfox).
  - **Setup & Testing**:
    - Automated setup script (`scripts/setup-filecoin-testnet.sh`).
    - Connection test script (`scripts/test-filcdn-connection.js`).
    - Multiple faucets for testnet tokens.
    - Step-by-step documentation.

### Implementation Phases

- **Phase 3.1: FilCDN Foundation (Days 4-5)**:
  - Setup Filecoin Calibration Testnet in MetaMask.
  - Get testnet tokens (tFIL and USDFC) from faucets.
  - Install Synapse SDK (`npm install @filoz/synapse-sdk ethers`).
  - Create FilCDN Service for data storage and retrieval.
- **Phase 3.2: Data Migration (Days 6-7)**:
  - Implement services for event storage, speaker profiles, and tip history.
  - Use localStorage for CID mapping to quickly access decentralized data.
- **Phase 3.3: Backend Elimination (Days 8-9)**:
  - Replace API calls with decentralized services.
  - Update context providers for FilCDN integration.
  - Implement P2P real-time updates for live features.

### Migration Strategy

- **Week 1: Parallel Systems**: Run FilCDN alongside existing backend, test data storage.
- **Week 2: Hybrid Mode**: Read from FilCDN with backend fallback, write to both.
- **Week 3: FilCDN Primary**: Use FilCDN as primary source, backend as backup.
- **Week 4: Backend Sunset**: Remove backend dependencies, full FilCDN operation.

### Performance Considerations

- **FilCDN Advantages**:
  - Global CDN with sub-100ms response times.
  - Intelligent edge caching and redundancy.
  - Automatic scaling with demand.
- **Potential Challenges**:
  - Initial setup complexity (wallet configuration).
  - Real-time updates require P2P solutions.
- **Optimization Strategies**:
  - Data compression, batch operations, smart caching, and lazy loading.

### Cost Analysis

- **Current Backend Costs (Monthly)**: $100-220 (hosting, database, storage, CDN).
- **FilCDN Costs (Monthly)**: $8-26 (storage, retrieval, gas fees).
- **Cost Savings**: 85-90% reduction in infrastructure costs.

### Implementation Timeline

- **Day 4-5**: FilCDN Foundation setup and testing.
- **Day 6-7**: Data services for events, speakers, tips.
- **Day 8-9**: Integration and API replacement.
- **Day 10**: Optimization and final testing.

### Testing Strategy

- **Unit Tests**: Validate FilCDN service functionality.
- **Integration Tests**: Ensure full data lifecycle works.
- **Performance Tests**: Measure upload/download speeds and caching effectiveness.

### Success Metrics for Migration

- **Technical Metrics**:
  - Data availability at 99.9% uptime.
  - Response time under 200ms average.
  - Cost reduction over 80%.
  - Zero backend dependencies.
- **User Experience Metrics**:
  - No degradation in load time.
  - Improved reliability and global access.
  - Basic offline support.

### Ready to Test - Next Steps

- **Option A: Full End-to-End Test (Recommended)**:
  ```bash
  # 1. Run setup script
  ./scripts/setup-filecoin-testnet.sh
  # 2. Get testnet tokens from faucets
  # 3. Configure .env.local with generated keys
  # 4. Test connection
  node scripts/test-filcdn-connection.js
  # 5. Start application
  cd frontend && npm run dev
  # 6. Navigate to /admin → FilCDN Migration tab
  # 7. Test migration with sample data
  ```
- **Option B: Production Deployment**: Deploy optimized version, monitor performance.
- **Option C: Advanced Features**: Add storage optimization, caching, analytics.

### Future Enhancements

- **Phase 4: Advanced Features**:
  - Direct IPFS integration for larger files.
  - ENS domains for human-readable decentralized domains.
  - P2P real-time updates with WebRTC.
  - Full offline-first functionality.
- **Phase 5: Mainnet Migration**:
  - Filecoin Mainnet for production storage.
  - Cost and performance optimization.
  - Comprehensive monitoring.

---

## 🕷️ Web3 Event Scraping System

MegaVibe employs a sophisticated web scraping strategy to automatically discover and seed Web3 events, ensuring the platform remains up-to-date with relevant live performance opportunities. This system enhances the platform's ability to connect users with events globally.

- **Current Implementation**:
  - **Firecrawl Integration**: Web scraping with a 75% success rate, covering sources like GoWeb3.fyi, OnChain.org, and Lu.ma/crypto.
  - **Modular Architecture**: Includes BaseScrapingService, FirecrawlService, and EventScrapingOrchestrator for efficient data collection.
  - **Automated Scheduling**: Monthly cron-based scraping (`0 0 1 * *`).
  - **Real Events Seeded**: 8 major Web3 events for 2025, including ETHDenver, Consensus, and Devcon.
  - **API Monitoring**: Comprehensive endpoints for status, triggering, and testing scraping jobs.
  - **Error Handling**: Retry logic, rate limiting, and validation for reliability.
- **Performance Metrics**:
  - API Success Rate: 75%.
  - Processing Speed: ~51 seconds for 3 sources.
  - Error Recovery: 3 retry attempts with exponential backoff.
- **Roadmap**:
  - Social media integration via Masa API for Twitter event discovery.
  - AI-powered parsing and speaker detection for enhanced data extraction.
  - Real-time webhooks and multi-language support for international events.
- **Usage**:
  - Scripts for testing (`npm run scrape:test`), debugging (`npm run scrape:debug`), and full scraping (`npm run scrape`).
  - Admin dashboard at `/admin/scraping` for monitoring and manual triggering.

This scraping system ensures MegaVibe's database is populated with the latest Web3 events, providing a robust foundation for user engagement and event monetization.

## 🎯 Why Decentralization Matters for MegaVibe

- **Simpler**: Fewer systems to maintain with direct blockchain/API interactions.
- **Faster**: Improved performance with global CDN and optimized data flows.
- **Cheaper**: Significant cost reductions by eliminating backend infrastructure.
- **Aligned**: Fully embraces Web3 principles of decentralization and user ownership.
- **Scalable**: Ready for growth with blockchain and decentralized storage handling demand.

**Current Status**: Web3 integration fully functional with Farcaster and smart contracts; FilCDN migration ready for testing.  
**Test URL**: `http://localhost:5173/talent`  
**Next Milestone**: Complete end-to-end testing of FilCDN migration and deploy to production.
