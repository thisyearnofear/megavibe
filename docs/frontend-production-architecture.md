# MegaVibe Frontend Production Architecture

This document outlines the technical architecture for implementing "The Stage" UI concept in the new `/frontend-production` directory.

## Core Principles

1. **Component Composition**: Build complex UIs from simple, focused components
2. **State Isolation**: Keep state as close as possible to where it's used
3. **Unidirectional Data Flow**: Data flows down, events flow up
4. **Progressive Enhancement**: Core functionality works with minimal dependencies
5. **Performance First**: Optimize for initial load and interaction responsiveness

## Directory Structure

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

## Core Technical Components

### 1. The Stage Implementation

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

### 2. Unified Storage Service

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

### 3. Animation System

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

### 4. Contextual Interaction System

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

## State Management Strategy

Instead of a single global state, we'll implement a more modular approach:

1. **App-Level State**: Minimal global state for authentication, theme, etc.
2. **Feature-Level State**: Context providers for each major feature
3. **Component-Level State**: useState and useReducer for component-specific state
4. **Derived State**: Custom hooks that derive state from other sources

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

## FilCDN Integration

We'll create a simplified FilCDN integration focused on developer experience:

1. **Simplified API**: Abstract complex operations behind simple methods
2. **Progressive Loading**: Use suspense and streaming for content loading
3. **Content Addressing**: Implement a logical addressing scheme for content
4. **Cache Management**: Implement efficient caching with background updates

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

## Key Features Implementation

### 1. Performer Cards

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

### 2. Content Stream

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

### 3. Tipping Flow

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

## Progressive Web App Implementation

We'll implement a Progressive Web App approach for better performance and offline capabilities:

1. **Service Worker**: Cache assets and API responses
2. **App Shell Architecture**: Load UI shell first, then content
3. **Background Sync**: Queue operations when offline
4. **Push Notifications**: Notify users of bounty responses

## Optimizations

1. **Code Splitting**: Split code by feature and route
2. **Preloading**: Preload critical resources
3. **Asset Optimization**: Optimize images and other assets
4. **Runtime Performance**: Monitor and optimize render performance

## Next Steps

1. Create initial project structure
2. Implement core components for The Stage
3. Develop storage service with FilCDN integration
4. Build out performer and content stream components
5. Implement tipping and bounty functionality
6. Add animations and transitions
7. Optimize performance
