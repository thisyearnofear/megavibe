/**
 * deploy-unichain.js
 *
 * Script to deploy the SimpleReputationStandalone contract to Unichain Sepolia
 */
require("dotenv").config({ path: ".env.unichain" });
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleReputationStandalone to Unichain Sepolia...");

  // Get the owner address from .env or use default
  const owner =
    process.env.OWNER_ADDRESS || "0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901";
  console.log(`Using owner address: ${owner}`);

  // Get contract factory
  const SimpleReputation = await hre.ethers.getContractFactory(
    "SimpleReputationStandalone"
  );
  console.log("Deploying contract...");

  // Deploy using a simple approach that works with different ethers versions
  const tx = await SimpleReputation.deploy(owner);
  console.log(
    "Deployment transaction sent:",
    tx.address || tx.deploymentTransaction?.hash
  );

  let contractAddress;

  // Handle different versions of ethers
  if (tx.address) {
    // ethers v5
    contractAddress = tx.address;
  } else if (tx.getAddress) {
    // ethers v6
    contractAddress = await tx.getAddress();
  } else {
    // fallback
    contractAddress = tx.deployTransaction?.creates || tx.target;
    console.log("Using fallback method to get address");
  }

  console.log(`SimpleReputationStandalone deployed to: ${contractAddress}`);

  // Update the deployed-addresses.json file in the parent directory
  const deployedAddressesPath = path.join(
    __dirname,
    "..",
    "..",
    "contracts",
    "deployed-addresses.json"
  );

  let deployedAddresses = {};

  // Read the existing file if it exists
  if (fs.existsSync(deployedAddressesPath)) {
    const fileContent = fs.readFileSync(deployedAddressesPath, "utf8");
    deployedAddresses = JSON.parse(fileContent);
  }

  // Make sure the simpleReputation object exists
  if (!deployedAddresses.simpleReputation) {
    deployedAddresses.simpleReputation = {};
  }

  // Update the address for Unichain Sepolia
  deployedAddresses.simpleReputation.unichainSepolia = contractAddress;

  // Write the updated file
  fs.writeFileSync(
    deployedAddressesPath,
    JSON.stringify(deployedAddresses, null, 2)
  );

  console.log(`Updated deployed addresses in ${deployedAddressesPath}`);
  console.log("Deployment to Unichain Sepolia complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
