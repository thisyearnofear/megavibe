const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MegaVibe Tipping Contract to Mantle Network...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT");

  // Set fee recipient (can be changed later by owner)
  const feeRecipient = deployer.address; // Using deployer as initial fee recipient

  console.log("🏗️  Fee recipient set to:", feeRecipient);

  // Deploy the contract
  console.log("⚙️  Compiling and deploying contract...");

  const MegaVibeTipping = await ethers.getContractFactory("MegaVibeTipping");
  const contract = await MegaVibeTipping.deploy(feeRecipient);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Mantle Explorer:", `https://explorer.sepolia.mantle.xyz/address/${contractAddress}`);

  // Verify contract constants
  const platformFeeBps = await contract.PLATFORM_FEE_BPS();
  const minTipAmount = await contract.MIN_TIP_AMOUNT();
  const maxMessageLength = await contract.MAX_MESSAGE_LENGTH();

  console.log("\n📊 Contract Configuration:");
  console.log("   Platform Fee:", platformFeeBps.toString(), "basis points (5%)");
  console.log("   Min Tip Amount:", ethers.formatEther(minTipAmount), "MNT");
  console.log("   Max Message Length:", maxMessageLength.toString(), "characters");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: network.name,
    deployer: deployer.address,
    feeRecipient: feeRecipient,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    platformFeeBps: platformFeeBps.toString(),
    minTipAmount: minTipAmount.toString(),
    maxMessageLength: maxMessageLength.toString()
  };

  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Environment variables for frontend
  console.log("\n🔧 Environment Variables for Frontend (.env.production):");
  console.log(`VITE_TIPPING_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz`);
  console.log(`VITE_MANTLE_SEPOLIA_CHAIN_ID=5003`);

  // Environment variables for backend
  console.log("\n🔧 Environment Variables for Backend (.env.production):");
  console.log(`TIPPING_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`TIPPING_CONTRACT_NETWORK=mantleSepolia`);
  console.log(`FEE_RECIPIENT_ADDRESS=${feeRecipient}`);

  return {
    contract: contract,
    address: contractAddress,
    deploymentInfo: deploymentInfo
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 Deployment completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
