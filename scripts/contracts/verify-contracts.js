/**
 * verify-contracts.js
 *
 * Script to verify the SimpleReputation contracts on block explorers
 */
require("dotenv").config();
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load deployed addresses
const deployedAddressesPath = path.join(
  __dirname,
  "..",
  "deployed-addresses.json"
);
const deployedAddresses = JSON.parse(
  fs.readFileSync(deployedAddressesPath, "utf8")
);

// Owner address used during deployment
const OWNER_ADDRESS =
  process.env.OWNER_ADDRESS || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// Contract addresses
const SEPOLIA_ADDRESS = deployedAddresses.simpleReputation.sepolia;
const OP_SEPOLIA_ADDRESS = deployedAddresses.simpleReputation.optimismSepolia;

console.log("SimpleReputation Contract Verification");
console.log("=====================================");
console.log(`Ethereum Sepolia: ${SEPOLIA_ADDRESS}`);
console.log(`Optimism Sepolia: ${OP_SEPOLIA_ADDRESS}`);
console.log(`Owner address: ${OWNER_ADDRESS}`);
console.log();

/**
 * Verify contract on Ethereum Sepolia
 */
function verifySepoliaContract() {
  console.log("Verifying contract on Ethereum Sepolia...");
  try {
    // Use Hardhat's verify task
    const command = `npx hardhat verify --network sepolia ${SEPOLIA_ADDRESS} "${OWNER_ADDRESS}"`;
    console.log(`Running: ${command}`);
    const output = execSync(command, { cwd: path.join(__dirname, "..") });
    console.log(output.toString());
    console.log("✅ Verification successful on Ethereum Sepolia");
  } catch (error) {
    console.error("❌ Verification failed on Ethereum Sepolia:");
    console.error(error.message);
  }
}

/**
 * Verify contract on Optimism Sepolia
 * (Uses the isolated-deploy directory)
 */
function verifyOptimismSepoliaContract() {
  console.log("Verifying contract on Optimism Sepolia...");
  try {
    // Use Hardhat's verify task from the isolated-deploy directory
    const command = `npx hardhat verify --network optimism-sepolia ${OP_SEPOLIA_ADDRESS} "${OWNER_ADDRESS}"`;
    console.log(`Running: ${command}`);
    const output = execSync(command, {
      cwd: path.join(__dirname, "..", "..", "isolated-deploy"),
    });
    console.log(output.toString());
    console.log("✅ Verification successful on Optimism Sepolia");
  } catch (error) {
    console.error("❌ Verification failed on Optimism Sepolia:");
    console.error(error.message);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--sepolia") || args.length === 0) {
    verifySepoliaContract();
  }

  if (args.includes("--optimism") || args.length === 0) {
    console.log();
    verifyOptimismSepoliaContract();
  }

  console.log("\nVerification process completed.");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
