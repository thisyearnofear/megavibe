#!/usr/bin/env node
/**
 * FilCDN Setup Script
 *
 * This script configures your wallet for FilCDN usage by:
 * 1. Checking USDFC balance
 * 2. Depositing USDFC if needed
 * 3. Approving the Pandora service to spend USDFC
 * 4. Creating an initial proof set
 *
 * After running this script, the "operator not approved" error should be resolved.
 */

import {
  Synapse,
  PandoraService,
  CONTRACT_ADDRESSES,
} from "@filoz/synapse-sdk";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Get directory name equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Constants
const PROOF_SET_CREATION_FEE = BigInt("5000000000000000000"); // 5 USDFC for proof set
const BUFFER_AMOUNT = BigInt("5000000000000000000"); // 5 USDFC buffer for gas fees
const MIN_DATA_SIZE = 1024; // 1KB minimum size for preflight check

// Format USDFC amounts (18 decimals)
function formatUSDFC(amount) {
  const usdfc = Number(amount) / 1e18;
  return usdfc.toFixed(6) + " USDFC";
}

/**
 * Performs preflight checks to ensure sufficient USDFC balance and allowances
 */
async function performPreflightCheck(synapse, dataSize, withProofset) {
  const network = await synapse.getNetwork();
  console.log(`Connected to Filecoin network: ${network}`);

  const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[network];
  console.log(`Pandora service address: ${pandoraAddress}`);

  const signer = synapse.getSigner();
  if (!signer || !signer.provider) {
    throw new Error("Provider not found");
  }

  const walletAddress = await signer.getAddress();
  console.log(`Your wallet address: ${walletAddress}`);

  // Initialize Pandora service for allowance checks
  const pandoraService = new PandoraService(signer.provider, pandoraAddress);

  // Check wallet balance
  const usdfcBalance = await synapse.payments.walletBalance("USDFC");
  console.log(`USDFC balance: ${formatUSDFC(usdfcBalance)}`);

  // Check if current allowance is sufficient
  console.log(`\nChecking allowance for storing ${dataSize} bytes...`);
  const preflight = await pandoraService.checkAllowanceForStorage(
    dataSize,
    process.env.FILCDN_WITH_CDN === "true",
    synapse.payments
  );

  console.log(
    `Allowance check result: ${
      preflight.sufficient ? "✅ Sufficient" : "❌ Insufficient"
    }`
  );

  // If allowance is insufficient, handle deposit and approval
  if (!preflight.sufficient) {
    // Calculate total allowance needed including proofset creation fee if required
    const proofSetCreationFee = withProofset
      ? PROOF_SET_CREATION_FEE
      : BigInt(0);
    const allowanceNeeded =
      preflight.lockupAllowanceNeeded + proofSetCreationFee + BUFFER_AMOUNT;

    console.log("\nSetting up USDFC payments:");
    console.log(
      `- Base allowance: ${formatUSDFC(preflight.lockupAllowanceNeeded)}`
    );
    if (withProofset) {
      console.log(`- Proof set fee: ${formatUSDFC(PROOF_SET_CREATION_FEE)}`);
    }
    console.log(`- Buffer amount: ${formatUSDFC(BUFFER_AMOUNT)}`);
    console.log(`- Total needed: ${formatUSDFC(allowanceNeeded)}`);

    // Check if user has enough USDFC
    if (usdfcBalance < allowanceNeeded) {
      throw new Error(
        `Insufficient USDFC balance. You have ${formatUSDFC(
          usdfcBalance
        )} but need ${formatUSDFC(allowanceNeeded)}. ` +
          `Please obtain more USDFC from a faucet or exchange.`
      );
    }

    // Step 1: Deposit USDFC to cover storage costs
    console.log("\nDepositing USDFC...");
    const depositTx = await synapse.payments.deposit(allowanceNeeded);
    console.log(`Deposit transaction hash: ${depositTx.hash}`);
    await depositTx.wait();
    console.log("✅ USDFC deposited successfully");

    // Step 2: Approve Pandora service to spend USDFC at specified rates
    console.log("\nApproving Pandora service...");
    const approveTx = await synapse.payments.approveService(
      pandoraAddress,
      preflight.rateAllowanceNeeded,
      allowanceNeeded
    );
    console.log(`Approval transaction hash: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("✅ Pandora service approved successfully");

    return true;
  } else {
    console.log("✅ Sufficient USDFC allowance already available");
    return false;
  }
}

/**
 * Creates an initial proof set to ensure full authorization
 */
async function createInitialProofSet(synapse) {
  console.log("\n--- Creating Initial Proof Set ---");

  try {
    // Create storage service with callbacks
    const storage = await synapse.createStorage({
      callbacks: {
        onProviderSelected: (provider) => {
          console.log(`✅ Selected storage provider: ${provider.owner}`);
          console.log(`  PDP URL: ${provider.pdpUrl}`);
        },
        onProofSetResolved: (info) => {
          if (info.isExisting) {
            console.log(`✅ Using existing proof set: ${info.proofSetId}`);
          } else {
            console.log(`✅ Created new proof set: ${info.proofSetId}`);
          }
        },
        onProofSetCreationStarted: (transaction, statusUrl) => {
          console.log(`Creating proof set, tx: ${transaction.hash}`);
          if (statusUrl) {
            console.log(`Status URL: ${statusUrl}`);
          }
        },
        onProofSetCreationProgress: (progress) => {
          if (progress.transactionMined && !progress.proofSetLive) {
            console.log(
              "Transaction mined, waiting for proof set to be live..."
            );
          }
        },
      },
    });

    console.log(`✅ Storage service created successfully`);
    console.log(`Storage provider: ${storage.storageProvider}`);
    console.log(`Proof set ID: ${storage.proofSetId}`);

    // Store a small test file to verify everything works
    const testData = Buffer.from(
      JSON.stringify({
        test: true,
        timestamp: Date.now(),
        message: "MegaVibe FilCDN test upload",
      })
    );

    console.log(`\nUploading test data (${testData.length} bytes)...`);
    const uploadResult = await storage.upload(testData);

    console.log("✅ Test upload successful!");
    console.log(`CID: ${uploadResult.commp}`);
    console.log(`Root ID: ${uploadResult.rootId}`);

    // Save the successful configuration to a file
    const configData = {
      status: "configured",
      timestamp: Date.now(),
      provider: storage.storageProvider,
      proofSetId: storage.proofSetId,
      testCid: uploadResult.commp,
      testRootId: uploadResult.rootId,
    };

    fs.writeFileSync(
      path.join(__dirname, "..", "data", "filcdn-config.json"),
      JSON.stringify(configData, null, 2)
    );

    console.log("\n✅ FilCDN configuration saved to data/filcdn-config.json");

    return true;
  } catch (error) {
    console.error("❌ Error creating proof set:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause.message);
    }
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("=== FilCDN Setup Tool ===\n");

  // Ensure data directory exists
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Get configuration from environment
  const privateKey = process.env.FILCDN_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const rpcURL =
    process.env.FILCDN_RPC_URL || "https://api.calibration.node.glif.io/rpc/v1";
  const withCDN = process.env.FILCDN_WITH_CDN === "true";

  if (!privateKey) {
    console.error("❌ ERROR: No private key found in environment variables");
    console.error("Please set FILCDN_PRIVATE_KEY in .env.local");
    process.exit(1);
  }

  console.log("Configuration:");
  console.log(`RPC URL: ${rpcURL}`);
  console.log(`With CDN: ${withCDN}`);
  console.log(
    `Private Key: ${privateKey.substring(0, 6)}...${privateKey.substring(
      privateKey.length - 4
    )}`
  );

  try {
    // Step 1: Create Synapse instance
    console.log("\n--- Initializing Synapse SDK ---");
    const synapse = await Synapse.create({
      privateKey: privateKey,
      rpcURL: rpcURL,
      withCDN: withCDN,
    });

    console.log("✅ Synapse SDK initialized successfully");

    // Step 2: Perform preflight checks and setup allowances
    const allowanceSetup = await performPreflightCheck(
      synapse,
      MIN_DATA_SIZE,
      true
    );
    if (allowanceSetup) {
      console.log("\n✅ USDFC allowance setup completed");
    }

    // Step 3: Create initial proof set
    const proofSetCreated = await createInitialProofSet(synapse);
    if (proofSetCreated) {
      console.log("\n✅ Initial proof set created successfully");
    }

    // Update .env.local to enable FilCDN
    console.log("\n--- Updating Configuration ---");
    const envPath = path.join(__dirname, "..", ".env.local");
    let envContent = fs.readFileSync(envPath, "utf8");

    // Update VITE_USE_FILCDN=true
    if (envContent.includes("VITE_USE_FILCDN=false")) {
      envContent = envContent.replace(
        "VITE_USE_FILCDN=false",
        "VITE_USE_FILCDN=true"
      );
      fs.writeFileSync(envPath, envContent);
      console.log("✅ Updated .env.local: VITE_USE_FILCDN=true");
    }

    console.log("\n=== FilCDN Setup Complete ===");
    console.log("Your wallet is now properly configured for FilCDN!");
    console.log("You can now use the upload script with FilCDN integration:");
    console.log("npm run upload:events:example");
  } catch (error) {
    console.error("\n❌ Error during setup:", error.message);
    if (error.cause) {
      console.error("Caused by:", error.cause.message);
    }

    console.log("\nTo continue with local storage only:");
    console.log("1. Ensure VITE_USE_FILCDN=false in .env.local");
    console.log("2. Run: npm run upload:events:example");

    process.exit(1);
  }
}

// Run the setup
main().catch(console.error);
