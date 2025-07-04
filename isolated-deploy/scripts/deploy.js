// SimpleReputationStandalone contract deployment script
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(
    "Deploying SimpleReputationStandalone contract to Optimism Sepolia..."
  );

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const deployerBalance = await deployer.provider.getBalance(deployer.address);
  console.log(
    `Deployer balance: ${hre.ethers.formatEther(deployerBalance)} ETH`
  );

  // Deploy SimpleReputationStandalone contract
  const SimpleReputationStandalone = await hre.ethers.getContractFactory(
    "SimpleReputationStandalone"
  );
  const simpleReputation = await SimpleReputationStandalone.deploy(
    deployer.address
  );
  await simpleReputation.waitForDeployment();

  const deployedAddress = await simpleReputation.getAddress();
  console.log(`SimpleReputationStandalone deployed to: ${deployedAddress}`);

  // Write deployment info to a file
  const deploymentInfo = {
    contractName: "SimpleReputationStandalone",
    network: "optimismSepolia",
    chainId: 11155420,
    address: deployedAddress,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployment-result.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to deployment-result.json`);

  // Update the main project's deployed-addresses.json
  try {
    const mainDeployedAddressesPath = path.join(
      __dirname,
      "../../../contracts/deployed-addresses.json"
    );
    if (fs.existsSync(mainDeployedAddressesPath)) {
      const mainDeployedAddressesRaw = fs.readFileSync(
        mainDeployedAddressesPath,
        "utf8"
      );
      const mainDeployedAddresses = JSON.parse(mainDeployedAddressesRaw);

      // Update the Optimism Sepolia address
      mainDeployedAddresses.SimpleReputation["11155420"] = {
        address: deployedAddress,
        deployedBlock: 0, // This will be updated when confirmed
        deployedDate: new Date().toISOString().split("T")[0],
        notes: "Optimism Sepolia - Deployed from standalone implementation",
      };

      // Write back to the file
      fs.writeFileSync(
        mainDeployedAddressesPath,
        JSON.stringify(mainDeployedAddresses, null, 2),
        "utf8"
      );
      console.log(
        "Main project's deployed-addresses.json updated successfully"
      );
    } else {
      console.log(
        "Main project's deployed-addresses.json not found, skipping update"
      );
    }
  } catch (error) {
    console.error(
      "Error updating main project's deployed-addresses.json:",
      error
    );
  }

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
