# MegaVibe Technical Overview and Architecture

This document provides a comprehensive overview of MegaVibe's technical architecture, focusing on its Web3-native design, decentralized storage, cross-chain capabilities, and transaction infrastructure.

## 🌐 Web3-Native Architecture

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
  1.  **Smart Contracts (Mantle)**: Tips, bounties, reputation.
  2.  **Neynar API (Farcaster)**: Social profiles, verification.
  3.  **Static Data (CDN/IPFS)**: Events, venues, metadata.
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
  1.  Deploy and test current integration in production.
  2.  Add more speaker addresses for better discovery.
  3.  Implement caching for improved performance.
- **Medium Priority**: 4. Enhanced search filters (follower count, power badge). 5. Real contract event integration for reputation. 6. Mobile optimization for better UX.
- **Future Enhancements**: 7. Lens Protocol integration for broader social coverage. 8. Cast display from speaker's recent activity. 9. Social actions (like, recast, follow).

## 💾 Decentralized Storage with FilCDN

MegaVibe now implements a fully decentralized approach to storing event data using FilCDN, which leverages the Filecoin network for persistent storage. This eliminates the need for API calls to a centralized backend, improving reliability and censorship resistance.

> **Note**: FilCDN currently supports only PDP deals made on the Filecoin Calibration network. Mainnet support is coming in early July 2025. File size is limited to 254 MiB.

### Architecture

The FilCDN integration consists of several key components:

1.  **FilCDNService**: Core service for interacting with the Filecoin network via the Synapse SDK
2.  **DecentralizedApiService**: Higher-level service that uses FilCDN for storing and retrieving application data
3.  **FilCDNContext**: React context provider that makes FilCDN functionality available throughout the application
4.  **useFilCDNStorage**: Custom hook for convenient FilCDN operations in React components
5.  **Storage Services**: Specialized services for different data types (events, speakers, tips)

### Flow Diagram

```
┌─────────────────┐      ┌───────────────────┐      ┌──────────────┐
│                 │      │                   │      │              │
│  React UI       │─────▶│  FilCDNContext    │─────▶│ FilCDNService│─────┐
│  Components     │◀─────│                   │◀─────│              │     │
│                 │      │                   │      │              │     │
└─────────────────┘      └───────────────────┘      └──────────────┘     │
                                  │                                       │
                                  │                                       ▼
                                  │                              ┌──────────────┐
                                  │                              │              │
                                  │                              │ Filecoin     │
                                  ▼                              │ Network      │
                         ┌──────────────────┐                    │ (via Synapse)│
                         │                  │                    │              │
                         │DecentralizedApi  │                    └──────────────┘
                         │Service           │                            ▲
                         │                  │                            │
                         └──────────────────┘                            │
                                  │                                      │
                                  ▼                                      │
                         ┌──────────────────┐                            │
                         │ EventStorage     │                            │
                         │ SpeakerStorage   │───────────────────────────┘
                         │ TipStorage       │
                         └──────────────────┘
```

### Core Components

#### FilCDNService

The `FilCDNService` (in `frontend/src/services/filcdnService.ts`) is the primary interface for interacting with the Filecoin network. It handles:

- Initialization of the Synapse SDK
- Storage of data on FilCDN
- Retrieval of data from FilCDN
- CDN URL generation
- Error handling and statistics

#### FilCDNContext

The `FilCDNContext` (in `frontend/src/contexts/FilCDNContext.tsx`) is a React context provider that:

- Initializes the FilCDN service
- Provides FilCDN functionality to all components
- Tracks initialization and error states
- Exposes storage and retrieval methods
- Periodically updates FilCDN statistics

#### useFilCDNStorage Hook

The `useFilCDNStorage` hook (in `frontend/src/hooks/useFilCDNStorage.ts`) provides a convenient interface for React components to use FilCDN, including:

- Simplified storage and retrieval methods
- Loading state management
- Error handling
- Automatic retry capabilities
- CDN URL generation

#### DecentralizedApiService

The `DecentralizedApiService` (in `frontend/src/services/decentralizedApiService.ts`) is a higher-level service that:

