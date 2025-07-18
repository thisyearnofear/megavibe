const { ethers } = require("hardhat");

async function main() {
  console.log(
    "🎯 Deploying MegaVibeBounties and MegaVibeTipping Contracts to Mantle Sepolia..."
  );

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT");

  if (balance < ethers.parseEther("0.02")) {
    console.warn("⚠️  Low balance! You may need more MNT for deployment.");
  }

  // Contract addresses and configuration
  const feeRecipient = deployer.address; // Using deployer as initial fee recipient
  const usdcTokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC on Mantle Sepolia
  const emergencyRecoveryAddress = deployer.address; // Using deployer as emergency recovery

  console.log("🏗️  Configuration:");
  console.log("   Fee recipient:", feeRecipient);
  console.log("   USDC token address:", usdcTokenAddress);
  console.log("   Emergency recovery address:", emergencyRecoveryAddress);

  // First, check if SimpleReputation is deployed
  let reputationContractAddress;
  try {
    const fs = require("fs");
    const deployedAddresses = JSON.parse(
      fs.readFileSync("./deployed-addresses.json", "utf8")
    );
    reputationContractAddress =
      deployedAddresses.mantleSepolia?.SimpleReputation;

    if (!reputationContractAddress) {
      throw new Error("SimpleReputation not found in deployed addresses");
    }

    console.log(
      "✅ Found existing SimpleReputation contract:",
      reputationContractAddress
    );
  } catch (error) {
    console.log("⚠️  SimpleReputation not found, deploying it first...");

    // Deploy SimpleReputation
    const SimpleReputation = await ethers.getContractFactory(
      "SimpleReputation"
    );
    const reputationContract = await SimpleReputation.deploy(deployer.address);
    await reputationContract.waitForDeployment();
    reputationContractAddress = await reputationContract.getAddress();

    console.log("✅ SimpleReputation deployed:", reputationContractAddress);
  }

  // Deploy MegaVibeBounties
  console.log("\n⚙️  Deploying MegaVibeBounties contract...");
  const MegaVibeBounties = await ethers.getContractFactory("MegaVibeBounties");
  const bountiesContract = await MegaVibeBounties.deploy(
    feeRecipient,
    usdcTokenAddress,
    reputationContractAddress,
    emergencyRecoveryAddress
  );

  console.log("⏳ Waiting for MegaVibeBounties deployment confirmation...");
  await bountiesContract.waitForDeployment();
  const bountiesAddress = await bountiesContract.getAddress();

  console.log("✅ MegaVibeBounties deployed successfully!");
  console.log("📍 Contract Address:", bountiesAddress);

  // Deploy MegaVibeTipping
  console.log("\n⚙️  Deploying MegaVibeTipping contract...");
  const MegaVibeTipping = await ethers.getContractFactory("MegaVibeTipping");
  const tippingContract = await MegaVibeTipping.deploy(
    feeRecipient,
    usdcTokenAddress,
    reputationContractAddress,
    emergencyRecoveryAddress
  );

  console.log("⏳ Waiting for MegaVibeTipping deployment confirmation...");
  await tippingContract.waitForDeployment();
  const tippingAddress = await tippingContract.getAddress();

  console.log("✅ MegaVibeTipping deployed successfully!");
  console.log("📍 Contract Address:", tippingAddress);

  console.log("\n🔗 Mantle Explorer Links:");
  console.log(
    "   MegaVibeBounties:",
    `https://explorer.sepolia.mantle.xyz/address/${bountiesAddress}`
  );
  console.log(
    "   MegaVibeTipping:",
    `https://explorer.sepolia.mantle.xyz/address/${tippingAddress}`
  );

  // Test basic functionality
  console.log("\n🧪 Testing basic contract functionality...");

  try {
    // Test MegaVibeBounties
    const totalBounties = await bountiesContract.getTotalBounties();
    console.log(
      "   MegaVibeBounties - Total bounties:",
      totalBounties.toString()
    );

    const platformStats = await bountiesContract.getPlatformStats();
    console.log("   MegaVibeBounties - Platform stats:", {
      totalVolume: ethers.formatEther(platformStats[0]),
      totalBounties: platformStats[1].toString(),
      activeBounties: platformStats[2].toString(),
      platformFees: ethers.formatEther(platformStats[3]),
    });

    // Test MegaVibeTipping
    const totalTips = await tippingContract.getTotalTips();
    console.log("   MegaVibeTipping - Total tips:", totalTips.toString());

    const contractParams = await tippingContract.getContractParameters();
    console.log("   MegaVibeTipping - Parameters:", {
      platformFeeBps: contractParams[0].toString(),
      minTipAmount: contractParams[1].toString(),
      maxMessageLength: contractParams[2].toString(),
    });

    console.log("✅ Both contracts are working correctly!");
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    contracts: {
      MegaVibeBounties: {
        address: bountiesAddress,
        feeRecipient: feeRecipient,
      },
      MegaVibeTipping: {
        address: tippingAddress,
        feeRecipient: feeRecipient,
        usdcToken: usdcTokenAddress,
        reputationContract: reputationContractAddress,
        emergencyRecovery: emergencyRecoveryAddress,
      },
      SimpleReputation: {
        address: reputationContractAddress,
      },
    },
  };

  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Update deployed-addresses.json
  const fs = require("fs");
  let deployedAddresses = {};

  try {
    deployedAddresses = JSON.parse(
      fs.readFileSync("./deployed-addresses.json", "utf8")
    );
  } catch (error) {
    console.log("Creating new deployed-addresses.json file");
  }

  if (!deployedAddresses.mantleSepolia) {
    deployedAddresses.mantleSepolia = {};
  }

  deployedAddresses.mantleSepolia.MegaVibeBounties = bountiesAddress;
  deployedAddresses.mantleSepolia.MegaVibeTipping = tippingAddress;
  deployedAddresses.mantleSepolia.SimpleReputation = reputationContractAddress;

  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(deployedAddresses, null, 2)
  );
  console.log("💾 Updated deployed-addresses.json");

  // Environment variables for frontend
  console.log("\n🔧 Frontend Environment Variables (.env):");
  console.log(`VITE_BOUNTY_CONTRACT_ADDRESS=${bountiesAddress}`);
  console.log(`VITE_TIPPING_CONTRACT_ADDRESS=${tippingAddress}`);
  console.log(`VITE_REPUTATION_CONTRACT_ADDRESS=${reputationContractAddress}`);
  console.log(`VITE_MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz`);
  console.log(`VITE_MANTLE_SEPOLIA_CHAIN_ID=5003`);

  // Environment variables for backend
  console.log("\n🔧 Backend Environment Variables (.env):");
  console.log(`BOUNTY_CONTRACT_ADDRESS=${bountiesAddress}`);
  console.log(`TIPPING_CONTRACT_ADDRESS=${tippingAddress}`);
  console.log(`REPUTATION_CONTRACT_ADDRESS=${reputationContractAddress}`);
  console.log(`MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz`);
  console.log(`MANTLE_SEPOLIA_CHAIN_ID=5003`);

  // Create deployment records
  const deploymentRecord = {
    ...deploymentInfo,
    abis: {
      MegaVibeBounties: bountiesContract.interface.format("json"),
      MegaVibeTipping: tippingContract.interface.format("json"),
    },
  };

  // Ensure deployments directory exists
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }

  fs.writeFileSync(
    "./deployments/bounties-tipping-sepolia.json",
    JSON.stringify(deploymentRecord, null, 2)
  );

  console.log(
    "💾 Deployment record saved to deployments/bounties-tipping-sepolia.json"
  );

  return {
    bountiesContract: bountiesContract,
    tippingContract: tippingContract,
    bountiesAddress: bountiesAddress,
    tippingAddress: tippingAddress,
    reputationAddress: reputationContractAddress,
    deploymentInfo: deploymentInfo,
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => {
      console.log(
        "\n🎉 MegaVibeBounties and MegaVibeTipping deployment completed successfully!"
      );
      console.log("🚀 Ready for smart contract integration!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
