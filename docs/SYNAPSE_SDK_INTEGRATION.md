# Synapse SDK Integration for MegaVibe

## Overview

MegaVibe now integrates with the **Filecoin Synapse SDK** (`@filoz/synapse-sdk`) to provide decentralized storage capabilities through FilCDN. This integration enables secure, cost-effective storage of user-generated content, performer media, and platform data on the Filecoin network.

## What is Synapse SDK?

The Synapse SDK is a JavaScript/TypeScript interface for interacting with Filecoin storage services. It provides:

- **Decentralized Storage**: Store data on the Filecoin network with cryptographic guarantees
- **CDN Integration**: Fast content delivery through integrated CDN services
- **Cost-Effective**: Uses USDFC tokens for predictable storage costs
- **Production Ready**: Actively maintained with TypeScript support
- **MetaMask Compatible**: Works seamlessly with existing Web3 wallet infrastructure

## Integration Architecture

### Environment Configuration

The integration uses environment-based SDK loading:

- **Development/Testing**: Uses mock SDK for safe development
- **Production**: Loads real Synapse SDK for actual Filecoin storage
- **Fallback**: Graceful degradation with proper error handling

### Key Components

1. **synapseSDK.ts**: Environment-aware SDK loader with type safety
2. **realFilcdnService.ts**: Production FilCDN service implementation
3. **mockSynapseSDK.ts**: Development/testing mock implementation

### Network Configuration

Following Filecoin documentation best practices:

- **Mainnet**: Chain ID 314, production storage
- **Calibration Testnet**: Chain ID 314159, development/testing
- **Local Testnet**: Chain ID 31415926, local development

## Environment Variables

```bash
# FilCDN Configuration
FILECOIN_PRIVATE_KEY=your_filecoin_private_key
NEXT_PUBLIC_FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
NEXT_PUBLIC_FILCDN_ENABLED=true
NEXT_PUBLIC_USE_REAL_FILCDN=true
NEXT_PUBLIC_FILCDN_MIN_REPUTATION=100
```

## Usage Examples

### Basic Storage

```typescript
import { createRealFilCDNService } from '@/services/filcdn/realFilcdnService';

const filcdnService = createRealFilCDNService({
  privateKey: process.env.FILCDN_PRIVATE_KEY,
  rpcURL: process.env.NEXT_PUBLIC_FILECOIN_RPC_URL,
  withCDN: true
});

// Store data
const result = await filcdnService.storeData({
  type: 'performer_content',
  data: performerData,
  timestamp: Date.now()
});

// Retrieve data
const retrieved = await filcdnService.retrieveData(result.cid);
```

### Integration with MegaVibe Features

1. **Performer Content**: Store performer profiles, media, and metadata
2. **User Generated Content**: Store tips, messages, and interactions
3. **Platform Data**: Store analytics, reputation data, and system logs
4. **Media Files**: Store images, videos, and audio content

## Alignment with Filecoin Documentation

Our integration follows Filecoin best practices:

### MetaMask Integration
- Supports both Filecoin EVM (`0x`) and native (`f`) addresses
- Compatible with Ledger hardware wallets
- Follows official MetaMask setup guidelines

### Network Configuration
- Uses official RPC endpoints from Filecoin documentation
- Implements proper chain ID handling
- Supports mainnet, calibration, and local testnets

### Security Best Practices
- Private keys kept server-side only
- Environment-based configuration
- Proper error handling and fallbacks

## Testing

Test the integration using the test endpoint:

```bash
curl http://localhost:3000/api/test-filcdn
```

This will verify:
- SDK loading and initialization
- Environment configuration
- Basic storage operations (in development)
- Service statistics and health

## Cost Management

The integration implements cost-effective storage:

- **USDFC Tokens**: Predictable pricing in stablecoin
- **Automatic Allowances**: Handles token approvals automatically
- **Proof Set Optimization**: Reuses existing infrastructure when possible
- **CDN Integration**: Faster retrieval with optional CDN services

## Production Deployment

For production deployment:

1. **Environment Setup**: Configure production environment variables
2. **Wallet Setup**: Fund wallet with USDFC tokens for storage costs
3. **Network Configuration**: Use mainnet RPC endpoints
4. **Monitoring**: Monitor storage costs and service health

## Benefits for MegaVibe

1. **Decentralization**: Reduces dependency on centralized storage providers
2. **Cost Efficiency**: Predictable storage costs with USDFC tokens
3. **Reliability**: Cryptographic guarantees and redundant storage
4. **Scalability**: Filecoin network scales with platform growth
5. **Web3 Native**: Aligns with platform's Web3 and blockchain focus

## Future Enhancements

- **Content Verification**: Implement content integrity checks
- **Access Control**: Add encryption and access control layers
- **Analytics Integration**: Track storage usage and costs
- **Multi-Network Support**: Expand to other Filecoin-compatible networks

## Support and Documentation

- **Synapse SDK Docs**: https://www.npmjs.com/package/@filoz/synapse-sdk
- **Filecoin Docs**: https://docs.filecoin.io/
- **MetaMask Setup**: https://docs.filecoin.io/basics/assets/metamask-setup
- **Test Endpoint**: `/api/test-filcdn` for integration verification