- Replaces traditional API calls with decentralized storage operations
- Provides specialized methods for different data types (events, speakers, tips)
- Handles fallback mechanisms for reliability
- Maintains cached indexes for efficient data access

### Configuration

#### Environment Variables

FilCDN integration requires several environment variables:

```
# FilCDN Configuration
VITE_FILCDN_ENABLED=true
VITE_USE_REAL_FILCDN=true
VITE_FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
VITE_FILCDN_MIN_REPUTATION=100
VITE_FILCDN_PRIVATE_KEY=your_private_key_here
```

#### Private Key Management

For security reasons, private keys should not be stored in frontend code. In production:

1.  Use a backend service to generate and manage keys
2.  Use wallet-based authentication for operations
3.  Implement a signing service for FilCDN operations

#### Required Blockchain Setup

Before using FilCDN, ensure:

1.  USDFC tokens are deposited to the wallet
2.  The Pandora service is approved for automated payments
3.  The wallet has sufficient allowance for storage operations

### Usage Examples

#### Basic Storage and Retrieval

```typescript
import { useFilCDNStorage } from "../hooks/useFilCDNStorage";

function MyComponent() {
  const { storeData, retrieveData, loading, error } = useFilCDNStorage();

  async function handleSave() {
    const data = { message: "Hello FilCDN", timestamp: Date.now() };
    const result = await storeData(data);
    console.log("Stored with CID:", result?.cid);
  }

  async function handleLoad(cid: string) {
    const data = await retrieveData(cid);
    console.log("Retrieved data:", data);
  }

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleSave}>Save to FilCDN</button>
    </div>
  );
}
```

#### Direct CDN URL Access

```typescript
import { useFilCDN } from "../contexts/FilCDNContext";

function ImageComponent({ cid }: { cid: string }) {
  const { getCDNUrl } = useFilCDN();
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function loadUrl() {
      const url = await getCDNUrl(cid);
      setImageUrl(url);
    }
    loadUrl();
  }, [cid]);

  return imageUrl ? (
    <img src={imageUrl} alt="FilCDN content" />
  ) : (
    <p>Loading...</p>
  );
}
```

### Troubleshooting

#### Common Issues

1.  **Operator Not Approved Error**

    - **Problem**: This occurs when the wallet hasn't approved the Pandora service for FilCDN operations.
    - **Solution**: Call `SynapseFilCDNService.setupPayments()` to approve the service with sufficient allowance.

2.  **Insufficient Allowance**

    - **Problem**: The wallet doesn't have enough USDFC allowance for storage operations.
    - **Solution**: Increase allowance through `SynapseFilCDNService.setupPayments()` with a higher amount.

3.  **Incompatible RPC Endpoint**

    - **Problem**: The RPC endpoint doesn't support required methods (`eth_signTypedData_v4`).
    - **Solution**: Use a compatible endpoint like `https://api.calibration.node.glif.io/rpc/v1`.

4.  **BigInt Serialization Issues**
    - **Problem**: JSON.stringify() fails with BigInt values from blockchain responses.
    - **Solution**: Use custom serialization with BigInt handling or convert BigInt to string before serialization.

### Diagnostic Tools

1.  **FilCDN Stats**

    ```typescript
    const { stats } = useFilCDN();
    console.log("FilCDN Status:", stats);
    ```

2.  **Connection Test**
    ```typescript
    const { filcdn } = useFilCDN();
    const isCompatible = await filcdn?.testRPCCompatibility();
    console.log("RPC Compatible:", isCompatible);
    ```

### Performance Considerations

1.  **CDN Caching**

    - First-time retrievals are slower as data is loaded from Filecoin
    - Subsequent retrievals are much faster due to CDN caching
    - Test results show ~80% improvement in download speeds after initial load

2.  **Data Size Limits**

    - Maximum file size is 254 MiB per upload
    - Large datasets should be split into smaller chunks

3.  **Local Caching**
    - All services implement local storage caching for fallback and performance
    - Critical data is always available even without network connectivity

### Future Improvements

