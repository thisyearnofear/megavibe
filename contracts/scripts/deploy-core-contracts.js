const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying MegaVibe Core Contracts...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📍 Network:", network.name, "(" + network.chainId + ")");
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const deployedContracts = {};

  try {
    // Deploy MegaVibeTipping
    console.log("\n📝 Deploying MegaVibeTipping...");
    const MegaVibeTipping = await ethers.getContractFactory("MegaVibeTipping");
    const tipping = await MegaVibeTipping.deploy();
    await tipping.waitForDeployment();
    const tippingAddress = await tipping.getAddress();
    
    console.log("✅ MegaVibeTipping deployed to:", tippingAddress);
    deployedContracts.MegaVibeTipping = tippingAddress;

    // Deploy MegaVibeBounties
    console.log("\n📝 Deploying MegaVibeBounties...");
    const MegaVibeBounties = await ethers.getContractFactory("MegaVibeBounties");
    const bounties = await MegaVibeBounties.deploy();
    await bounties.waitForDeployment();
    const bountiesAddress = await bounties.getAddress();
    
    console.log("✅ MegaVibeBounties deployed to:", bountiesAddress);
    deployedContracts.MegaVibeBounties = bountiesAddress;

    // Deploy SimpleReputation if not exists
    console.log("\n📝 Deploying SimpleReputation...");
    const SimpleReputation = await ethers.getContractFactory("SimpleReputation");
    const reputation = await SimpleReputation.deploy();
    await reputation.waitForDeployment();
    const reputationAddress = await reputation.getAddress();
    
    console.log("✅ SimpleReputation deployed to:", reputationAddress);
    deployedContracts.SimpleReputation = reputationAddress;

    // Update deployed-addresses.json
    const addressesPath = path.join(__dirname, "../deployed-addresses.json");
    let addresses = {};
    
    if (fs.existsSync(addressesPath)) {
      addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    }

    // Add new deployments
    Object.keys(deployedContracts).forEach(contractName => {
      if (!addresses[contractName]) {
        addresses[contractName] = {};
      }
      addresses[contractName][network.chainId.toString()] = deployedContracts[contractName];
    });

    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log("\n📄 Updated deployed-addresses.json");

    // Generate frontend config
    const frontendConfigPath = path.join(__dirname, "../../frontend/src/contracts/addresses.ts");
    const configContent = `// Auto-generated contract addresses
// Last updated: ${new Date().toISOString()}

export const CONTRACTS = {
  MegaVibeTipping: "${deployedContracts.MegaVibeTipping}",
  MegaVibeBounties: "${deployedContracts.MegaVibeBounties}",
  SimpleReputation: "${deployedContracts.SimpleReputation}",
} as const;

export const CONTRACT_ADDRESSES: Record<number, typeof CONTRACTS> = {
  ${network.chainId}: CONTRACTS,
};

export const DEFAULT_CHAIN_ID = ${network.chainId};
export const SUPPORTED_CHAINS = [${network.chainId}];
`;

    fs.writeFileSync(frontendConfigPath, configContent);
    console.log("📄 Updated frontend/src/contracts/addresses.ts");

    // Generate environment template
    const envTemplatePath = path.join(__dirname, "../../frontend/.env.local.example");
    const envContent = `# MegaVibe Environment Configuration
# Copy this to .env.local and fill in your values

# Contract Addresses (Network: ${network.name})
NEXT_PUBLIC_CONTRACT_TIPPING_ADDRESS=${deployedContracts.MegaVibeTipping}
NEXT_PUBLIC_CONTRACT_BOUNTIES_ADDRESS=${deployedContracts.MegaVibeBounties}
NEXT_PUBLIC_CONTRACT_REPUTATION_ADDRESS=${deployedContracts.SimpleReputation}

# Network Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=${network.chainId}
NEXT_PUBLIC_NETWORK_NAME=${network.name}

# RPC Configuration (Add your API keys)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key_here

# Block Explorer
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MegaVibe
`;

    fs.writeFileSync(envTemplatePath, envContent);
    console.log("📄 Created frontend/.env.local.example");

    console.log("\n🎉 Deployment Summary:");
    console.log("========================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    
    console.log(`\n🔗 Network: ${network.name} (${network.chainId})`);
    console.log(`💰 Total Gas Used: ~${ethers.formatEther("1000000000000000")} ETH (estimated)`);
    
    console.log("\n📋 Next Steps:");
    console.log("1. Copy .env.local.example to .env.local");
    console.log("2. Add your API keys to .env.local");
    console.log("3. Restart your frontend development server");
    console.log("4. Test the application with real contracts!");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });