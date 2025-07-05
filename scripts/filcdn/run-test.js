/**
 * Run FilCDN Integration Test
 *
 * This script runs the FilCDN integration test and displays the results.
 * It loads environment variables from a .env file in the project root.
 */

import dotenv from "dotenv";
import { runTest } from "./test-filcdn-integration.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Initialize dotenv
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for required environment variables
if (!process.env.FILECOIN_PRIVATE_KEY) {
  console.error("❌ FILECOIN_PRIVATE_KEY environment variable is required");
  console.log(
    "Please make sure you have a .env file with the required variables:"
  );
  console.log("FILECOIN_PRIVATE_KEY=your_private_key_here");
  console.log(
    "FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1 (optional)"
  );
  process.exit(1);
}

console.log("🧪 Starting FilCDN Integration Test");
console.log("==================================");
console.log("");

// Run the test
runTest()
  .then((results) => {
    console.log("");
    console.log("🎉 Test completed successfully!");
    console.log("==================================");
    console.log("");
    console.log("📊 Results Summary:");
    console.log(`- Content Size: ${results.testDataSize} bytes`);
    console.log(`- Upload Time: ${results.uploadDuration}ms`);
    console.log(`- Download Time: ${results.downloadDuration}ms`);
    console.log(
      `- Speed Improvement: ${
        Math.round((results.uploadDuration / results.downloadDuration) * 100) /
        100
      }x faster download`
    );
    console.log(
      `- CID: ${
        typeof results.cid === "object" ? results.cid["/"] : results.cid
      }`
    );
    console.log(`- Provider: ${results.provider}`);
    console.log(`- Proof Set ID: ${results.proofSetId}`);
    console.log(`- Data Verified: ${results.verified ? "Yes ✓" : "No ✗"}`);

    // Compare with previous results if available
    const previousResultsPath = path.join(
      __dirname,
      "../../data/filcdn-test-results.json"
    );
    if (fs.existsSync(previousResultsPath)) {
      try {
        const previousResults = JSON.parse(
          fs.readFileSync(previousResultsPath, "utf8")
        );
        console.log("");
        console.log("📈 Comparison with Previous Test:");
        console.log(
          `- Previous Upload Time: ${previousResults.uploadDuration}ms`
        );
        console.log(
          `- Previous Download Time: ${previousResults.downloadDuration}ms`
        );
        console.log(
          `- Upload Time Difference: ${
            results.uploadDuration - previousResults.uploadDuration
          }ms`
        );
        console.log(
          `- Download Time Difference: ${
            results.downloadDuration - previousResults.downloadDuration
          }ms`
        );
      } catch (err) {
        console.warn("Could not compare with previous results:", err.message);
      }
    }

    console.log("");
    console.log("🚀 Next Steps:");
    console.log("1. Review the test results");
    console.log("2. Implement the FilCDN service in the frontend");
    console.log("3. Connect it to the UI components");

    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("❌ Test failed:");
    console.error(error);
    console.error("");
    console.error("Troubleshooting:");
    console.error("1. Check that your FILECOIN_PRIVATE_KEY is correct");
    console.error("2. Ensure you have sufficient USDFC tokens");
    console.error("3. Verify the RPC endpoint is accessible");
    console.error("4. Try running with --verbose flag for more details");
    process.exit(1);
  });
