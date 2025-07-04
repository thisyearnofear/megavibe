#!/usr/bin/env node
/**
 * FilCDN Diagnostic Tool
 *
 * This script diagnoses issues with FilCDN connectivity and permissions,
 * specifically checking for the common "operator not approved" error.
 *
 * It will check:
 * 1. If your private key is valid
 * 2. If your wallet has sufficient USDFC balance
 * 3. If you've approved USDFC spending for the Payments contract
 * 4. If you've approved the Pandora service as an operator
 */

import { Synapse } from "@filoz/synapse-sdk";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Get directory name equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Format USDFC amounts (18 decimals)
function formatUSDFC(amount) {
  const usdfc = Number(amount) / 1e18;
  return usdfc.toFixed(6) + " USDFC";
}

async function diagnose() {
  console.log("=== FilCDN Diagnostic Tool ===\n");

  // Get configuration from environment
  const privateKey = process.env.FILCDN_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const rpcURL =
    process.env.FILCDN_RPC_URL ||
    process.env.RPC_URL ||
    "https://api.calibration.node.glif.io/rpc/v1";

  if (!privateKey) {
    console.error("❌ ERROR: No private key found in environment variables");
    console.error("Please set FILCDN_PRIVATE_KEY or PRIVATE_KEY in .env.local");
    process.exit(1);
  }

  console.log("Checking configuration:");
  console.log(`RPC URL: ${rpcURL}`);
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
      withCDN: true,
    });

    console.log("✅ Synapse SDK initialized successfully");

    // Get wallet info
    const signer = synapse.getSigner();
    const address = await signer.getAddress();
    console.log(`Wallet address: ${address}`);

    // Step 2: Check balances
    console.log("\n--- Checking Balances ---");
    try {
      const filBalance = await synapse.payments.walletBalance();
      const usdfcBalance = await synapse.payments.walletBalance("USDFC");
      console.log(`FIL balance: ${Number(filBalance) / 1e18} FIL`);
      console.log(`USDFC balance: ${formatUSDFC(usdfcBalance)}`);

      if (Number(usdfcBalance) <= 0) {
        console.log("❌ WARNING: No USDFC balance detected");
        console.log(
          "You need USDFC tokens to pay for storage. Request from the FilCDN faucet."
        );
      } else {
        console.log("✅ USDFC balance available");
      }
    } catch (error) {
      console.error("❌ Failed to check balances:", error.message);
      if (error.cause) console.error("  Cause:", error.cause.message);
    }

    // Step 3: Check allowances
    console.log("\n--- Checking Allowances ---");
    try {
      const allowance = await synapse.payments.allowance();
      console.log(`USDFC allowance: ${formatUSDFC(allowance)}`);

      if (Number(allowance) <= 0) {
        console.log(
          "❌ WARNING: No USDFC allowance set for the Payments contract"
        );
        console.log(
          "This means you cannot pay for storage. Approve USDFC spending first."
        );
      } else {
        console.log("✅ USDFC spending allowance is set");
      }
    } catch (error) {
      console.error("❌ Failed to check allowances:", error.message);
      if (error.cause) console.error("  Cause:", error.cause.message);
    }

    // Step 4: Try to create storage service to check operator approval
    console.log("\n--- Checking Operator Approval ---");
    try {
      // Create storage service
      const storageService = await synapse.createStorage();
      console.log("✅ Successfully created storage service");
      console.log(`Storage provider: ${storageService.storageProvider}`);
      console.log(`Proof set ID: ${storageService.proofSetId}`);
      console.log("\nYour private key is properly authorized as an operator");
    } catch (error) {
      console.error("❌ Failed to create storage service:", error.message);

      if (error.cause) {
        console.error("  Cause:", error.cause.message);

        if (error.cause.message.includes("operator not approved")) {
          console.log('\n❌ DIAGNOSIS: "Operator not approved" error detected');
          console.log(
            "Your private key is not authorized as an operator for the Pandora service."
          );
          console.log(
            "This is the most common cause of FilCDN upload failures."
          );
          console.log("\nTo fix this:");
          console.log(
            "1. Ensure you're using a valid private key with USDFC tokens"
          );
          console.log(
            "2. Visit the FilCDN demo app and approve your wallet as an operator"
          );
          console.log(
            "3. Or for development, set VITE_USE_FILCDN=false in .env.local to use local storage"
          );
        }
      }
    }

    console.log("\n=== Diagnostic Complete ===");
  } catch (error) {
    console.error("\n❌ Error initializing Synapse:", error.message);
    if (error.cause) console.error("Caused by:", error.cause.message);
  }
}

// Run the diagnostic
diagnose().catch(console.error);
