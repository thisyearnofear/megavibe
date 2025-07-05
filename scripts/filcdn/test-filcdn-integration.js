/**
 * FilCDN Integration Test
 *
 * This script tests the integration with FilCDN by:
 * 1. Uploading a small test file to FilCDN with PDP enabled
 * 2. Retrieving the file from FilCDN
 * 3. Measuring performance for both operations
 * 4. Saving the results for comparison
 */

import {
  Synapse,
  RPC_URLS,
  TOKENS,
  CONTRACT_ADDRESSES,
  PandoraService,
} from "@filoz/synapse-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Constants
const PROOF_SET_CREATION_FEE = ethers.parseUnits("5", 18); // 5 USDFC for proof set
const BUFFER_AMOUNT = ethers.parseUnits("5", 18); // 5 USDFC buffer for gas fees

// Configuration
const config = {
  privateKey: process.env.FILECOIN_PRIVATE_KEY,
  rpcURL: process.env.FILECOIN_RPC_URL || RPC_URLS.calibration.websocket,
  withCDN: true,
};

// Test data
const testData = {
  title: "MegaVibe FilCDN Test",
  content: "This is a test of the FilCDN integration for MegaVibe.",
  timestamp: Date.now(),
  testId: Math.random().toString(36).substring(2, 15),
};

/**
 * Performs preflight checks to ensure sufficient USDFC balance and allowances
 */
async function performPreflightCheck(synapse, dataSize, withProofset) {
  const network = synapse.getNetwork();
  const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[network];

  const signer = synapse.getSigner();
  if (!signer || !signer.provider) {
    throw new Error("Provider not found");
  }

  // Initialize Pandora service for allowance checks
  const pandoraService = new PandoraService(signer.provider, pandoraAddress);

  // Check if current allowance is sufficient
  const preflight = await pandoraService.checkAllowanceForStorage(
    dataSize,
    config.withCDN,
    synapse.payments
  );

  // If allowance is insufficient, handle deposit and approval
  if (!preflight.sufficient) {
    // Calculate total allowance needed including proofset creation fee if required
    const proofSetCreationFee = withProofset
      ? PROOF_SET_CREATION_FEE
      : BigInt(0);
    const allowanceNeeded =
      preflight.lockupAllowanceNeeded + proofSetCreationFee + BUFFER_AMOUNT;

    console.log("Setting up USDFC payments:");
    console.log(
      "- Base allowance:",
      ethers.formatUnits(preflight.lockupAllowanceNeeded, 18),
      "USDFC"
    );
    if (withProofset) {
      console.log(
        "- Proof set fee:",
        ethers.formatUnits(PROOF_SET_CREATION_FEE, 18),
        "USDFC"
      );
    }
    console.log(
      "- Buffer amount:",
      ethers.formatUnits(BUFFER_AMOUNT, 18),
      "USDFC"
    );
    console.log(
      "- Total needed:",
      ethers.formatUnits(allowanceNeeded, 18),
      "USDFC"
    );

    // Step 1: Deposit USDFC to cover storage costs
    console.log("Depositing USDFC...");
    await synapse.payments.deposit(allowanceNeeded);
    console.log("USDFC deposited successfully");

    // Step 2: Approve Pandora service to spend USDFC at specified rates
    console.log("Approving Pandora service...");
    await synapse.payments.approveService(
      pandoraAddress,
      preflight.rateAllowanceNeeded,
      allowanceNeeded
    );
    console.log("Pandora service approved successfully");
  } else {
    console.log("✓ Sufficient USDFC allowance already available");
  }
}

/**
 * Run the FilCDN integration test
 */
