#!/usr/bin/env node
/**
 * FilCDN Test Script
 *
 * This script tests the FilCDN integration to ensure it's working properly.
 * It performs upload and download operations to verify end-to-end functionality.
 *
 * Usage:
 *   npm run filcdn:test
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
const TEST_FILE_SIZE = 1024; // 1KB for testing

// Format USDFC amounts (18 decimals)
function formatUSDFC(amount) {
  const usdfc = Number(amount) / 1e18;
  return usdfc.toFixed(6) + " USDFC";
}

// Format bytes to human-readable format
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Performs preflight checks to ensure sufficient USDFC balance and allowances
 */
async function performPreflightCheck(synapse, dataSize) {
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
  const filBalance = await synapse.payments.walletBalance();
  const usdfcBalance = await synapse.payments.walletBalance("USDFC");
  console.log(`FIL balance: ${Number(filBalance) / 1e18} FIL`);
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
    console.log(
      "\n❌ Insufficient allowance detected. Please run the setup script:"
    );
    console.log("npm run filcdn:setup");
    throw new Error("Insufficient allowance. Run setup script first.");
  } else {
    console.log("✅ USDFC allowance is properly configured");
    return true;
  }
}

/**
 * Test FilCDN upload and download functionality
 */
async function testFilCDN() {
  console.log("=== FilCDN Test Suite ===\n");

  // Create test data
  const testData = {
    title: "FilCDN Test Upload",
    timestamp: Date.now(),
    randomData: Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2)
    ),
    message: "If you can read this, FilCDN is working correctly!",
  };

  const testBuffer = Buffer.from(JSON.stringify(testData, null, 2));
  console.log(`Created test data: ${formatBytes(testBuffer.length)}`);

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

    // Step 2: Perform preflight checks
    await performPreflightCheck(synapse, testBuffer.length);

    // Step 3: Create storage service
    console.log("\n--- Creating Storage Service ---");
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

    // Step 4: Upload test data
    console.log("\n--- Uploading Test Data ---");
    console.log(`Uploading ${formatBytes(testBuffer.length)}...`);

    const uploadStart = Date.now();
    const uploadResult = await storage.upload(testBuffer, {
      onUploadComplete: (commp) => {
        console.log(`✅ Upload complete! CommP: ${commp}`);
      },
      onRootAdded: (transaction) => {
        if (transaction) {
          console.log(
            `✅ Root addition transaction submitted: ${transaction.hash}`
          );
          console.log("  Waiting for confirmation...");
        } else {
          console.log("✅ Root added to proof set");
        }
      },
      onRootConfirmed: (rootIds) => {
        console.log("✅ Root addition confirmed on-chain!");
        console.log(`  Assigned root IDs: ${rootIds.join(", ")}`);
      },
    });

    const uploadDuration = Date.now() - uploadStart;
    console.log(`\n✅ Upload completed in ${uploadDuration}ms`);
    console.log(`CID: ${uploadResult.commp}`);
    console.log(`Size: ${formatBytes(uploadResult.size)}`);
    console.log(`Root ID: ${uploadResult.rootId}`);

    // Step 5: Download the data back
    console.log("\n--- Downloading Test Data ---");
    console.log(`Downloading piece: ${uploadResult.commp}`);

    const downloadStart = Date.now();
    const downloadedData = await synapse.download(uploadResult.commp);
    const downloadDuration = Date.now() - downloadStart;

    console.log(`✅ Download completed in ${downloadDuration}ms`);
    console.log(`Downloaded size: ${formatBytes(downloadedData.length)}`);

    // Step 6: Verify data integrity
    console.log("\n--- Verifying Data Integrity ---");
    const originalHash = Buffer.from(testBuffer).toString("hex");
    const downloadedHash = Buffer.from(downloadedData).toString("hex");

    const dataMatches = originalHash === downloadedHash;

    if (dataMatches) {
      console.log(
        "✅ VERIFICATION SUCCESSFUL: Downloaded data matches the original!"
      );
    } else {
      console.error(
        "❌ VERIFICATION FAILED: Downloaded data does not match the original!"
      );
      throw new Error("Data integrity check failed");
    }

    // Step 7: Save test results
    const testResults = {
      success: true,
      timestamp: Date.now(),
      uploadDuration,
      downloadDuration,
      testDataSize: testBuffer.length,
      cid: uploadResult.commp,
      rootId: uploadResult.rootId,
      provider: storage.storageProvider,
      proofSetId: storage.proofSetId,
      verified: dataMatches,
    };

    // Create directory if it doesn't exist
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, "filcdn-test-results.json"),
      JSON.stringify(testResults, null, 2)
    );

    console.log("\n✅ Test results saved to data/filcdn-test-results.json");
    console.log("\n=== FilCDN Test Completed Successfully ===");
    console.log("Your FilCDN integration is working correctly!");
    console.log(
      "You can now use FilCDN for decentralized storage in your application."
    );
  } catch (error) {
    console.error("\n❌ FilCDN Test Failed:", error.message);
    if (error.cause) {
      console.error("Caused by:", error.cause.message);
    }

    if (
      error.message.includes("operator not approved") ||
      (error.cause &&
        error.cause.message &&
        error.cause.message.includes("operator not approved"))
    ) {
      console.log('\n❌ DIAGNOSIS: "Operator not approved" error detected');
      console.log(
        "Your private key is not authorized as an operator for the Pandora service."
      );
      console.log("\nTo fix this, run the setup script:");
      console.log("npm run filcdn:setup");
    }

    if (error.message.includes("Insufficient allowance")) {
      console.log("\n❌ DIAGNOSIS: Insufficient USDFC allowance");
      console.log("\nTo fix this, run the setup script:");
      console.log("npm run filcdn:setup");
    }

    process.exit(1);
  }
}

// Run the test
testFilCDN().catch(console.error);
