const { ethers } = require("hardhat");

async function mockDeploy() {
  console.log("🎭 Mock Deployment for Testing (No Real Contract Deployed)");

  // Mock contract address for testing
  const mockContractAddress = "0x742d35Cc6634C0532925a3b8D65428C2E6e6a28e";

  console.log("📍 Mock Contract Address:", mockContractAddress);
  console.log("🔗 Mock Explorer Link:", `https://explorer.sepolia.mantle.xyz/address/${mockContractAddress}`);

  // Mock deployment info
  const mockDeploymentInfo = {
    contractAddress: mockContractAddress,
    network: "mantleSepolia",
    deployer: "0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901",
    feeRecipient: "0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901",
    blockNumber: 123456,
    timestamp: new Date().toISOString(),
    platformFeeBps: "500",
    minTipAmount: "1000000000000000", // 0.001 MNT in wei
    maxMessageLength: "200",
    isMockDeployment: true
  };

  console.log("\n📝 Mock Deployment Summary:");
  console.log(JSON.stringify(mockDeploymentInfo, null, 2));

  // Environment variables for frontend
  console.log("\n🔧 Environment Variables for Frontend (.env.production):");
  console.log(`VITE_TIPPING_CONTRACT_ADDRESS=${mockContractAddress}`);
  console.log(`VITE_MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz`);
  console.log(`VITE_MANTLE_SEPOLIA_CHAIN_ID=5003`);

  // Environment variables for backend
  console.log("\n🔧 Environment Variables for Backend (.env.production):");
  console.log(`TIPPING_CONTRACT_ADDRESS=${mockContractAddress}`);
  console.log(`TIPPING_CONTRACT_NETWORK=mantleSepolia`);
  console.log(`FEE_RECIPIENT_ADDRESS=${mockDeploymentInfo.feeRecipient}`);

  console.log("\n⚠️  Note: This is a MOCK deployment for testing purposes.");
  console.log("   To deploy a real contract, fund your wallet and run: npm run deploy:sepolia");

  return {
    address: mockContractAddress,
    deploymentInfo: mockDeploymentInfo
  };
}

// Execute mock deployment
if (require.main === module) {
  mockDeploy()
    .then(() => {
      console.log("\n🎉 Mock deployment completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Mock deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = mockDeploy;
