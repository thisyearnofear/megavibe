// SimpleReputation contract deployment script
const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleReputation contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const deployerBalance = await deployer.provider.getBalance(deployer.address);
  console.log(
    `Deployer balance: ${hre.ethers.formatEther(deployerBalance)} ETH`
  );

  // Deploy SimpleReputation contract
  const SimpleReputation = await hre.ethers.getContractFactory(
    "SimpleReputation"
  );
  const simpleReputation = await SimpleReputation.deploy(deployer.address);
  await simpleReputation.waitForDeployment();

  const deployedAddress = await simpleReputation.getAddress();
  console.log(`SimpleReputation deployed to: ${deployedAddress}`);

  // Verify contract on Etherscan (if not on a local network)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    // Wait for 6 confirmations to ensure the contract is mined
    await simpleReputation.deploymentTransaction().wait(6);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: deployedAddress,
        constructorArguments: [deployer.address],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.error("Error verifying contract on Etherscan:", error);
    }
  }

  console.log("Deployment complete!");

  // Return the contract instance and address for testing purposes
  return { simpleReputation, deployedAddress };
}

// Execute the deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