1.  **WebRTC Integration**: Enable peer-to-peer data sharing for real-time updates
2.  **Content Addressing**: Implement IPLD-based content addressing for better data organization
3.  **Wallet Integration**: Deeper integration with user wallets for permissioned access
4.  **Multi-network Support**: Expand beyond Filecoin Calibration to other networks

## ⛓️ Cross-Chain Reputation System

The SimpleReputation contract has been deployed to multiple EVM-compatible chains to demonstrate cross-chain functionality. Users can build reputation on any supported chain, and the MegaVibe frontend will aggregate and display these reputation scores across chains.

### Deployed Contracts

The SimpleReputation contract has been successfully deployed to the following networks:

| Network          | Chain ID | Contract Address                             | Status     |
| :--------------- | :------- | :------------------------------------------- | :--------- |
| Optimism Sepolia | 11155420 | `0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718` | ✅ Working |
| Unichain Sepolia | 1301     | `0x53628a5d15cfFac8C8F6c95b76b4FA436C7eaD1A` | ✅ Working |
| Ethereum Sepolia | 11155111 | `0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa` | ❌ Issues  |

### Architecture

#### Smart Contracts

1.  **SimpleReputation.sol**: The main contract implementing the reputation system with the following features:

    - Track user reputation scores
    - Increase/decrease reputation
    - Admin functions to set reputation directly
    - View functions to retrieve reputation scores

2.  **SimpleReputationStandalone.sol**: A standalone version with inlined dependencies, used for deployment to chains where the normal compilation process had issues.

#### Frontend Integration

The frontend services have been updated to support multi-chain reputation:

1.  **SimpleReputationService.ts**: Core service that interfaces with the contract across multiple chains

    - Determines which contract to use based on the current chain ID
    - Provides methods to read and modify reputation scores

2.  **ReputationServiceAdapter.ts**: Adapter that maintains backward compatibility with existing UI components
    - Translates SimpleReputationScore to the original ReputationScore format
    - Adds mock category breakdowns for UI display

### Deployment Process

The deployment process involved two main approaches:

1.  **Standard Deployment** (Ethereum Sepolia):

    - Used the regular Hardhat configuration
    - Deployed with standard OpenZeppelin imports

2.  **Isolated Deployment** (Optimism Sepolia & Unichain Sepolia):
    - Created a standalone version of the contract with inlined dependencies
    - Used a separate deployment environment to avoid compilation issues
    - Successfully deployed to Optimism Sepolia and Unichain Sepolia

### How It Works

1.  **User Interaction**:

    - Users interact with the MegaVibe platform across different chains
    - Actions like tipping, content creation, and event participation earn reputation points

2.  **Reputation Tracking**:

    - Each chain has its own SimpleReputation contract that tracks user points
    - Authorized services can increase/decrease reputation based on user actions

3.  **Frontend Display**:
    - The frontend connects to the appropriate contract based on the current chain
    - When viewing profiles, the system can query reputation across chains
    - Future implementation may include cross-chain aggregation of scores

### Testing Cross-Chain Functionality

To test the cross-chain functionality, follow these steps:

1.  Navigate to the scripts directory:

    ```
    cd scripts
    ```

2.  Install dependencies:

    ```
    npm install
    ```

