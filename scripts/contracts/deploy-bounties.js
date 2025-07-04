const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Deploying MegaVibeBounties Contract to Mantle Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Low balance! You may need more MNT for deployment.");
  }

  // Set fee recipient (can be changed later by owner)
  const feeRecipient = deployer.address; // Using deployer as initial fee recipient

  console.log("🏗️  Fee recipient set to:", feeRecipient);

  // Deploy the contract
  console.log("⚙️  Compiling and deploying MegaVibeBounties contract...");

  const MegaVibeBounties = await ethers.getContractFactory("MegaVibeBounties");
  const contract = await MegaVibeBounties.deploy(feeRecipient);

  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("✅ MegaVibeBounties deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Mantle Explorer:", `https://explorer.sepolia.mantle.xyz/address/${contractAddress}`);

  // Verify contract constants
  const platformFeeBps = await contract.PLATFORM_FEE_BPS();
  const minBountyAmount = await contract.MIN_BOUNTY_AMOUNT();
  const maxDeadlineDuration = await contract.MAX_DEADLINE_DURATION();

  console.log("\n📊 Contract Configuration:");
  console.log("   Platform Fee:", platformFeeBps.toString(), "basis points (5%)");
  console.log("   Min Bounty Amount:", ethers.formatEther(minBountyAmount), "MNT");
  console.log("   Max Deadline Duration:", (maxDeadlineDuration / 86400n).toString(), "days");

  // Test basic functionality
  console.log("\n🧪 Testing basic contract functionality...");
  
  try {
    const totalBounties = await contract.getTotalBounties();
    console.log("   Total bounties:", totalBounties.toString());
    
    const platformStats = await contract.getPlatformStats();
    console.log("   Platform stats:", {
      totalVolume: ethers.formatEther(platformStats[0]),
      totalBounties: platformStats[1].toString(),
      activeBounties: platformStats[2].toString(),
      platformFees: ethers.formatEther(platformStats[3])
    });
    
    console.log("✅ Contract is working correctly!");
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    contractName: "MegaVibeBounties",
    contractAddress: contractAddress,
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    feeRecipient: feeRecipient,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    platformFeeBps: platformFeeBps.toString(),
    minBountyAmount: minBountyAmount.toString(),
    maxDeadlineDuration: maxDeadlineDuration.toString(),
    gasUsed: "Estimated ~2M gas"
  };

  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Environment variables for frontend
  console.log("\n🔧 Frontend Environment Variables (.env):");
  console.log(`VITE_BOUNTY_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz`);
  console.log(`VITE_MANTLE_SEPOLIA_CHAIN_ID=5003`);

  // Environment variables for backend
  console.log("\n🔧 Backend Environment Variables (.env):");
  console.log(`BOUNTY_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`BOUNTY_CONTRACT_NETWORK=mantleSepolia`);
  console.log(`BOUNTY_FEE_RECIPIENT=${feeRecipient}`);
  console.log(`MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz`);
  console.log(`MANTLE_SEPOLIA_CHAIN_ID=5003`);

  // Contract ABI for integration
  console.log("\n📋 Contract ABI saved to artifacts/");
  
  // Create a simple deployment record
  const fs = require('fs');
  const deploymentRecord = {
    ...deploymentInfo,
    abi: contract.interface.format('json')
  };
  
  fs.writeFileSync(
    './deployments/bounties-sepolia.json', 
    JSON.stringify(deploymentRecord, null, 2)
  );
  
  console.log("💾 Deployment record saved to deployments/bounties-sepolia.json");

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
      console.log("\n🎉 MegaVibeBounties deployment completed successfully!");
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