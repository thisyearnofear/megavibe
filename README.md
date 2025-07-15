# MegaVibe Frontend (Next.js)

This is the Next.js implementation of the MegaVibe platform, focused on "The Stage" - a unified, contextual user experience centered around performers.

## Environment Setup

The application requires several environment variables to be set correctly. Create a `.env.local` file in the root of the frontend-production directory with the following variables:

```bash
# Environment Configuration
NEXT_PUBLIC_API_URL=https://megavibe.onrender.com
NEXT_PUBLIC_WS_URL=https://megavibe.onrender.com
NEXT_PUBLIC_ENVIRONMENT=development

# Dynamic.xyz Configuration
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id

# Network Configuration
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_MANTLE_CHAIN_ID=5003
NEXT_PUBLIC_MANTLE_NETWORK_NAME=Mantle Sepolia

# Smart Contract Configuration
NEXT_PUBLIC_TIPPING_CONTRACT_ADDRESS=your_tipping_contract_address
NEXT_PUBLIC_BOUNTY_CONTRACT_ADDRESS=your_bounty_contract_address
NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS=your_fee_recipient_address
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=5

# SimpleReputation Contract Addresses
NEXT_PUBLIC_SIMPLE_REPUTATION_SEPOLIA=your_simple_reputation_sepolia_address
# Add other network addresses as needed

# USDC Contract Addresses by Chain
NEXT_PUBLIC_USDC_MANTLE_SEPOLIA=your_usdc_mantle_sepolia_address
# Add other USDC addresses as needed

# Features
NEXT_PUBLIC_DEBUG_MODE=true

# LI.FI Configuration
NEXT_PUBLIC_LIFI_API_KEY=your_lifi_api_key

# FilCDN Configuration (for decentralized storage)
# Note: Private key is kept server-side in Next.js
FILECOIN_PRIVATE_KEY=your_filecoin_private_key
NEXT_PUBLIC_FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
NEXT_PUBLIC_FILCDN_ENABLED=true

# FilCDN Integration Options
NEXT_PUBLIC_USE_REAL_FILCDN=false
NEXT_PUBLIC_FILCDN_MIN_REPUTATION=100

# AI Service Configuration
NEXT_PUBLIC_AI_API_URL=/api/ai
NEXT_PUBLIC_AI_ENABLED=true

# MetaMask Card Configuration
NEXT_PUBLIC_METAMASK_CARD_ENABLED=true
NEXT_PUBLIC_METAMASK_CARD_API_URL=https://card-api.metamask.io
NEXT_PUBLIC_METAMASK_CARD_MERCHANT_ID=your_merchant_id_here

# Infura Key
NEXT_PUBLIC_INFURA_KEY=your_infura_key_here
```

Replace all "your\_\*" placeholders with your actual values.

## Key Features

- Modern Next.js App Router architecture
- GSAP animations for interactive UI elements
- FilCDN integration for decentralized storage
- Smart contract integration for bounties and tipping
- AI-assisted content creation
- Bidirectional bounty system (audience-to-performer and performer-to-audience)
- Fully responsive design for all device sizes

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Build

To build the application for production:

```bash
npm run build
# or
yarn build
```

Then, to start the production server:

```bash
npm run start
# or
yarn start
```

## Folder Structure

- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable UI components
- `/src/contexts` - React context providers
- `/src/hooks` - Custom React hooks
- `/src/services` - Service layer for API and blockchain interactions
- `/src/styles` - Global styles and design tokens
- `/src/utils` - Utility functions
- `/src/contracts` - Smart contract ABIs and configuration
- `/public` - Static assets

## Important Notes

- The `FILECOIN_PRIVATE_KEY` should never be exposed in the client-side code
- For production, ensure all placeholder values are replaced with actual values
- The environment settings in `.env.local` are for development only
- Create `.env.production` for production-specific settings