3.  Configure your `.env` file:

    - Edit the `.env` file in the scripts directory
    - Add your private key (make sure it's a test account with funds on all networks)

    ```
    PRIVATE_KEY=your_private_key_here
    ```

4.  Run the test script:
    ```
    npm run test-cross-chain
    ```

The script will:

- Connect to all configured Sepolia networks (Ethereum, Optimism, Unichain)
- Check initial reputation scores
- Set reputation for a test address
- Increase reputation for another test address
- Verify the updated scores

### Frontend Configuration

The frontend has been configured to support multiple chains:

1.  Environment variables have been set in `frontend/.env`
2.  The SimpleReputationService has been updated to use the correct contract address based on the chain ID

When a user connects their wallet, the system will:

- Detect the current chain
- Connect to the appropriate contract
- Display reputation scores for that chain

### Benefits of Using Unichain Sepolia

Unichain Sepolia provides several advantages for our cross-chain demonstration:

1.  **Low gas fees**: Transaction costs are minimal on Unichain Sepolia
2.  **Fast transaction times**: Confirmations happen quickly
3.  **USDC available**: The testnet has USDC tokens available at address `0x31d0220469e10c4E71834a79b1f276d740d3768F`
4.  **Chain ID 1301**: Easily distinguishable from other testnets

### Future Enhancements

1.  **Cross-Chain Aggregation**:

    - Implement a score aggregator that combines reputation across chains
    - Use cross-chain messaging protocols for syncing reputation

2.  **Chain-Specific Actions**:

    - Define actions that are specific to certain chains
    - Weight reputation differently based on the chain

3.  **Verifiable Credentials**:
    - Implement verifiable credentials for portable reputation
    - Allow users to prove their reputation without direct contract interaction

## ⚡ Transaction Infrastructure

We have successfully replaced the mocked payment flows with **real blockchain transaction processing**, transforming the user experience from fake interactions to actual on-chain transactions.

### Implemented Components

1.  **Core Transaction Service**

    - **File**: `frontend/src/services/blockchain/transactionService.ts`
    - **Features**:
      - Real gas estimation with USD conversion
      - Transaction sending and monitoring
      - Comprehensive error handling
      - Network status monitoring
      - User balance checking

2.  **Real Tipping Service**

    - **File**: `frontend/src/services/blockchain/realTippingService.ts`
    - **Features**:
      - Actual ETH/token transfers to performers
      - Gas estimation for tips
      - Transaction status monitoring
      - Local storage for immediate UI updates
      - Real-time event subscription
      - Performer validation

3.  **Real Bounty Service**

    - **File**: `frontend/src/services/blockchain/realBountyService.ts`
    - **Features**:
      - On-chain bounty creation with escrow
      - Bounty response submission
      - Deadline management
      - Response acceptance/rejection
      - Real-time bounty monitoring

4.  **Enhanced QuickTip Component**

    - **Updated**: `frontend/src/components/mobile/QuickTip.tsx`
    - **New Features**:
      - Real-time gas estimation
      - Transaction error handling with retry
      - Success states with blockchain links
      - Progressive transaction monitoring
      - Comprehensive user feedback

5.  **Transaction Monitoring Hooks**
    - **File**: `frontend/src/hooks/useTransactionMonitor.ts`
    - **Features**:
      - Real-time transaction status polling
      - Batch transaction monitoring
      - Confirmation counting
      - Estimated completion times

### User Experience Transformation

#### Before: Fake Success

```typescript
// Old mocked flow
setTimeout(() => {
  onComplete(); // Fake success after 500ms
}, 500);
```

#### After: Real Blockchain Transactions

```typescript
// New real transaction flow
1. Gas estimation with USD costs
2. Wallet connection validation
3. Performer validation
4. Real blockchain transaction
5. Transaction monitoring
6. Confirmation feedback
7. Error handling with retry
```

### New Transaction Flow

#### Enhanced Tip Flow (8-15 seconds)

1.  **User selects amount** → Real-time gas estimation
2.  **Tap "Send Tip"** → Wallet connection (if needed)
3.  **Transaction sent** → Blockchain processing
4.  **Immediate feedback** → "Tip Sent! Confirming..."
5.  **Background monitoring** → Waiting for confirmation
6.  **Success state** → "Confirmed!" with Etherscan link

#### Error Handling States

- **Insufficient Funds**: Clear message with balance check
- **Gas Too High**: Retry suggestion with network status
- **User Rejected**: Retry option with explanation
- **Network Error**: Automatic retry with backoff
- **Contract Error**: Detailed error with suggested action

### Technical Improvements

#### Real Gas Estimation

```typescript
const gasEstimate = await realTippingService.estimateTipGas(
  performer.id,
  finalAmount,
  message
);
// Shows: "Network fee: ~0.0023 ETH ($4.60)"
// Shows: "Total: ~5.0023 ETH"
```

#### Transaction Monitoring

```typescript
const result = await realTippingService.sendTip(performer.id, amount, message);
// Returns real txHash for monitoring
// Polls blockchain for confirmation
// Updates UI with real status
```

#### Error Recovery

```typescript
if (error.type === "insufficient_funds") {
  // Show balance, suggest adding funds
} else if (error.type === "user_rejected") {
  // Show retry button with explanation
} else if (error.retryable) {
  // Show retry option
}
```

## 🏗️ Frontend Production Architecture

This section outlines the technical architecture for implementing "The Stage" UI concept in the new `/frontend-production` directory.

### Core Principles

1.  **Component Composition**: Build complex UIs from simple, focused components
2.  **State Isolation**: Keep state as close as possible to where it's used
3.  **Unidirectional Data Flow**: Data flows down, events flow up
4.  **Progressive Enhancement**: Core functionality works with minimal dependencies
5.  **Performance First**: Optimize for initial load and interaction responsiveness

### Directory Structure

```
/frontend-production
├── public/                    # Static assets
├── src/
│   ├── app/                   # App initialization
│   │   ├── App.tsx            # Root component
│   │   ├── AppProviders.tsx   # Context providers
│   │   └── routes.tsx         # Route definitions
│   │
│   ├── components/            # Shared UI components
│   │   ├── core/              # Base components (Button, Card, etc.)
│   │   ├── feedback/          # Loaders, notifications, etc.
│   │   ├── layout/            # Layout components
│   │   └── navigation/        # Navigation components
│   │
│   ├── contexts/              # React contexts
│   │   ├── UIContext.tsx      # UI state context
│   │   └── WalletContext.tsx  # Wallet connection context
│   │
│   ├── features/              # Feature modules
│   │   ├── stage/             # The Stage implementation
│   │   │   ├── components/    # Stage-specific components
│   │   │   ├── hooks/         # Stage-specific hooks
│   │   │   └── Stage.tsx      # Main Stage component
│   │   │
│   │   ├── performers/        # Performer profiles
│   │   ├── tipping/           # Tipping functionality
│   │   ├── bounties/          # Bounty marketplace
│   │   └── content/           # Content stream
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAnimatedTransition.ts
│   │   ├── usePerformer.ts
│   │   └── useStorage.ts      # FilCDN hook
│   │
│   ├── services/              # Core services
│   │   ├── api/               # API client
│   │   ├── storage/           # Storage services
│   │   │   ├── filcdn/        # FilCDN implementation
│   │   │   │   ├── filcdnService.ts
│   │   │   │   └── types.ts
│   │   │   └── storageService.ts  # Unified storage interface
│   │   │
│   │   ├── wallet/            # Wallet services
│   │   └── events/            # Event services
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── performer.ts
│   │   ├── content.ts
│   │   └── storage.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── animations.ts
│   │   ├── formatting.ts
│   │   └── validation.ts
│   │
│   ├── styles/                # Global styles and theme
│   │   ├── theme.ts           # Theme definitions
│   │   ├── animations.css     # Animation definitions
│   │   └── global.css         # Global styles
│   │
│   └── index.tsx              # Entry point
│
├── tests/                     # Test suite
└── ...                        # Config files
```

### Core Technical Components

#### 1. The Stage Implementation

The Stage is the central UI concept that adapts based on context. Its implementation includes:

```typescript
// StageContext.tsx
import React, { createContext, useReducer, useContext } from "react";

type StageState = {
  mode: "live" | "discovery" | "content";
  focusedPerformer: Performer | null;
  focusedContent: Content | null;
  interactionType: "none" | "tip" | "bounty" | "profile";
};

const StageContext = createContext<
  | {
      state: StageState;
      setMode: (mode: StageState["mode"]) => void;
      focusPerformer: (performer: Performer) => void;
      focusContent: (content: Content) => void;
      startInteraction: (type: StageState["interactionType"]) => void;
      resetStage: () => void;
    }
  | undefined
>(undefined);

export const StageProvider: React.FC = ({ children }) => {
  // Implementation...
};

export const useStage = () => {
  const context = useContext(StageContext);
  if (context === undefined) {
    throw new Error("useStage must be used within a StageProvider");
  }
  return context;
};
```

#### 2. Unified Storage Service

A clean abstraction over FilCDN that handles all storage needs:

```typescript
// storageService.ts
import { FilCDNService } from "./filcdn/filcdnService";

export interface StorageService {
  store: <T>(data: T, options?: StorageOptions) => Promise<StorageResult>;
  retrieve: <T>(id: string) => Promise<T | null>;
  getUrl: (id: string) => Promise<string | null>;
  isAvailable: () => boolean;
}

export class UnifiedStorageService implements StorageService {
  private filcdn: FilCDNService;
  private fallbackStorage: LocalStorageService;

  constructor(filcdn: FilCDNService, fallbackStorage: LocalStorageService) {
    this.filcdn = filcdn;
    this.fallbackStorage = fallbackStorage;
  }

  async store<T>(data: T, options?: StorageOptions): Promise<StorageResult> {
    try {
      return await this.filcdn.storeData(data);
    } catch (error) {
      console.warn("FilCDN storage failed, using fallback", error);
      return this.fallbackStorage.store(data, options);
    }
  }

  // Other methods...
}
```

#### 3. Animation System

A custom hook-based animation system that powers the fluid transitions:

```typescript
// useAnimatedTransition.ts
import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export function useAnimatedTransition(
  element: React.RefObject<HTMLElement>,
  state: any,
  options?: AnimationOptions
) {
  const prevState = useRef(state);

  useEffect(() => {
    if (!element.current) return;

    const timeline = gsap.timeline();

    // Create different animations based on state changes
    if (prevState.current !== state) {
      // Implementation...
    }

    prevState.current = state;
  }, [state, element]);
}
```

#### 4. Contextual Interaction System

Manages the dynamic interaction zone:

```typescript
// InteractionZone.tsx
import React from "react";
import { useStage } from "../../contexts/StageContext";
import { TippingInteraction } from "../tipping/TippingInteraction";
import { BountyInteraction } from "../bounties/BountyInteraction";
import { ProfileInteraction } from "../performers/ProfileInteraction";

export const InteractionZone: React.FC = () => {
  const { state } = useStage();

  switch (state.interactionType) {
    case "tip":
      return <TippingInteraction performer={state.focusedPerformer} />;
    case "bounty":
      return <BountyInteraction performer={state.focusedPerformer} />;
    case "profile":
      return <ProfileInteraction performer={state.focusedPerformer} />;
    default:
      return null;
  }
};
```

### State Management Strategy

Instead of a single global state, we'll implement a more modular approach:

1.  **App-Level State**: Minimal global state for authentication, theme, etc.
2.  **Feature-Level State**: Context providers for each major feature
3.  **Component-Level State**: useState and useReducer for component-specific state
4.  **Derived State**: Custom hooks that derive state from other sources

```typescript
// Example of feature-level state with React Context
export const ContentProvider: React.FC = ({ children }) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load content from storage
  const loadContents = async () => {
    setIsLoading(true);
    try {
      const result = await storageService.retrieveContentIndex();
      setContents(result);
      setError(null);
    } catch (error) {
      setError("Failed to load content");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // More methods...

  return (
    <ContentContext.Provider
      value={{ contents, isLoading, error, loadContents }}
    >
      {children}
    </ContentContext.Provider>
  );
};
```

### FilCDN Integration

We'll create a simplified FilCDN integration focused on developer experience:

1.  **Simplified API**: Abstract complex operations behind simple methods
2.  **Progressive Loading**: Use suspense and streaming for content loading
3.  **Content Addressing**: Implement a logical addressing scheme for content
4.  **Cache Management**: Implement efficient caching with background updates

```typescript
// useStorage.ts
export function useStorage() {
  const { isInitialized, error } = useFilCDNContext();
  const [isLoading, setIsLoading] = useState(false);

  const store = async <T>(data: T): Promise<string | null> => {
    setIsLoading(true);
    try {
      const result = await storageService.store(data);
      return result.id;
    } catch (error) {
      console.error("Storage error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const retrieve = async <T>(id: string): Promise<T | null> => {
    setIsLoading(true);
    try {
      return await storageService.retrieve<T>(id);
    } catch (error) {
      console.error("Retrieval error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    store,
    retrieve,
    isLoading,
    isReady: isInitialized && !error,
    error,
  };
}
```

### Key Features Implementation

#### 1. Performer Cards

```typescript
// PerformerCard.tsx
import React, { useRef } from "react";
import { useStage } from "../../contexts/StageContext";
import { useAnimatedTransition } from "../../hooks/useAnimatedTransition";

export const PerformerCard: React.FC<{ performer: Performer }> = ({
  performer,
}) => {
  const { state, focusPerformer, startInteraction } = useStage();
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate when this performer becomes focused or unfocused
  useAnimatedTransition(cardRef, {
    isFocused: state.focusedPerformer?.id === performer.id,
  });

  const handleSupport = () => {
    focusPerformer(performer);
    startInteraction("tip");
  };

  const handleBounty = () => {
    focusPerformer(performer);
    startInteraction("bounty");
  };

  return (
    <div
      ref={cardRef}
      className="performer-card"
      onClick={() => focusPerformer(performer)}
    >
      <img src={performer.profileImage} alt={performer.name} />
      <h3>{performer.name}</h3>
      <p>@{performer.username}</p>

      {performer.currentVenue && <p>Currently at: {performer.currentVenue}</p>}

      <div className="performer-actions">
        <button onClick={handleSupport}>Support</button>
        <button onClick={handleBounty}>Bounty</button>
      </div>
    </div>
  );
};
```

#### 2. Content Stream

```typescript
// ContentStream.tsx
import React, { useEffect, useRef } from "react";
import { useContent } from "../../hooks/useContent";
import { ContentCard } from "./ContentCard";

export const ContentStream: React.FC = () => {
  const { contents, loadContents, isLoading } = useContent();
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContents();
  }, []);

  // Implement horizontal scroll with momentum
  useEffect(() => {
    if (!streamRef.current) return;

    // Implementation with IntersectionObserver for lazy loading
    // and scroll event handling for momentum scrolling
  }, [streamRef.current]);

  return (
    <div className="content-stream" ref={streamRef}>
      {isLoading && <div className="loading-indicator">Loading...</div>}

      <div className="stream-track">
        {contents.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>
    </div>
  );
};
```

#### 3. Tipping Flow

```typescript
// TippingInteraction.tsx
import React, { useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { useTipping } from "../../hooks/useTipping";

export const TippingInteraction: React.FC<{ performer: Performer }> = ({
  performer,
}) => {
  const { isConnected, connect } = useWallet();
  const { sendTip, isProcessing } = useTipping();
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState("");

  const handleTip = async () => {
    if (!isConnected) {
      await connect();
    }

    await sendTip({
      performer: performer.id,
      amount,
      message,
    });
  };

  return (
    <div className="tipping-interaction">
      <h2>Support {performer.name}</h2>

      <div className="amount-options">
        {[5, 10, 25, 50].map((value) => (
          <button
            key={value}
            className={amount === value ? "selected" : ""}
            onClick={() => setAmount(value)}
          >
            ${value}
          </button>
        ))}
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Custom amount"
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a message (optional)"
      />

      <button
        className="send-tip-button"
        onClick={handleTip}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Send Tip"}
      </button>
    </div>
  );
};
```

### Progressive Web App Implementation

We'll implement a Progressive Web App approach for better performance and offline capabilities:

1.  **Service Worker**: Cache assets and API responses
2.  **App Shell Architecture**: Load UI shell first, then content
3.  **Background Sync**: Queue operations when offline
4.  **Push Notifications**: Notify users of bounty responses

### Optimizations

1.  **Code Splitting**: Split code by feature and route
2.  **Preloading**: Preload critical resources
3.  **Asset Optimization**: Optimize images and other assets
4.  **Runtime Performance**: Monitor and optimize render performance

## ⚙️ MegaVibe Service Layer Architecture

We've implemented a robust service layer for the MegaVibe application, providing a clean separation of concerns between UI components, business logic, and data access. The service layer follows these key principles:

1.  **Standardized Error Handling**: Consistent error responses across all services
2.  **Uniform Response Format**: All service calls return a standard ServiceResponse object
3.  **Domain-Specific Services**: Each major feature has its own dedicated service
4.  **State Management Integration**: Services integrate with Redux for state management
5.  **Smart Contract Abstraction**: Blockchain interactions are abstracted behind clean service interfaces

### Service Architecture

#### Core Services

1.  **BaseService**: Foundation service providing common functionality

    - Error handling and logging
    - Standard response formatting
    - Operation execution with automatic error recovery

2.  **TippingService**: Handles tipping functionality

    - Sending tips to speakers
    - Retrieving tip history
    - Managing tipping-related contract interactions

3.  **ReputationService**: Manages user reputation

    - Calculating multi-dimensional reputation scores
    - Managing reputation history
    - Implementing reputation-based benefits

4.  **EventService**: Manages event-related features

    - Event listing and filtering
    - GPS-based venue detection
    - Managing event registration

5.  **CrossChainService**: Manages cross-chain operations

    - Cross-chain bridging operations
    - USDC balance checking across chains
    - Transaction monitoring

6.  **APIService**: Standardizes API interactions

    - Request caching and retry logic
    - Request cancellation
    - Error handling and recovery

7.  **StorageService**: Manages data storage

    - Support for localStorage, sessionStorage, and IndexedDB
    - TTL-based expiration
    - Encryption support

8.  **ConfigService**: Manages application configuration
    - Environment-specific settings
    - Feature flags for controlled rollout
    - Remote configuration loading

#### State Management

1.  **StateService**: Centralized state management

    - Redux store configuration
    - State persistence
    - Action creators and reducers

2.  **TippingStateService**: State management for tipping
    - Integrates TippingService with Redux store
    - Manages tipping-related state
    - Provides tipping-specific actions and selectors

### Implementation Details

#### Error Handling

We've implemented a comprehensive error handling strategy with:

- **Error Categorization**: Specific error codes for different error types
- **Error Recovery**: Automatic retry for transient errors
- **Error Logging**: Consistent logging across services
- **User-Friendly Messages**: Translated error messages for display

#### Response Format

All service methods return a consistent response format:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}
```

This allows for consistent error handling and data processing throughout the application.

#### State Management Pattern

We've implemented a Redux-based state management pattern with:

1.  **Centralized Store**: A single Redux store for the entire application
2.  **Feature Slices**: Domain-specific state slices for different features
3.  **Thunk Actions**: Async actions for API calls and service interactions
4.  **Normalized State**: Entities are normalized in the store for efficient access
5.  **Persistence**: Configurable state persistence with localStorage

### Usage Examples

#### Using the TippingService

```typescript
// Sending a tip
const result = await TippingService.sendTip({
  recipientAddress: "0x1234...",
  amount: "10.0",
  message: "Great talk!",
  eventId: "event-123",
  speakerId: "speaker-456",
});

if (result.success) {
  console.log("Tip sent successfully:", result.data);
} else {
  console.error("Failed to send tip:", result.error.message);
}
```

#### Using the StateService with Redux

```typescript
// In a React component
import { useDispatch, useSelector } from "react-redux";
import TippingStateService from "../services/state/TippingStateService";

const MyComponent = () => {
  const dispatch = useDispatch();
  const tipHistory = useSelector((state) => state.tipping?.history || []);

  const handleSendTip = async () => {
    const result = await dispatch(
      TippingStateService.sendTip("0x1234...", 10.0, "event-123", "Great talk!")
    );

    if (result.success) {
      console.log("Tip sent successfully");
    } else {
      console.error("Failed to send tip:", result.error.message);
    }
  };

  return (
    <div>
      <button onClick={handleSendTip}>Send Tip</button>
      <div>
        <h3>Tip History</h3>
        <ul>
          {tipHistory.map((tipId) => (
            <li key={tipId}>{tipId}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```
