const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Contracts to Mantle Network...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT");

  // Deploy EventContract
  console.log("⚙️  Deploying EventContract...");
  const EventContract = await ethers.getContractFactory("EventContract");
  const eventContract = await EventContract.deploy();
  await eventContract.waitForDeployment();
  const eventContractAddress = await eventContract.getAddress();
  console.log("✅ EventContract deployed to:", eventContractAddress);

  // Deploy MegaVibeTipping
  console.log("⚙️  Deploying MegaVibeTipping...");
  const feeRecipient = deployer.address;
  const MegaVibeTipping = await ethers.getContractFactory("MegaVibeTipping");
  const tippingContract = await MegaVibeTipping.deploy(feeRecipient);
  await tippingContract.waitForDeployment();
  const tippingContractAddress = await tippingContract.getAddress();
  console.log("✅ MegaVibeTipping deployed to:", tippingContractAddress);

  console.log("\n🎉 All contracts deployed successfully!");

  // Environment variables
  console.log("\n🔧 Environment Variables for Frontend (.env.production):");
  console.log(`VITE_EVENT_CONTRACT_ADDRESS=${eventContractAddress}`);
  console.log(`VITE_TIPPING_CONTRACT_ADDRESS=${tippingContractAddress}`);
  console.log(`VITE_MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz`);
  console.log(`VITE_MANTLE_SEPOLIA_CHAIN_ID=5003`);

  console.log("\n🔧 Environment Variables for Backend (.env.production):");
  console.log(`EVENT_CONTRACT_ADDRESS=${eventContractAddress}`);
  console.log(`TIPPING_CONTRACT_ADDRESS=${tippingContractAddress}`);
  console.log(`TIPPING_CONTRACT_NETWORK=mantleSepolia`);
  console.log(`FEE_RECIPIENT_ADDRESS=${feeRecipient}`);

  return {
    eventContractAddress,
    tippingContractAddress,
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
