# Decentralized Storage with FilCDN

This document explains how MegaVibe uses decentralized storage with FilCDN to store and retrieve event data without relying on a centralized backend.

## Overview

MegaVibe now implements a fully decentralized approach to storing event data using FilCDN, which leverages the Filecoin network for persistent storage. This eliminates the need for API calls to a centralized backend, improving reliability and censorship resistance.

> **Note**: FilCDN currently supports only PDP deals made on the Filecoin Calibration network. Mainnet support is coming in early July 2025. File size is limited to 254 MiB.

## Architecture

The implementation consists of several key components:

1. **EventStorageService**: Handles the storage and retrieval of event data with FilCDN, with local storage fallback.
2. **EventStateService**: Manages event data in the Redux store, making it available throughout the application.
3. **FilCDNService**: Core service that interfaces with the Filecoin network via the Synapse SDK.
4. **Upload Script**: CLI tool to upload new event data to FilCDN.

## Using the Services

### In Application Code

Event data is automatically loaded when the application starts:

```typescript
// Access event data in a component
import { getEventStateService } from "../services/state/EventStateService";

function EventList() {
  const eventService = getEventStateService();
  const allEvents = eventService.getAllEvents();

  // Or filter by type
  const upcomingEvents = eventService
    .getState()
    .upcomingEvents.map((id) => eventService.getEventById(id))
    .filter(Boolean);

  // ...render events
}
```

### Wallet Setup for FilCDN

Before you can upload event data to FilCDN, you need to set up your wallet:

1. **Configure your wallet** (e.g., MetaMask) for the Filecoin Calibration testnet

   - Network Name: `Filecoin Calibration`
   - RPC URL: `https://api.calibration.node.glif.io/rpc/v1`
   - Chain ID: `314159`
   - Currency Symbol: `tFIL`
   - Block Explorer: `https://calibration.filscan.io/`

2. **Get testnet FIL** from one of these faucets:

   - [Calibration Faucet - Chainsafe](https://faucet.calibration.chainsafe-fil.io/)
   - [Calibration Faucet - Zondax](https://zondax.ch/fil-faucet)
   - [Calibration Faucet - Forest Explorer](https://explorer.forest.network/#/faucet)

3. **Get testnet USDFC tokens**:

   - [Mint new USDFC tokens](https://fs-upload-dapp.netlify.app/)
   - [Get USDFC tokens from the Chainsafe Faucet](https://faucet.calibration.chainsafe-fil.io/)

4. **Set up initial payment**:
   - Go to the [FilCDN Demo Web App](https://fs-upload-dapp.netlify.app/)
   - Connect your wallet
   - In the "Manage Storage" tab, click "Deposit & Increase Allowances"
   - Approve the spending cap transaction (use a value smaller than your USDFC balance)
   - Approve the deposit transaction for storing data
   - Sign the metadata request

### Uploading New Event Data

To upload event data to FilCDN:

1. **Create a JSON file** with your event data following the structure in `data/example-events.json`

2. **Set environment variables** (copy `.env.example` to `.env.local` and edit):

   ```
   FILCDN_PRIVATE_KEY=your_private_key
   FILCDN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
   FILCDN_WITH_CDN=true
   ```

3. **Run the upload script**:
   ```
   npm run upload:events -- --file ./path/to/your/events.json
   ```

You can also use the example data:

```
npm run upload:events:example
```

## Local Development

For local development without FilCDN:

1. Copy `.env.example` to `.env.local`
2. Set `VITE_USE_FILCDN=false` in your `.env.local` file
3. The application will automatically use local storage for event data

## Technical Details

### Event Schema

```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  speakers: Array<{
    id: string;
    name: string;
    walletAddress: string;
    profileImage?: string;
  }>;
  imageUrl?: string;
  categories?: string[];
}
```

### Storage Structure

The system uses a simple indexing mechanism:

1. Event data is stored as a JSON array with a unique CID
2. An index file stores the reference to the latest event data CID
3. The application first retrieves the index, then uses it to fetch the event data

### Error Handling & Fallbacks

The implementation includes robust error handling:

1. If FilCDN initialization fails, the system falls back to local storage
2. If an event cannot be retrieved from FilCDN, it attempts to load from local storage
3. All operations are wrapped in try/catch blocks with appropriate logging

## Troubleshooting

### Common Issues

1. **RPC Errors**: The error "method 'eth_signTypedData_v4' not found" indicates your RPC endpoint doesn't support the required methods. Try using a different RPC provider from this list:

   - Glif: `https://api.calibration.node.glif.io/rpc/v1`
   - Ankr: `https://rpc.ankr.com/filecoin_testnet`
   - ChainupCloud: `https://filecoin-calibration.chainup.net/rpc/v1`

2. **Allowance Issues**: If you encounter "Insufficient allowances" errors when uploading, you need to:

   - Ensure you have sufficient USDFC balance
   - Approve USDFC spending for the Payments contract
   - Approve the Pandora service as an operator
   - Use the [FilCDN Demo Web App](https://fs-upload-dapp.netlify.app/) to set these up easily

3. **Upload Failures**: If uploads fail, check your private key and network connection. You can use the `--dry-run` flag to validate your data without attempting to upload.

4. **Empty Events List**: If no events appear, check the browser console for errors and verify that the EventStateService was properly initialized.

5. **File Size Limits**: FilCDN currently limits file size to 254 MiB. If your events JSON is larger, consider splitting it into multiple files.

### Checking Uploaded Data

To verify your data was uploaded correctly, you can retrieve it directly from the FilCDN URL:

```
https://{your-wallet-address}.calibration.filcdn.io/{CID}
```

Example:

```
https://0xde946319e3dba67b58bd771de01af8accafcda9d.calibration.filcdn.io/baga6ea4seaqlils6ulckqxstjmjtneo7hfa3qbvlkwsfnyroxcbrw3veq45luji
```

The CID will be shown in the console output when you run the upload script.
