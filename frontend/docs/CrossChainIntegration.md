# Cross-Chain Integration Guide

This document provides guidelines on how to integrate the cross-chain functionality into the MegaVibe application.

## Overview

The cross-chain integration allows users to send tips and create bounties from any supported blockchain to our core contracts on Mantle Sepolia. This is made possible through the LI.FI bridge protocol, which enables seamless asset transfers across multiple blockchains.

## Services Architecture

The cross-chain functionality is implemented through several services and components:

1. **LI.FI SDK Integration** (`lifiService.ts`)
   - Handles the low-level interaction with the LI.FI protocol
   - Provides methods for discovering routes, executing transfers, and checking balances
   - Manages wallet provider integration

2. **Cross-Chain Service** (`crossChainService.ts`)
   - High-level service that coordinates between the LI.FI SDK and our contract services
   - Provides methods for cross-chain tipping and bounty creation
   - Tracks transaction status across bridges

3. **React Hook** (`useCrossChain.ts`)
   - Provides a convenient React hook interface for components
   - Manages state for chains, balances, and transaction status
   - Handles user interactions and error management

4. **UI Components**
   - `CrossChainTippingModal`: Enhanced tipping modal with chain selection
   - Extended `TransactionPreview`: Shows cross-chain fees and status

## Integration Steps

### 1. Import and use the hook

```tsx
import { useCrossChain } from '../../hooks/useCrossChain';

function YourComponent() {
  const {
    supportedChains,
    selectedChain,
    isCrossChain,
    usdcBalances,
    txStatus,
    isLoading,
    error,
    setSelectedChain,
    sendCrossChainTip
  } = useCrossChain();
  
  // Component logic here
}
```

### 2. Replace standard tipping with cross-chain tipping

Instead of using the standard tipping modal, use the new cross-chain tipping modal:

```tsx
import { CrossChainTippingModal } from '../components/LiveMusic/CrossChainTippingModal';

function EventPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div>
      {/* Other components */}
      
      <button onClick={() => setIsModalOpen(true)}>
        Tip Speaker
      </button>
      
      <CrossChainTippingModal
        speaker={selectedSpeaker}
        event={currentEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => handleSuccess()}
      />
    </div>
  );
}
```

### 3. Sending Cross-Chain Tips Programmatically

If you need to send tips programmatically without using the UI components:

```tsx
import { crossChainService } from '../../services/crossChainService';

async function sendTip() {
  try {
    // Parameters
    const fromChainId = 137; // Polygon
    const recipientAddress = '0x123...';
    const amountUSD = 10;
    const message = 'Great talk!';
    const eventId = 'event-123';
    const speakerId = 'speaker-456';
    
    // Status callback
    const statusCallback = (status) => {
      console.log('Transaction status:', status);
      // Update UI based on status
    };
    
    // Send the tip
    const result = await crossChainService.sendCrossChainTip(
      fromChainId,
      recipientAddress,
      amountUSD,
      message,
      eventId,
      speakerId,
      statusCallback
    );
    
    if (result.success) {
      console.log('Tip sent successfully:', result.txHash);
    } else {
      console.error('Failed to send tip:', result.error);
    }
  } catch (error) {
    console.error('Error sending tip:', error);
  }
}
```

## Supported Chains

The cross-chain functionality supports the following chains:

- Ethereum Mainnet (Chain ID: 1)
- Polygon (Chain ID: 137)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Base (Chain ID: 8453)
- Mantle (Chain ID: 5000)
- Mantle Sepolia (Chain ID: 5003) - Target chain

## User Experience Considerations

When implementing cross-chain functionality:

1. **Clear Indication**: Always clearly indicate to users when they are performing a cross-chain transaction.
2. **Fee Transparency**: Show bridge fees and gas estimates upfront.
3. **Time Expectations**: Set proper expectations about settlement time (5-15 minutes for cross-chain).
4. **Status Updates**: Provide real-time status updates during the bridging process.
5. **Fallback Options**: Offer native chain options for users who prefer not to use bridges.

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure users have sufficient USDC on the source chain.
2. **No Routes Available**: If no routes are found, the source and target chains might not have supported bridges.
3. **Transaction Failure**: Bridge transactions can fail due to liquidity issues or network congestion.
4. **Stuck Transactions**: If a transaction appears stuck, check the transaction status on the source chain explorer.

### Debugging Tools

Use the following methods to debug cross-chain issues:

```ts
// Check USDC balances across chains
const balances = await crossChainService.getUSDCBalances(userAddress);
console.log('USDC balances:', balances);

// Check available routes
const routes = await lifiService.getRoutes(
  fromChainId,
  toChainId,
  fromAddress,
  toAddress,
  amount
);
console.log('Available routes:', routes);
```

## Security Considerations

1. **Bridge Security**: The security of cross-chain transfers depends on the LI.FI protocol and its integrated bridges.
2. **Slippage Protection**: Set appropriate slippage parameters to protect users from price movements.
3. **Transaction Monitoring**: Implement monitoring for cross-chain transactions to detect and resolve issues.

## Future Improvements

1. **More Chains**: Add support for additional source chains.
2. **Custom Tokens**: Allow users to pay with tokens other than USDC.
3. **Improved Status Tracking**: Enhance the tracking of cross-chain transactions.
4. **Recovery Mechanism**: Implement a recovery mechanism for failed cross-chain transactions.

## References

- [LI.FI Documentation](https://docs.li.fi/)
- [USDC Token Addresses](https://developers.circle.com/developer/docs/usdc-on-ethereum)
- [Mantle Network Documentation](https://docs.mantle.xyz/)