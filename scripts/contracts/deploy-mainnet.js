const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying MegaVibe Contracts to Mantle Mainnet...");
  console.log("⚠️  PRODUCTION DEPLOYMENT - MAKE SURE YOU'RE READY!");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT");

  // Minimum balance check (0.1 MNT for deployment costs)
  const minBalance = ethers.parseEther("0.1");
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least 0.1 MNT, have ${ethers.formatEther(balance)} MNT`);
  }

  // Confirm network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());

  if (network.chainId.toString() !== "5000") {
    throw new Error("❌ Not connected to Mantle Mainnet (Chain ID: 5000)");
  }

  // Set fee recipient (using deployer initially, can be changed later)
  const feeRecipient = deployer.address;
  console.log("🏗️  Fee recipient set to:", feeRecipient);

  const deploymentResults = {};
  const deploymentTimestamp = new Date().toISOString();

  try {
    // Deploy MegaVibeTipping Contract
    console.log("\n🎯 Deploying MegaVibeTipping Contract...");
    const MegaVibeTipping = await ethers.getContractFactory("MegaVibeTipping");
    const tippingContract = await MegaVibeTipping.deploy(feeRecipient);
    await tippingContract.waitForDeployment();
    const tippingAddress = await tippingContract.getAddress();

    console.log("✅ MegaVibeTipping deployed to:", tippingAddress);

    // Deploy MegaVibeBounties Contract
    console.log("\n🎯 Deploying MegaVibeBounties Contract...");
    const MegaVibeBounties = await ethers.getContractFactory("MegaVibeBounties");
    const bountiesContract = await MegaVibeBounties.deploy(feeRecipient);
    await bountiesContract.waitForDeployment();
    const bountiesAddress = await bountiesContract.getAddress();

    console.log("✅ MegaVibeBounties deployed to:", bountiesAddress);

    // Verify contract configurations
    console.log("\n📊 Verifying Contract Configurations...");

    // Tipping contract verification
    const tippingPlatformFee = await tippingContract.PLATFORM_FEE_BPS();
    const minTipAmount = await tippingContract.MIN_TIP_AMOUNT();
    const maxMessageLength = await tippingContract.MAX_MESSAGE_LENGTH();

    // Bounties contract verification
    const bountiesPlatformFee = await bountiesContract.PLATFORM_FEE_BPS();
    const minBountyAmount = await bountiesContract.MIN_BOUNTY_AMOUNT();
    const maxBountyDuration = await bountiesContract.MAX_BOUNTY_DURATION();

    console.log("\n🔧 Tipping Contract Configuration:");
    console.log("   Platform Fee:", tippingPlatformFee.toString(), "basis points (5%)");
    console.log("   Min Tip Amount:", ethers.formatEther(minTipAmount), "MNT");
    console.log("   Max Message Length:", maxMessageLength.toString(), "characters");

    console.log("\n🔧 Bounties Contract Configuration:");
    console.log("   Platform Fee:", bountiesPlatformFee.toString(), "basis points (5%)");
    console.log("   Min Bounty Amount:", ethers.formatEther(minBountyAmount), "MNT");
    console.log("   Max Bounty Duration:", maxBountyDuration.toString(), "seconds");

    // Prepare deployment info
    deploymentResults.success = true;
    deploymentResults.network = "mantleMainnet";
    deploymentResults.chainId = network.chainId.toString();
    deploymentResults.deployer = deployer.address;
    deploymentResults.feeRecipient = feeRecipient;
    deploymentResults.timestamp = deploymentTimestamp;
    deploymentResults.blockNumber = await ethers.provider.getBlockNumber();

    deploymentResults.contracts = {
      tipping: {
        address: tippingAddress,
        name: "MegaVibeTipping",
        platformFeeBps: tippingPlatformFee.toString(),
        minTipAmount: minTipAmount.toString(),
        maxMessageLength: maxMessageLength.toString()
      },
      bounties: {
        address: bountiesAddress,
        name: "MegaVibeBounties",
        platformFeeBps: bountiesPlatformFee.toString(),
        minBountyAmount: minBountyAmount.toString(),
        maxBountyDuration: maxBountyDuration.toString()
      }
    };

    // Save deployment info to file
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentDir, `mainnet-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResults, null, 2));

    console.log("\n📝 Deployment info saved to:", deploymentFile);

    // Generate environment variables
    console.log("\n🔧 PRODUCTION ENVIRONMENT VARIABLES");
    console.log("=" * 60);

    console.log("\n📱 FRONTEND (.env.production):");
    console.log(`VITE_ENVIRONMENT=production`);
    console.log(`VITE_MANTLE_RPC_URL=https://rpc.mantle.xyz`);
    console.log(`VITE_MANTLE_CHAIN_ID=5000`);
    console.log(`VITE_MANTLE_NETWORK_NAME=Mantle`);
    console.log(`VITE_TIPPING_CONTRACT_ADDRESS=${tippingAddress}`);
    console.log(`VITE_BOUNTY_CONTRACT_ADDRESS=${bountiesAddress}`);
    console.log(`VITE_TIPPING_CONTRACT_NETWORK=mantleMainnet`);
    console.log(`VITE_FEE_RECIPIENT_ADDRESS=${feeRecipient}`);
    console.log(`VITE_PLATFORM_FEE_PERCENTAGE=5`);

    console.log("\n🖥️  BACKEND (.env.production):");
    console.log(`NODE_ENV=production`);
    console.log(`TIPPING_CONTRACT_ADDRESS=${tippingAddress}`);
    console.log(`BOUNTY_CONTRACT_ADDRESS=${bountiesAddress}`);
    console.log(`TIPPING_CONTRACT_NETWORK=mantleMainnet`);
    console.log(`FEE_RECIPIENT_ADDRESS=${feeRecipient}`);
    console.log(`MANTLE_RPC_URL=https://rpc.mantle.xyz`);
    console.log(`MANTLE_CHAIN_ID=5000`);

    console.log("\n🔗 EXPLORER LINKS:");
    console.log(`Tipping Contract: https://explorer.mantle.xyz/address/${tippingAddress}`);
    console.log(`Bounties Contract: https://explorer.mantle.xyz/address/${bountiesAddress}`);

    console.log("\n📋 NEXT STEPS:");
    console.log("1. Verify contracts on Mantle Explorer");
    console.log("2. Update environment variables in production");
    console.log("3. Test contract interactions on mainnet");
    console.log("4. Deploy frontend and backend with new configs");
    console.log("5. Run end-to-end tests");

    return deploymentResults;

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);

    deploymentResults.success = false;
    deploymentResults.error = error.message;
    deploymentResults.timestamp = deploymentTimestamp;

    // Save failed deployment info
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const failedDeploymentFile = path.join(deploymentDir, `mainnet-failed-${Date.now()}.json`);
    fs.writeFileSync(failedDeploymentFile, JSON.stringify(deploymentResults, null, 2));

    throw error;
  }
}

// Confirmation prompt for production deployment
async function confirmDeployment() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question('\n⚠️  You are about to deploy to MAINNET. This will cost real MNT tokens.\nType "YES" to confirm: ', (answer) => {
      readline.close();
      resolve(answer === 'YES');
    });
  });
}

// Execute deployment with confirmation
if (require.main === module) {
  (async () => {
    try {
      const confirmed = await confirmDeployment();

      if (!confirmed) {
        console.log("❌ Deployment cancelled by user");
        process.exit(0);
      }

      console.log("✅ Deployment confirmed, proceeding...\n");

      const result = await main();

      console.log("\n🎉 MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
      console.log("🚀 Your MegaVibe contracts are now live on Mantle Mainnet!");

      process.exit(0);
    } catch (error) {
      console.error("\n💥 MAINNET DEPLOYMENT FAILED:");
      console.error(error.message);
      process.exit(1);
    }
  })();
}

module.exports = main;
