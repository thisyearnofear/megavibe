const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Verifying MegaVibe Contracts on Mantle Mainnet...");

  // Load the latest deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");

  if (!fs.existsSync(deploymentsDir)) {
    throw new Error("❌ No deployments directory found. Please run deployment first.");
  }

  // Find the latest mainnet deployment file
  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.startsWith("mainnet-") && file.endsWith(".json") && !file.includes("failed"))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    throw new Error("❌ No successful mainnet deployment found. Please deploy contracts first.");
  }

  const latestDeploymentFile = path.join(deploymentsDir, deploymentFiles[0]);
  const deploymentInfo = JSON.parse(fs.readFileSync(latestDeploymentFile, "utf8"));

  console.log("📄 Using deployment info from:", deploymentFiles[0]);
  console.log("🕐 Deployment timestamp:", deploymentInfo.timestamp);

  if (!deploymentInfo.success) {
    throw new Error("❌ Last deployment was not successful. Cannot verify.");
  }

  const { contracts } = deploymentInfo;
  const feeRecipient = deploymentInfo.feeRecipient;

  try {
    // Verify MegaVibeTipping Contract
    console.log("\n🎯 Verifying MegaVibeTipping Contract...");
    console.log("📍 Address:", contracts.tipping.address);

    await run("verify:verify", {
      address: contracts.tipping.address,
      constructorArguments: [feeRecipient],
      contract: "contracts/MegaVibeTipping.sol:MegaVibeTipping"
    });

    console.log("✅ MegaVibeTipping verified successfully!");

    // Verify MegaVibeBounties Contract
    console.log("\n🎯 Verifying MegaVibeBounties Contract...");
    console.log("📍 Address:", contracts.bounties.address);

    await run("verify:verify", {
      address: contracts.bounties.address,
      constructorArguments: [feeRecipient],
      contract: "contracts/MegaVibeBounties.sol:MegaVibeBounties"
    });

    console.log("✅ MegaVibeBounties verified successfully!");

    console.log("\n🎉 ALL CONTRACTS VERIFIED SUCCESSFULLY!");
    console.log("\n🔗 Explorer Links:");
    console.log(`Tipping Contract: https://explorer.mantle.xyz/address/${contracts.tipping.address}`);
    console.log(`Bounties Contract: https://explorer.mantle.xyz/address/${contracts.bounties.address}`);

    // Update deployment info with verification status
    deploymentInfo.verified = true;
    deploymentInfo.verificationTimestamp = new Date().toISOString();
    fs.writeFileSync(latestDeploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n✅ Deployment info updated with verification status");

  } catch (error) {
    console.error("\n❌ Contract verification failed:");

    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contracts are already verified on the explorer");

      // Still update deployment info
      deploymentInfo.verified = true;
      deploymentInfo.verificationTimestamp = new Date().toISOString();
      deploymentInfo.verificationNote = "Already verified";
      fs.writeFileSync(latestDeploymentFile, JSON.stringify(deploymentInfo, null, 2));

      return;
    }

    if (error.message.includes("Unable to verify")) {
      console.log("\n🔄 Verification may take some time. Try again in a few minutes.");
      console.log("📝 Manual verification steps:");
      console.log("1. Go to https://explorer.mantle.xyz");
      console.log("2. Search for your contract address");
      console.log("3. Click 'Contract' tab");
      console.log("4. Click 'Verify and Publish'");
      console.log("5. Select 'Solidity (Single file)'");
      console.log("6. Upload your contract source code");
    }

    throw error;
  }
}

// Helper function to verify a single contract manually
async function verifySingleContract(contractAddress, constructorArgs, contractName) {
  console.log(`\n🔍 Verifying ${contractName}...`);
  console.log("📍 Address:", contractAddress);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      contract: `contracts/${contractName}.sol:${contractName}`
    });

    console.log(`✅ ${contractName} verified successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ ${contractName} verification failed:`, error.message);
    return false;
  }
}

// Manual verification function if automatic fails
async function manualVerify() {
  console.log("🔧 Manual Verification Mode");
  console.log("Please provide contract details for manual verification:");

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    readline.question(prompt, resolve);
  });

  try {
    const tippingAddress = await question("Enter MegaVibeTipping contract address: ");
    const bountiesAddress = await question("Enter MegaVibeBounties contract address: ");
    const feeRecipient = await question("Enter fee recipient address used in deployment: ");

    readline.close();

    console.log("\n🎯 Starting manual verification...");

    const tippingVerified = await verifySingleContract(
      tippingAddress,
      [feeRecipient],
      "MegaVibeTipping"
    );

    const bountiesVerified = await verifySingleContract(
      bountiesAddress,
      [feeRecipient],
      "MegaVibeBounties"
    );

    if (tippingVerified && bountiesVerified) {
      console.log("\n🎉 Manual verification completed successfully!");
    } else {
      console.log("\n⚠️  Some contracts failed verification. Check the errors above.");
    }

  } catch (error) {
    readline.close();
    throw error;
  }
}

// Command line argument handling
const args = process.argv.slice(2);

if (require.main === module) {
  if (args.includes("--manual")) {
    manualVerify()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Manual verification failed:", error);
        process.exit(1);
      });
  } else {
    main()
      .then(() => {
        console.log("\n🚀 Contract verification completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Verification process failed:");
        console.error(error.message);
        console.log("\n💡 Try running with --manual flag for manual verification:");
        console.log("npm run verify:manual");
        process.exit(1);
      });
  }
}

module.exports = { main, manualVerify, verifySingleContract };
