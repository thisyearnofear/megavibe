# FilCDN Integration for MegaVibe

This document outlines the FilCDN integration in the MegaVibe application, which provides decentralized storage capabilities using the Filecoin network.

## Overview

FilCDN (Filecoin Content Delivery Network) is a decentralized storage solution built on the Filecoin network, providing permanent storage with CDN-like performance. MegaVibe uses FilCDN to store and retrieve event data, speaker profiles, and other content in a decentralized manner.

## Architecture

The FilCDN integration consists of several key components:

1. **FilCDNService**: Core service for interacting with the Filecoin network via the Synapse SDK
2. **DecentralizedApiService**: Higher-level service that uses FilCDN for storing and retrieving application data
3. **FilCDNContext**: React context provider that makes FilCDN functionality available throughout the application
4. **useFilCDNStorage**: Custom hook for convenient FilCDN operations in React components
5. **Storage Services**: Specialized services for different data types (events, speakers, tips)

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

## Core Components

### FilCDNService

The `FilCDNService` (in `frontend/src/services/filcdnService.ts`) is the primary interface for interacting with the Filecoin network. It handles:

- Initialization of the Synapse SDK
- Storage of data on FilCDN
- Retrieval of data from FilCDN
- CDN URL generation
- Error handling and statistics

### FilCDNContext

The `FilCDNContext` (in `frontend/src/contexts/FilCDNContext.tsx`) is a React context provider that:

- Initializes the FilCDN service
- Provides FilCDN functionality to all components
- Tracks initialization and error states
- Exposes storage and retrieval methods
- Periodically updates FilCDN statistics

### useFilCDNStorage Hook

The `useFilCDNStorage` hook (in `frontend/src/hooks/useFilCDNStorage.ts`) provides a convenient interface for React components to use FilCDN, including:

- Simplified storage and retrieval methods
- Loading state management
- Error handling
- Automatic retry capabilities
- CDN URL generation

### DecentralizedApiService

The `DecentralizedApiService` (in `frontend/src/services/decentralizedApiService.ts`) is a higher-level service that:

- Replaces traditional API calls with decentralized storage operations
- Provides specialized methods for different data types (events, speakers, tips)
- Handles fallback mechanisms for reliability
- Maintains cached indexes for efficient data access

## Configuration

### Environment Variables

FilCDN integration requires several environment variables:

```
# FilCDN Configuration
VITE_FILCDN_ENABLED=true
VITE_USE_REAL_FILCDN=true
VITE_FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
VITE_FILCDN_MIN_REPUTATION=100
VITE_FILCDN_PRIVATE_KEY=your_private_key_here
```

### Private Key Management

For security reasons, private keys should not be stored in frontend code. In production:

1. Use a backend service to generate and manage keys
2. Use wallet-based authentication for operations
3. Implement a signing service for FilCDN operations

### Required Blockchain Setup

Before using FilCDN, ensure:

1. USDFC tokens are deposited to the wallet
2. The Pandora service is approved for automated payments
3. The wallet has sufficient allowance for storage operations

## Usage Examples

### Basic Storage and Retrieval

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

### Direct CDN URL Access

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

## Troubleshooting

### Common Issues

1. **Operator Not Approved Error**

   - **Problem**: This occurs when the wallet hasn't approved the Pandora service for FilCDN operations.
   - **Solution**: Call `SynapseFilCDNService.setupPayments()` to approve the service with sufficient allowance.

2. **Insufficient Allowance**

   - **Problem**: The wallet doesn't have enough USDFC allowance for storage operations.
   - **Solution**: Increase allowance through `SynapseFilCDNService.setupPayments()` with a higher amount.

3. **Incompatible RPC Endpoint**

   - **Problem**: The RPC endpoint doesn't support required methods (`eth_signTypedData_v4`).
   - **Solution**: Use a compatible endpoint like `https://api.calibration.node.glif.io/rpc/v1`.

4. **BigInt Serialization Issues**
   - **Problem**: JSON.stringify() fails with BigInt values from blockchain responses.
   - **Solution**: Use custom serialization with BigInt handling or convert BigInt to string before serialization.

### Diagnostic Tools

1. **FilCDN Stats**

   ```typescript
   const { stats } = useFilCDN();
   console.log("FilCDN Status:", stats);
   ```

2. **Connection Test**
   ```typescript
   const { filcdn } = useFilCDN();
   const isCompatible = await filcdn?.testRPCCompatibility();
   console.log("RPC Compatible:", isCompatible);
   ```

## Performance Considerations

1. **CDN Caching**

   - First-time retrievals are slower as data is loaded from Filecoin
   - Subsequent retrievals are much faster due to CDN caching
   - Test results show ~80% improvement in download speeds after initial load

2. **Data Size Limits**

   - Maximum file size is 254 MiB per upload
   - Large datasets should be split into smaller chunks

3. **Local Caching**
   - All services implement local storage caching for fallback and performance
   - Critical data is always available even without network connectivity

## Future Improvements

1. **WebRTC Integration**: Enable peer-to-peer data sharing for real-time updates
2. **Content Addressing**: Implement IPLD-based content addressing for better data organization
3. **Wallet Integration**: Deeper integration with user wallets for permissioned access
4. **Multi-network Support**: Expand beyond Filecoin Calibration to other networks

## References

- [Filecoin Documentation](https://docs.filecoin.io/)
- [Synapse SDK Documentation](https://docs.filecoin.io/developers/synapse-sdk)
- [USDFC Token Contract](https://calibration.filfox.info/en/address/0x35D12F85368)
- [FilCDN Documentation](https://filcdn.io/docs)
- [Pandora Service Documentation](https://docs.filecoin.io/developers/pandora-service)
