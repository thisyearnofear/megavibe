# Wallet Integration Guide

**Dynamic.xyz + Mantle Network Integration for MegaVibe**

This guide documents the wallet integration architecture and provides best practices for maintaining consistent wallet state across the application.

## 🎯 Overview

MegaVibe uses [Dynamic.xyz](https://dynamic.xyz) for wallet connection management with Mantle Sepolia testnet. The integration is designed to be simple, consistent, and developer-friendly while handling the complexity of multi-wallet support and network switching.

## 🏗️ Architecture

### Provider Hierarchy

```
main.tsx
└── AppProviders.tsx
    ├── DynamicContextProvider (Dynamic.xyz wallet management)
    ├── WagmiProvider (blockchain interactions)
    ├── QueryClientProvider (data fetching)
    └── WalletProvider (centralized state management)
        ├── App.tsx (/)
        └── TipPage.tsx (/tip)
        └── [any future routes]
```

### Key Components

1. **AppProviders.tsx** - Wraps all routes with necessary providers
2. **WalletContext.tsx** - Centralized wallet state management
3. **WalletStatusCard.tsx** - Reusable wallet UI component
4. **environment.ts** - Configuration management

## 🚀 Quick Start

### Using Wallet in Components

```typescript
import { useWallet } from '../contexts/WalletContext';

function MyComponent() {
  const {
    // Connection state
    isConnected,
    isConnecting,
    isCorrectNetwork,
    
    // Wallet info
    address,
    balance,
    chainId,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToMantleSepolia,
    
    // Helpers
    isWalletReady,
    formatBalance,
    formatAddress
  } = useWallet();

  if (!isConnected) {
    return <button onClick={connectWallet}>Connect Wallet</button>;
  }

  if (!isCorrectNetwork) {
    return (
      <button onClick={switchToMantleSepolia}>
        Switch to Mantle Sepolia
      </button>
    );
  }

  return (
    <div>
      <p>Connected: {formatAddress(address)}</p>
      <p>Balance: {formatBalance(balance)} MNT</p>
    </div>
  );
}
```

### Adding Wallet UI Component

```typescript
import { WalletStatusCard } from '../components/WalletConnection/WalletStatusCard';

function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      
      {/* Full wallet status with balance and network info */}
      <WalletStatusCard 
        showBalance={true}
        showNetworkInfo={true}
        compact={false}
      />
      
      {/* Compact version for headers */}
      <WalletStatusCard compact={true} />
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Dynamic.xyz Configuration
VITE_DYNAMIC_ENVIRONMENT_ID=cd08ffe6-e5d5-49d4-8cb3-f9419a7f5e4d

# Mantle Network Configuration
VITE_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
VITE_MANTLE_CHAIN_ID=5003
VITE_MANTLE_NETWORK_NAME=Mantle Sepolia

# Smart Contract Configuration
VITE_TIPPING_CONTRACT_ADDRESS=0xa226c82f1b6983aBb7287Cd4d83C2aEC802A183F
VITE_FEE_RECIPIENT_ADDRESS=0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901
VITE_PLATFORM_FEE_PERCENTAGE=5

# Development
VITE_DEBUG_MODE=true
```

### Network Configuration

Mantle Sepolia is configured automatically. Users will be prompted to add the network if they don't have it:

- **Network Name**: Mantle Sepolia
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **Chain ID**: 5003
- **Currency Symbol**: MNT
- **Block Explorer**: https://explorer.sepolia.mantle.xyz

## 📝 API Reference

### useWallet Hook

#### State Properties

```typescript
interface WalletState {
  // Connection state
  isConnected: boolean;          // Is wallet connected
  isConnecting: boolean;         // Connection in progress
  isInitialized: boolean;        // Context initialized
  
  // Wallet information
  address: string | null;        // Wallet address
  balance: string;               // MNT balance
  chainId: number | null;        // Current chain ID
  isCorrectNetwork: boolean;     // On Mantle Sepolia (5003)
  
  // Error handling
  error: string | null;          // Current error message
  
  // Network information
  networkInfo: NetworkInfo | null;
}
```

#### Action Methods

```typescript
interface WalletActions {
  // Connection actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToMantleSepolia: () => Promise<boolean>;
  
  // Utility actions
  refreshBalance: () => Promise<void>;
  refreshWalletState: () => Promise<void>;
  clearError: () => void;
  
  // Helper functions
  formatBalance: (balance: string) => string;
  formatAddress: (address: string) => string;
  isWalletReady: () => boolean;
}
```

#### Helper Methods

```typescript
// Check if wallet is ready for transactions
const ready = isWalletReady(); // isConnected && isCorrectNetwork && !isConnecting

// Format address for display
const shortAddress = formatAddress('0x1234...'); // "0x1234...5678"

// Format balance for display
const displayBalance = formatBalance('1.234567'); // "1.235"
```

### WalletStatusCard Props

```typescript
interface WalletStatusCardProps {
  showBalance?: boolean;      // Show balance (default: true)
  showNetworkInfo?: boolean;  // Show network status (default: true)
  className?: string;         // Additional CSS classes
  compact?: boolean;          // Compact layout (default: false)
}
```

## 🔄 State Management

### Automatic Features

- **Auto-reconnection**: Wallet state persists across page reloads
- **Network monitoring**: Automatically detects network changes
- **Balance updates**: Refreshes balance every 30 seconds when connected
- **Error recovery**: Clears errors automatically on successful operations

### Manual State Management

```typescript
const { refreshWalletState, refreshBalance, clearError } = useWallet();

// Refresh all wallet information
await refreshWalletState();

// Refresh only balance
await refreshBalance();

// Clear current error
clearError();
```

## 🚨 Error Handling

### Common Error Scenarios

1. **User rejects connection**
   ```typescript
   const { error, connectWallet, clearError } = useWallet();
   
   const handleConnect = async () => {
     try {
       await connectWallet();
     } catch (err) {
       // Error is automatically set in context
       console.log('Connection failed:', error);
     }
   };
   ```

2. **Wrong network**
   ```typescript
   const { isCorrectNetwork, switchToMantleSepolia } = useWallet();
   
   if (!isCorrectNetwork) {
     await switchToMantleSepolia();
   }
   ```

3. **Transaction failures**
   ```typescript
   const { isWalletReady } = useWallet();
   
   const sendTransaction = async () => {
     if (!isWalletReady()) {
       throw new Error('Wallet not ready for transactions');
     }
     
     // Proceed with transaction
   };
   ```

### Error Display

```typescript
const { error, clearError } = useWallet();

return (
  <div>
    {error && (
      <div className="error-banner">
        {error}
        <button onClick={clearError}>×</button>
      </div>
    )}
  </div>
);
```

## 🧪 Testing & Debugging

### Debug Mode

Enable debug mode to see detailed logging:

```bash
VITE_DEBUG_MODE=true
```

This will log:
- Environment configuration on startup
- Wallet state changes
- Network switching attempts
- Balance updates
- Error details

### Wallet Diagnostics

The app includes built-in diagnostics that run automatically in debug mode:

```typescript
import { runWalletDiagnostics } from '../utils/diagnostics';

// Run diagnostics manually
const results = await runWalletDiagnostics();
console.log('Diagnostic results:', results);
```

Diagnostics check:
- Environment variables
- Network connectivity
- Contract configuration
- Wallet provider availability
- Browser compatibility

## 🚧 Best Practices

### Do's

✅ **Always use the centralized context**
```typescript
// ✅ Good
const { isConnected } = useWallet();

// ❌ Bad - don't create separate wallet state
const [walletConnected, setWalletConnected] = useState(false);
```

✅ **Check wallet readiness before transactions**
```typescript
// ✅ Good
if (isWalletReady()) {
  await sendTransaction();
}

// ❌ Bad - incomplete check
if (isConnected) {
  await sendTransaction(); // might fail if wrong network
}
```

✅ **Handle errors gracefully**
```typescript
// ✅ Good
const { error, clearError } = useWallet();

useEffect(() => {
  if (error) {
    // Show error to user
    toast.error(error);
    // Clear after showing
    setTimeout(clearError, 5000);
  }
}, [error, clearError]);
```

### Don'ts

❌ **Don't bypass the context system**
```typescript
// ❌ Bad - don't use Dynamic directly in components
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
const { primaryWallet } = useDynamicContext();

// ✅ Good - use our context
const { address, isConnected } = useWallet();
```

❌ **Don't duplicate wallet logic**
```typescript
// ❌ Bad - duplicating connection logic
const connectMyWallet = async () => {
  // custom connection logic
};

// ✅ Good - use context methods
const { connectWallet } = useWallet();
```

❌ **Don't forget to handle loading states**
```typescript
// ❌ Bad - no loading handling
if (isConnected) {
  return <TipButton />;
}

// ✅ Good - handle all states
if (isConnecting) return <LoadingSpinner />;
if (!isConnected) return <ConnectButton />;
if (!isCorrectNetwork) return <NetworkSwitchButton />;
return <TipButton />;
```

## 🔄 Migration Guide

### From Manual Wallet Management

If you have existing components using manual wallet management:

**Before:**
```typescript
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

function MyComponent() {
  const { primaryWallet } = useDynamicContext();
  const [balance, setBalance] = useState('0');
  
  // Manual balance fetching...
}
```

**After:**
```typescript
import { useWallet } from '../contexts/WalletContext';

function MyComponent() {
  const { address, balance, isConnected } = useWallet();
  
  // Balance is automatically managed
}
```

### Adding Wallet to New Routes

When creating new routes that need wallet access:

1. **Route is automatically wrapped** - AppProviders wraps all routes
2. **Just use the hook** - `useWallet()` works immediately
3. **Add UI if needed** - Use `WalletStatusCard` for consistent UI

```typescript
// New route component
import { useWallet } from '../contexts/WalletContext';
import { WalletStatusCard } from '../components/WalletConnection/WalletStatusCard';

export function NewPage() {
  const { isConnected } = useWallet();
  
  return (
    <div>
      <h1>New Page</h1>
      <WalletStatusCard />
      {/* Rest of your component */}
    </div>
  );
}
```

## 🔗 Related Documentation

- [Dynamic.xyz Documentation](https://docs.dynamic.xyz/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Mantle Network Documentation](https://docs.mantle.xyz/)
- [Environment Configuration](../src/config/environment.ts)

## 🆘 Troubleshooting

### Common Issues

**Issue: "useWallet must be used within a WalletProvider"**
- **Solution**: Ensure your component is inside the AppProviders wrapper
- **Check**: Verify main.tsx wraps routes with AppProviders

**Issue: Wallet not switching to Mantle Sepolia**
- **Solution**: Check environment variables are set correctly
- **Debug**: Enable debug mode to see network configuration

**Issue: Balance not updating**
- **Solution**: Call `refreshBalance()` manually if needed
- **Note**: Balance auto-refreshes every 30 seconds when connected

**Issue: Connection failing**
- **Solution**: Check browser console for specific error
- **Common**: User needs to install wallet extension

For more issues, run the diagnostic tool with `VITE_DEBUG_MODE=true`.