const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying MegaVibe Contracts...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📍 Network:", network.name, "(" + network.chainId + ")");
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const deployedContracts = {};

  try {
    // Deploy SimpleReputation (we know this works)
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

    // Create .env.local for frontend
    const envPath = path.join(__dirname, "../../frontend/.env.local");
    const envContent = `# MegaVibe Environment Configuration
# Auto-generated on ${new Date().toISOString()}

# Contract Addresses (${network.name} - Chain ID: ${network.chainId})
NEXT_PUBLIC_CONTRACT_REPUTATION_ADDRESS=${deployedContracts.SimpleReputation}

# Network Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=${network.chainId}
NEXT_PUBLIC_NETWORK_NAME=${network.name}

# Add your API keys here:
# NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
# NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MegaVibe
NEXT_PUBLIC_DEV_MODE=true
`;

    fs.writeFileSync(envPath, envContent);
    console.log("📄 Created frontend/.env.local");

    console.log("\n🎉 Deployment Summary:");
    console.log("========================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    
    console.log(`\n🔗 Network: ${network.name} (${network.chainId})`);
    console.log(`🔍 Block Explorer: https://sepolia.etherscan.io/address/${deployedContracts.SimpleReputation}`);
    
    console.log("\n📋 Next Steps:");
    console.log("1. Add your Alchemy API key to frontend/.env.local");
    console.log("2. Restart your frontend development server");
    console.log("3. Test the application with the deployed contract!");
    console.log("4. Deploy MegaVibeTipping and MegaVibeBounties contracts when ready");

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