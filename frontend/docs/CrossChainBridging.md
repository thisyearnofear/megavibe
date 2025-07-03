# Cross-Chain Bridging with LI.FI in MegaVibe

This document provides a comprehensive guide to the cross-chain bridging implementation in MegaVibe using the LI.FI SDK.

## Overview

The cross-chain bridging functionality allows users to transfer USDC tokens between different blockchain networks, enabling a seamless experience for tipping and bounties across multiple chains. Our implementation leverages the LI.FI SDK, which provides access to multiple bridges and DEXs for optimized cross-chain transfers.

## Implementation Files

The implementation consists of several key files:

1. **LifiService (`src/services/lifiService.ts`)**
   - Core service that interfaces with the LI.FI SDK
   - Provides methods for finding routes, executing transfers, and querying balances
   - Implements robust error handling and status tracking

2. **LifiConfig (`src/config/lifiConfig.ts`)**
   - Configuration settings for the LI.FI integration
   - Contains USDC token addresses for supported chains
   - Defines platform integration settings

3. **UI Components (`src/components/CrossChain/`)**
   - `ChainSelector.tsx`: Reusable component for selecting blockchain networks
   - `CrossChainTransferExample.tsx`: Example component demonstrating the full flow
   - `crossChainTransfer.css`: Styling for cross-chain components

## SDK Configuration

### Basic Setup

Our implementation initializes the LI.FI SDK with proper configuration:

```typescript
// In lifiConfig.ts
import { createConfig } from '@lifi/sdk';

createConfig({
  integrator: 'MegaVibe',
  // Optional API key for higher rate limits
  apiKey: process.env.REACT_APP_LIFI_API_KEY,
  // Custom RPCs for better reliability
  rpcUrls: {
    1: [process.env.REACT_APP_ETHEREUM_RPC],
    137: [process.env.REACT_APP_POLYGON_RPC],
    // Additional chains...
  }
});
```

### Provider Configuration

For wallet interactions, we properly configure the EVM provider:

```typescript
// In lifiService.ts
import { EVM } from '@lifi/sdk';
import { getWalletClient, switchChain } from 'wagmi/actions';
import { config } from 'wagmi';

// Set up EVM provider
const evmProvider = EVM({
  getWalletClient: () => getWalletClient(config),
  switchChain: async (chainId) => {
    await switchChain(config, { chainId });
    return getWalletClient(config, { chainId });
  }
});

// Update SDK configuration with provider
config.setProviders([evmProvider]);
```

## Core Functionality

### Route Discovery

Finding the best route for cross-chain transfers:

```typescript
/**
 * Gets available routes for a cross-chain USDC transfer
 * @param fromChainId Source chain ID
 * @param toChainId Destination chain ID
 * @param senderAddress User's wallet address
 * @param recipientAddress Recipient's wallet address
 * @param amount Amount in smallest unit (e.g., "1000000" for 1 USDC)
 * @returns Array of possible routes
 */
async getRoutes(
  fromChainId: number,
  toChainId: number,
  senderAddress: string,
  recipientAddress: string,
  amount: string
): Promise<Route[]> {
  try {
    const fromToken = await this.getUSDCToken(fromChainId);
    const toToken = await this.getUSDCToken(toChainId);
    
    if (!fromToken || !toToken) {
      throw new Error(`USDC not supported on chain ${!fromToken ? fromChainId : toChainId}`);
    }

    const routesRequest = {
      fromChainId,
      toChainId,
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      fromAmount: amount,
      fromAddress: senderAddress,
      toAddress: recipientAddress,
      options: {
        slippage: 0.005, // 0.5%
        order: 'CHEAPEST',
      }
    };

    const routesResponse = await getRoutes(routesRequest);
    return routesResponse.routes;
  } catch (error) {
    // Proper error handling instead of suppressing
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error getting routes: ${errorMessage}`, error);
    throw new Error(`Failed to get routes: ${errorMessage}`);
  }
}
```

### Executing Transfers

Executing a cross-chain transfer with proper error handling and status tracking:

```typescript
/**
 * Executes a cross-chain transfer using the provided route
 * @param route Route object from getRoutes
 * @returns Transaction hash
 */
async executeRoute(route: Route): Promise<string> {
  try {
    if (!route) {
      throw new Error('No route provided');
    }

    // Execute the route with status updates
    const executedRoute = await executeRoute(route, {
      updateRouteHook: (updatedRoute) => {
        // Update UI with status changes
        this.routeExecutionStore.updateRoute(updatedRoute);
      },
      acceptExchangeRateUpdateHook: async (toToken, oldAmount, newAmount) => {
        // Handle exchange rate updates
        const oldValue = this.formatAmount(oldAmount, toToken.decimals);
        const newValue = this.formatAmount(newAmount, toToken.decimals);
        
        // Determine if the change is acceptable (e.g., less than 1% decrease)
        const isAcceptable = BigInt(newAmount) >= BigInt(oldAmount) * BigInt(99) / BigInt(100);
        
        if (!isAcceptable) {
          // Notify user about significant rate change
          console.warn(`Exchange rate changed significantly: ${oldValue} → ${newValue}`);
        }
        
        return isAcceptable; // Automatically accept small changes
      }
    });
    
    // Get the latest transaction hash from the executed route
    const txHash = this.getLatestTxHash(executedRoute);
    return txHash;
  } catch (error) {
    // Proper error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error executing route: ${errorMessage}`, error);
    throw new Error(`Failed to execute transfer: ${errorMessage}`);
  }
}

/**
 * Extracts the latest transaction hash from an executed route
 */
private getLatestTxHash(route: RouteExtended): string {
  for (const step of route.steps) {
    if (step.execution?.process) {
      for (const process of step.execution.process) {
        if (process.txHash) {
          return process.txHash;
        }
      }
    }
  }
  throw new Error('No transaction hash found in executed route');
}
```

### Status Tracking

Monitoring the status of cross-chain transfers:

```typescript
/**
 * Checks the status of a cross-chain transfer
 * @param txHash Transaction hash
 * @param fromChainId Source chain ID
 * @param toChainId Destination chain ID
 * @returns Status information
 */
async getTransferStatus(
  txHash: string,
  fromChainId: number,
  toChainId: number
): Promise<StatusResponse> {
  try {
    const status = await getStatus({
      txHash,
      fromChain: fromChainId,
      toChain: toChainId,
    });
    
    return status;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error getting transfer status: ${errorMessage}`, error);
    throw new Error(`Failed to get transfer status: ${errorMessage}`);
  }
}
```

## Error Handling Strategy

Our implementation follows these error handling principles:

1. **No Error Suppression**: We don't use `@ts-nocheck` or ignore errors. Instead, we properly type all SDK interactions and handle any type mismatches.

2. **Structured Error Handling**: We use try/catch blocks with specific error types and provide meaningful error messages.

3. **Error Propagation**: Errors are properly logged and then propagated to the UI for user feedback.

4. **Graceful Degradation**: When non-critical features fail, the application continues to function.

Example of proper error handling:

```typescript
// Before (problematic approach with @ts-nocheck):
// @ts-nocheck
try {
  const result = await someSDKFunction();
  return result;
} catch {
  // Silently ignoring error
  return null;
}

// After (proper error handling):
try {
  const result = await someSDKFunction();
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Operation failed: ${errorMessage}`, error);
  
  // Either throw a more specific error
  throw new Error(`Failed to complete operation: ${errorMessage}`);
  
  // Or return a structured error response
  return {
    success: false,
    error: errorMessage,
    data: null
  };
}
```

## Usage Examples

### Basic Usage

```typescript
import { lifiService } from '../services/lifiService';

// Get supported chains
const supportedChains = await lifiService.getSupportedChains();

// Check if bridging is supported between chains
const isSupported = await lifiService.isBridgingSupported(1, 137); // Ethereum to Polygon

// Get USDC token info for a chain
const usdcToken = await lifiService.getUSDCToken(137); // Polygon

// Get user's USDC balances across chains
const balances = await lifiService.getUSDCBalances('0x...');

// Format and parse amounts
const formatted = lifiService.formatAmount('1000000', 6); // "1.0"
const parsed = lifiService.parseAmount('1.5', 6); // "1500000"

// Get routes for a cross-chain transfer
const routes = await lifiService.getRoutes(
  1,                // from Ethereum
  137,              // to Polygon
  '0x...',          // sender address
  '0x...',          // recipient address
  '1000000'         // amount (1 USDC with 6 decimals)
);

// Execute a cross-chain transfer
const txHash = await lifiService.executeRoute(routes[0]);

// Check transfer status
const status = await lifiService.getTransferStatus(txHash, 1, 137);
```

### UI Components

The `ChainSelector` component can be used in various parts of the application:

```tsx
import { ChainSelector } from '../components/CrossChain';

function MyComponent() {
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  
  return (
    <ChainSelector
      label="Select Chain:"
      value={selectedChain}
      onChange={setSelectedChain}
      showTestnets={false} // Only show mainnets for production
    />
  );
}
```

The `CrossChainTransferExample` component provides a complete implementation example that can be referenced or used directly.

## Testing Recommendations

Following LI.FI's guidance, we recommend testing on mainnets rather than testnets:

1. Use chains with low gas fees (Optimism, Arbitrum, Polygon) for cost-effective testing
2. Start with small amounts (e.g., 1 USDC) to validate the flow
3. Test the full end-to-end flow including:
   - Chain selection
   - Balance checking
   - Route discovery
   - Transfer execution
   - Status monitoring

### Testing Environment Variables

For testing, use these environment variables to control behavior:

```
REACT_APP_LIFI_TEST_MODE=true
REACT_APP_MAX_TEST_AMOUNT=5000000 // 5 USDC maximum for test transfers
```

## Troubleshooting

Common issues and solutions:

- **"No routes found"**: This usually means there's no liquidity for the requested transfer amount or the bridging path isn't supported. Try a smaller amount or different chains.

- **Transaction failures**: Check that the user has enough native tokens (ETH, MATIC, etc.) to cover gas costs on both chains. Our implementation estimates gas costs but market conditions can change rapidly.

- **Bridge delays**: Cross-chain transfers can take several minutes to complete. Use the `getStatus` method to check the status of a transfer.

- **Type errors with SDK**: If you encounter type compatibility issues with the SDK, use proper type assertions or create interface adaptors rather than using `@ts-nocheck`.

## Future Improvements

Potential enhancements for the cross-chain bridging functionality:

1. Add support for additional tokens beyond USDC
2. Implement a transaction history feature to track past transfers
3. Add gas estimation in user's preferred currency
4. Create a more sophisticated route selection UI with detailed comparisons
5. Integrate with the notification system to alert users of transfer status changes
6. Implement gasless transactions for a better UX
7. Add support for smart account wallets (e.g., Safe, Sequence)

## References

- [LI.FI SDK Documentation](https://docs.li.fi/sdk)
- [LI.FI API Documentation](https://docs.li.fi/products/li.fi-api)
- [EVM Provider Configuration](https://docs.li.fi/sdk/configure-sdk-providers)
- [Executing Routes & Quotes](https://docs.li.fi/sdk/execute-routes-quotes)