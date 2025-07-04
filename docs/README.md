# MegaVibe Documentation

This directory contains the documentation for the MegaVibe platform, with a focus on the cross-chain reputation system developed for the MetaMask Card Hackathon.

## Documentation Index

### Core Documentation

- [**Technical Overview**](Technical.md) - Technical architecture and implementation details
- [**Service Layer**](ServiceLayer.md) - Information about the service layer architecture
- [**Project Roadmap**](Roadmap.md) - Future development plans for MegaVibe

### Cross-Chain Reputation System

- [**Cross-Chain Reputation Architecture**](cross-chain-reputation.md) - Detailed architecture of the cross-chain reputation system
- [**Cross-Chain Deployment Guide**](cross-chain-deployment.md) - Instructions for deploying to multiple chains

### Deployment and Testing

- [**Deployment Guide**](deployment-guide.md) - General deployment instructions
- [**Unichain Integration**](unichain-integration.md) - Specific details about Unichain Sepolia integration

## Deployed Networks

The SimpleReputation contract is currently deployed on:

1. **Optimism Sepolia**: `0x7877Ac5C8158AB46ad608CB6990eCcB2A5265718`
2. **Unichain Sepolia**: `0x53628a5d15cfFac8C8F6c95b76b4FA436C7eaD1A`
3. **Ethereum Sepolia**: `0x4B7F67dBe2731E462A4047a19B2fdF14C910afEa` (requires troubleshooting)

## Quick Start

To test the cross-chain functionality:

```bash
# Navigate to the scripts directory
cd scripts

# Install dependencies
npm install

# Run the cross-chain test
npm run test-cross-chain

# Or test specific chains
node test-cross-chain-reputation.js --optimism
node test-cross-chain-reputation.js --unichain
```

## Project Organization

To clean up the project structure after development:

```bash
# From the project root
node cleanup.js
```

This will organize documentation and clean up temporary files.
