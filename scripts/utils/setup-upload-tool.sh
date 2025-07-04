#!/bin/bash
# Setup script for the event upload tool

echo "Setting up event upload tool dependencies..."

# Install required npm packages
# Note: @filoz/synapse-sdk will install the latest version
npm install dotenv@16.3.1 @filoz/synapse-sdk ethers@6.8.1

# Make sure the upload script is executable
chmod +x scripts/uploadEventsToFilCDN.js

echo "Creating .env.local file if it doesn't exist"
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example template"
  echo "Please edit .env.local to add your FilCDN private key"
else
  echo ".env.local already exists"
fi

# Update package.json scripts
echo "Updating package.json scripts"
# Using node to modify package.json to ensure we don't break its structure
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Set type to module for ESM support
pkg.type = "module";

// Add upload scripts
pkg.scripts["upload:events"] = "node scripts/uploadEventsToFilCDN.js";
pkg.scripts["upload:events:example"] = "node scripts/uploadEventsToFilCDN.js --file ./data/example-events.json --verbose";

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
console.log("Updated package.json with ESM support and upload scripts");
'

# Create example data directory if it doesn't exist
mkdir -p data

# Create example events file if it doesn't exist
if [ ! -f "data/example-events.json" ]; then
  echo "Creating example events data file..."
  cat > data/example-events.json << EOF
[
  {
    "id": "evt-001",
    "title": "Web3 Developer Summit",
    "description": "A conference for developers building the decentralized web",
    "startDate": "2025-08-15T09:00:00.000Z",
    "endDate": "2025-08-17T18:00:00.000Z",
    "venue": {
      "name": "Tech Convention Center",
      "address": "123 Blockchain Blvd, San Francisco, CA 94103",
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "speakers": [
      {
        "id": "spk-001",
        "name": "Alice Nakamoto",
        "bio": "Blockchain architect and Web3 visionary",
        "image": "https://example.com/speakers/alice.jpg"
      },
      {
        "id": "spk-002",
        "name": "Bob Buterin",
        "bio": "Smart contract security expert",
        "image": "https://example.com/speakers/bob.jpg"
      }
    ],
    "image": "https://example.com/events/web3summit.jpg",
    "categories": ["development", "blockchain", "web3"],
    "ticketPrice": "250 USDC",
    "website": "https://example.com/events/web3summit"
  }
]
EOF
  echo "Created example events data file at data/example-events.json"
fi

echo "Setup complete! You can now use the upload tool with:"
echo "npm run upload:events:example"
echo "or"
echo "npm run upload:events -- --file ./path/to/your/events.json"