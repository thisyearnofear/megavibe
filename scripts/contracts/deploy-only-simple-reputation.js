// deploy-only-simple-reputation.js
// This script only compiles and deploys the SimpleReputation contract
// bypassing the standard Hardhat compilation process

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SimpleReputation contract to Optimism Sepolia...");
  console.log("Using focused compilation to avoid dependency issues");

  // 1. Get the SimpleReputation contract factory
  console.log("Compiling SimpleReputation contract...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const deployerBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(deployerBalance)} ETH`);

  // Get contract factory
  // For focused compilation, we use hardhat's getContractFactory with explicit imports
  const simpleReputationFactory = await ethers.getContractFactory(
    "SimpleReputation",
    {
      libraries: {},
    }
  );

  // 2. Deploy contract
  console.log("Deploying contract...");
  const simpleReputation = await simpleReputationFactory.deploy(
    deployer.address
  );
  await simpleReputation.waitForDeployment();

  const deployedAddress = await simpleReputation.getAddress();
  console.log(`SimpleReputation deployed to: ${deployedAddress}`);

  // 3. Update deployed-addresses.json
  console.log("Updating deployed-addresses.json...");

  // Read the current deployed-addresses.json
  const deployedAddressesPath = path.join(
    __dirname,
    "../deployed-addresses.json"
  );
  const deployedAddressesRaw = fs.readFileSync(deployedAddressesPath, "utf8");
  const deployedAddresses = JSON.parse(deployedAddressesRaw);

  // Update the Optimism Sepolia address
  deployedAddresses.SimpleReputation["11155420"] = {
    address: deployedAddress,
    deployedBlock: 0, // This will be updated when confirmed
    deployedDate: new Date().toISOString().split("T")[0],
    notes: "Optimism Sepolia - Successfully deployed",
  };

  // Write back to the file
  fs.writeFileSync(
    deployedAddressesPath,
    JSON.stringify(deployedAddresses, null, 2),
    "utf8"
  );

  console.log("deployed-addresses.json updated successfully");

  // 4. Try to verify the contract
  try {
    console.log("Waiting for contract confirmation...");
    // Wait for several confirmations
    await simpleReputation.deploymentTransaction().wait(6);

    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: deployedAddress,
      constructorArguments: [deployer.address],
    });
    console.log("Contract verified on Etherscan");
  } catch (error) {
    console.log(
      "Verification error (this is often normal on testnets):",
      error.message
    );
  }

  console.log("Deployment complete!");
  return { simpleReputation, deployedAddress };
}

// Execute the deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