async function runTest() {
  console.log("🚀 Starting FilCDN Integration Test");
  console.log("Configuration:", {
    rpcURL: config.rpcURL,
    withCDN: config.withCDN,
  });

  const results = {
    success: false,
    timestamp: Date.now(),
    uploadDuration: 0,
    downloadDuration: 0,
    testDataSize: 0,
    cid: null,
    provider: null,
    proofSetId: null,
    verified: false,
  };

  try {
    // Initialize Synapse SDK
    console.log("Initializing Synapse SDK...");
    const synapse = await Synapse.create({
      privateKey: config.privateKey,
      rpcURL: config.rpcURL,
      withCDN: config.withCDN,
    });
    console.log("✓ Synapse SDK initialized");

    // Convert test data to Uint8Array
    const serializedData = JSON.stringify(testData);
    const data = new TextEncoder().encode(serializedData);
    results.testDataSize = data.length;

    // Perform preflight check
    await performPreflightCheck(synapse, data.length, true);

    // Create storage service
    let storage;
    let selectedProvider = {};
    let proofSetInfo = {};

    try {
      console.log("Creating storage service...");
      storage = await synapse.createStorage({
        callbacks: {
          onProviderSelected: (provider) => {
            console.log(`✓ Selected storage provider: ${provider.owner}`);
            console.log(`  PDP URL: ${provider.pdpUrl}`);
            selectedProvider = provider;
          },
          onProofSetResolved: (info) => {
            if (info.isExisting) {
              console.log(`✓ Using existing proof set: ${info.proofSetId}`);
            } else {
              console.log(`✓ Created new proof set: ${info.proofSetId}`);
            }
            proofSetInfo = info;
          },
          onProofSetCreationStarted: (transaction, statusUrl) => {
            console.log(`  Creating proof set, tx: ${transaction.hash}`);
          },
          onProofSetCreationProgress: (progress) => {
            if (progress.transactionMined && !progress.proofSetLive) {
              console.log(
                "  Transaction mined, waiting for proof set to be live..."
              );
            }
          },
        },
      });
      console.log("✓ Storage service created");
    } catch (error) {
      console.error("Storage service creation failed:", error);
      throw new Error(`Failed to create storage service: ${error.message}`);
    }

    // Upload data
    console.log("Uploading test data to FilCDN...");
    const uploadStart = Date.now();
    const uploadResult = await storage.upload(data);
    const uploadEnd = Date.now();
    results.uploadDuration = uploadEnd - uploadStart;

    console.log(`✓ Upload complete in ${results.uploadDuration}ms`);
    console.log(`  CID: ${uploadResult.commp}`);

    results.cid = uploadResult.commp;
    results.provider = selectedProvider.owner;
    results.proofSetId = proofSetInfo.proofSetId;

    // Wait a moment before download to ensure propagation
    console.log("Waiting for content to propagate...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Download data
    console.log("Downloading test data from FilCDN...");
    const downloadStart = Date.now();
    const downloadedData = await storage.providerDownload(
      uploadResult.commp.toString()
    );
    const downloadEnd = Date.now();
    results.downloadDuration = downloadEnd - downloadStart;

    console.log(`✓ Download complete in ${results.downloadDuration}ms`);

    // Verify data integrity
    const downloadedString = new TextDecoder().decode(downloadedData);
    const downloadedJson = JSON.parse(downloadedString);

    results.verified = downloadedJson.testId === testData.testId;
    console.log(
      `✓ Data verification: ${results.verified ? "Successful" : "Failed"}`
    );

    // Mark test as successful
    results.success = true;

    // Save results
    const resultsPath = path.join(
      __dirname,
      "../../data/filcdn-test-results.json"
    );
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`✓ Test results saved to ${resultsPath}`);

    console.log("🎉 FilCDN Integration Test Completed Successfully!");
    console.log("Summary:");
    console.log(`- Upload time: ${results.uploadDuration}ms`);
    console.log(`- Download time: ${results.downloadDuration}ms`);
    console.log(
      `- Speed improvement: ${
        Math.round((results.uploadDuration / results.downloadDuration) * 100) /
        100
      }x faster download`
    );

    return results;
  } catch (error) {
    console.error("❌ Test failed:", error);

    results.success = false;

    // Save failed test results
    const resultsPath = path.join(
      __dirname,
      "../../data/filcdn-test-results-failed.json"
    );
    fs.writeFileSync(
      resultsPath,
      JSON.stringify(
        {
          ...results,
          error: error.message,
        },
        null,
        2
      )
    );

    console.log(`✓ Failed test results saved to ${resultsPath}`);
    throw error;
  }
}

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run the test
// Check if this is the main module (direct execution)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Check for private key
  if (!process.env.FILECOIN_PRIVATE_KEY) {
    console.error("❌ FILECOIN_PRIVATE_KEY environment variable is required");
    process.exit(1);
  }

  runTest()
    .then((results) => {
      console.log("Test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}

// Export for use in other modules
export { runTest };
