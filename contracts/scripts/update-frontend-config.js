/**
 * Update Frontend Config Script
 *
 * This script reads contract addresses from deployed-addresses.json
 * and updates the frontend configuration with the deployed contract addresses.
 *
 * Usage:
 * node update-frontend-config.js [--dry-run]
 *
 * Options:
 * --dry-run    Show changes without modifying files
 */

const fs = require("fs");
const path = require("path");

// File paths
const DEPLOYED_ADDRESSES_PATH = path.join(
  __dirname,
  "../deployed-addresses.json"
);
const FRONTEND_CONFIG_PATH = path.join(
  __dirname,
  "../../frontend/src/config/chains.ts"
);

// Read command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

// Main function
async function main() {
  try {
    console.log(
      "🔄 Updating frontend configuration with deployed contract addresses..."
    );

    // Read deployed addresses
    const deployedAddressesRaw = fs.readFileSync(
      DEPLOYED_ADDRESSES_PATH,
      "utf8"
    );
    const deployedAddresses = JSON.parse(deployedAddressesRaw);

    // Read frontend config
    let frontendConfigContent = fs.readFileSync(FRONTEND_CONFIG_PATH, "utf8");

    // Process each contract
    for (const [contractName, chainAddresses] of Object.entries(
      deployedAddresses
    )) {
      console.log(`\nProcessing ${contractName} contract addresses:`);

      // Process each chain
      for (const [chainId, deploymentInfo] of Object.entries(chainAddresses)) {
        const { address, notes } = deploymentInfo;

        // Skip empty addresses
        if (!address || address === "") {
          console.log(
            `  ⚠️ Chain ${chainId} (${notes}): No address provided - skipping`
          );
          continue;
        }

        console.log(`  🔗 Chain ${chainId} (${notes}): ${address}`);

        // Create regex pattern to find and replace address in config
        // Looking for patterns like: SimpleReputationContract: '0x...'
        const addressRegex = new RegExp(
          `(${contractName}Contract\\s*:\\s*['"])([^'"]*)(\\s*['"])`,
          "g"
        );

        // Check if the contract address exists in the configuration for this chain
        const chainConfigRegex = new RegExp(
          `id:\\s*${chainId}[\\s\\S]*?contractAddresses:\\s*{[\\s\\S]*?}`,
          "g"
        );
        const chainConfigMatch = frontendConfigContent.match(chainConfigRegex);

        if (chainConfigMatch) {
          if (chainConfigMatch[0].includes(`${contractName}Contract`)) {
            // Replace existing address
            const updatedContent = chainConfigMatch[0].replace(
              addressRegex,
              `$1${address}$3`
            );

            frontendConfigContent = frontendConfigContent.replace(
              chainConfigMatch[0],
              updatedContent
            );

            console.log(
              `    ✅ Updated existing ${contractName}Contract address`
            );
          } else {
            // Add new contract address entry
            const contractAddressesRegex = new RegExp(
              `(contractAddresses:\\s*{[\\s\\S]*?)(})`,
              "g"
            );
            const updatedContent = chainConfigMatch[0].replace(
              contractAddressesRegex,
              `$1    ${contractName}Contract: '${address}',\n  $2`
            );

            frontendConfigContent = frontendConfigContent.replace(
              chainConfigMatch[0],
              updatedContent
            );

            console.log(`    ✅ Added new ${contractName}Contract address`);
          }
        } else {
          console.log(
            `    ❌ Chain ID ${chainId} not found in frontend configuration`
          );
        }
      }
    }

    // Write updated config back to file
    if (!isDryRun) {
      fs.writeFileSync(FRONTEND_CONFIG_PATH, frontendConfigContent, "utf8");
      console.log("\n✅ Frontend configuration updated successfully!");
    } else {
      console.log("\n🔍 Dry run completed. No files were modified.");
    }
  } catch (error) {
    console.error("❌ Error updating frontend configuration:", error);
    process.exit(1);
  }
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
