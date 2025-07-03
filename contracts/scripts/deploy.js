// Import required libraries
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment process...");

  // Get signers (accounts)
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Get current network
  const network = await ethers.provider.getNetwork();
  console.log(
    `Deploying to network: ${network.name} (chainId: ${network.chainId})`
  );

  // Get balance
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  try {
    // Get USDC address based on network
    const usdcAddress = getUsdcAddressByNetwork(network.chainId);
    console.log(`Using USDC address: ${usdcAddress}`);

    // Define fee recipient and emergency recovery address
    const feeRecipient = deployer.address;
    const emergencyRecoveryAddress = deployer.address;
    console.log(`Fee recipient: ${feeRecipient}`);
    console.log(`Emergency recovery address: ${emergencyRecoveryAddress}`);

    // Step 1: Deploy Reputation contract first with temporary placeholder values
    // We'll update them after deploying the other contracts
    console.log("\n1. Deploying Reputation contract...");
    const ReputationFactory = await ethers.getContractFactory("Reputation");
    const reputation = await ReputationFactory.deploy(deployer.address);
    await reputation.deployed();
    console.log(`Reputation contract deployed to: ${reputation.address}`);

    // Step 2: Deploy Tipping contract
    console.log("\n2. Deploying MegaVibeTipping contract...");
    const TippingFactory = await ethers.getContractFactory("MegaVibeTipping");
    const tipping = await TippingFactory.deploy(
      feeRecipient,
      usdcAddress,
      reputation.address,
      emergencyRecoveryAddress
    );
    await tipping.deployed();
    console.log(`MegaVibeTipping contract deployed to: ${tipping.address}`);

    // Step 3: Deploy Bounty contract
    console.log("\n3. Deploying MegaVibeBounties contract...");
    const BountyFactory = await ethers.getContractFactory("MegaVibeBounties");
    const bounty = await BountyFactory.deploy(
      feeRecipient,
      usdcAddress,
      reputation.address,
      emergencyRecoveryAddress
    );
    await bounty.deployed();
    console.log(`MegaVibeBounties contract deployed to: ${bounty.address}`);

    // Step 4: Configure Reputation contract with correct contract addresses
    console.log(
      "\n4. Configuring Reputation contract with contract addresses..."
    );
    await reputation.setTippingContract(tipping.address);
    console.log(`Set tipping contract in Reputation`);
    await reputation.setBountyContract(bounty.address);
    console.log(`Set bounty contract in Reputation`);

    // Step 5: Grant reputation manager roles
    console.log("\n5. Granting reputation manager roles...");
    // Grant deployer the reputation manager role for testing/admin
    await reputation.grantReputationManagerRole(deployer.address);
    console.log(`Granted reputation manager role to deployer`);

    // Step 6: Set initial parameters for contracts
    console.log("\n6. Setting initial parameters...");

    // If needed, adjust parameters from defaults
    // await tipping.proposePlatformFeeChange(500);
    // await bounty.proposePlatformFeeChange(500);

    console.log("\nDeployment completed successfully!");

    // Return deployed contract addresses for verification
    return {
      reputation: reputation.address,
      tipping: tipping.address,
      bounty: bounty.address,
    };
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Helper function to get USDC address by network
function getUsdcAddressByNetwork(chainId) {
  // Mainnet and well-known testnet USDC addresses
  const usdcAddresses = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum Mainnet
    5: "0x07865c6e87b9f70255377e024ace6630c1eaa37f", // Goerli Testnet
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon Mainnet
    80001: "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23", // Mumbai Testnet
    42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // Arbitrum One
    421613: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Goerli
    10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // Optimism
    420: "0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E", // Optimism Goerli
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
    84531: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Goerli
    5000: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", // Mantle
    5001: "0x0000000000000000000000000000000000000000", // Mantle Testnet (placeholder)
    // Add more networks as needed
  };

  // Return the USDC address for the given network, or a default test address
  return usdcAddresses[chainId] || "0x0000000000000000000000000000000000000000";
}

// Execute the deployment
main()
  .then((deployedContracts) => {
    console.log("\nDeployed contract addresses:");
    console.log(JSON.stringify(deployedContracts, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
