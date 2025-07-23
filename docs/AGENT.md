# MegaVibe Development Guide

## Commands
- `npm run dev` - Start development server
- `npm run build` - Production build (uses 4GB memory limit)
- `npm run start` - Start production server
- `npm run lint` - ESLint checks
- `npm run test` - Run all Jest tests
- `npm run test:synapseSDK` - Run specific test file (example pattern for single tests)
- `npm run test:watch` - Jest in watch mode
- `npm run test:coverage` - Test coverage report

## Architecture
- Next.js 14 App Router architecture with TypeScript
- Key directories: `src/app/` (pages), `src/components/` (UI), `src/services/` (API/blockchain), `src/hooks/` (React hooks), `src/contexts/` (providers)
- Smart contracts in `/contracts/` (Hardhat project)
- FilCDN integration for decentralized storage, blockchain tipping/bounty system
- Services: AI, blockchain (ethers/viem), FilCDN, identity, QR, recommendations

## Code Style
- TypeScript strict mode enabled
- Path aliases: `@/*` for src, `@components/*`, `@services/*`, `@hooks/*`, `@utils/*`, `@styles/*`
- Import order: Next.js/React, third-party, local components with path aliases
- Components use PascalCase, files follow kebab-case or camelCase
- Async/await preferred over promises
- Error boundaries for React error handling
- Tailwind CSS for styling
