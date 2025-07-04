#!/usr/bin/env node
/**
 * uploadEventsToFilCDN.js
 *
 * Script to upload event data to FilCDN for decentralized storage and retrieval.
 * Uses the Synapse SDK to interface with the FilCDN network.
 *
 * Usage:
 *   npm run upload:events -- --file ./data/events.json
 *   npm run upload:events:example
 */

// Convert to ESM syntax
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Synapse } from "@filoz/synapse-sdk";

// Get directory name equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define options type
/**
 * @typedef {Object} ScriptOptions
 * @property {string} [file] - Path to the events JSON file
 * @property {string} env - Path to the env file
 * @property {boolean} verbose - Enable verbose logging
 * @property {boolean} dryRun - Run in dry-run mode (no uploads)
 */

/**
 * Simple argument parser function
 * @param {string[]} args - Command line arguments
 * @returns {ScriptOptions} Parsed options
 */
function parseArgs(args) {
  const result = {
    env: ".env.local", // Default value
    verbose: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--file" || arg === "-f") {
      result.file = args[++i];
    } else if (arg === "--env" || arg === "-e") {
      result.env = args[++i];
    } else if (arg === "--verbose" || arg === "-v") {
      result.verbose = true;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    }
  }

  return result;
}

// Parse command line arguments
const options = parseArgs(process.argv.slice(2));

// Validate required options
if (!options.file) {
  console.error(
    "[ERROR] No file specified. Use --file option to specify events JSON file."
  );
  console.error(
    "Usage: node uploadEventsToFilCDN.js --file ./data/events.json [--env .env.local] [--verbose] [--dry-run]"
  );
  process.exit(1);
}

// Configure environment
dotenv.config({ path: options.env });

// Helper for BigInt-safe JSON serialization
function safeStringify(obj, indent = 0) {
  return JSON.stringify(
    obj,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    indent
  );
}

// Logger with verbosity control
const log = {
  info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
  success: (message, ...args) => console.log(`[SUCCESS] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
  verbose: (message, ...args) => {
    if (options.verbose) console.log(`[DEBUG] ${message}`, ...args);
  },
};

/**
 * FilCDN service implementation using the Synapse SDK
 */
class FilCDNUploader {
  constructor(config) {
    this.config = config;
    this.isInitialized = false;
    this.synapse = null;
    this.storageService = null;
  }

  /**
   * Initialize FilCDN service with Synapse SDK
   */
  async initialize() {
    if (this.isInitialized) {
      log.verbose("FilCDN service already initialized");
      return true;
    }

    try {
      log.verbose("Creating Synapse SDK instance...");

      if (!this.config.privateKey) {
        throw new Error("Private key is required");
      }

      // Create Synapse instance with error handling
      try {
        this.synapse = await Synapse.create({
          withCDN: this.config.withCDN,
          privateKey: this.config.privateKey,
          rpcURL: this.config.rpcURL,
        });

        log.success("Synapse SDK initialized successfully");

        // Check RPC compatibility
        const compatible = await this.testRPCCompatibility();
        if (!compatible) {
          throw new Error(
            "RPC endpoint is not compatible with required methods"
          );
        }

        // Create storage service with callbacks
        this.storageService = await this.synapse.createStorage({
          callbacks: {
            onProviderSelected: (provider) => {
              log.verbose(`Selected storage provider: ${provider.owner}`);
              log.verbose(`PDP URL: ${provider.pdpUrl}`);
            },
            onProofSetResolved: (info) => {
              if (info.isExisting) {
                log.verbose(`Using existing proof set: ${info.proofSetId}`);
              } else {
                log.verbose(`Created new proof set: ${info.proofSetId}`);
              }
            },
            onProofSetCreationStarted: (transaction, statusUrl) => {
              log.verbose(`Creating proof set, tx: ${transaction.hash}`);
              if (statusUrl) {
                log.verbose(`Status URL: ${statusUrl}`);
              }
            },
            onProofSetCreationProgress: (progress) => {
              if (progress.transactionMined && !progress.proofSetLive) {
                log.verbose(
                  "Transaction mined, waiting for proof set to be live..."
                );
              }
            },
          },
        });

        log.success("Storage service created successfully");
      } catch (error) {
        // Check for specific RPC method error
        if (
          error.message &&
          error.message.includes("method 'eth_signTypedData_v4' not found")
        ) {
          log.error(
            "RPC endpoint does not support eth_signTypedData_v4 method required by Synapse SDK"
          );
          throw new Error(
            "Incompatible RPC endpoint: eth_signTypedData_v4 method not supported"
          );
        }
        throw error;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      log.error("Failed to initialize FilCDN service:", error);
      return false;
    }
  }

  /**
   * Test if the RPC endpoint supports all required methods
   */
  async testRPCCompatibility() {
    try {
      // Test a simpler method that should always be available
      const networkId = await this.synapse.getNetwork();
      log.verbose(
        `RPC endpoint connected successfully (network: ${networkId})`
      );
      return true;
    } catch (error) {
      log.error("RPC endpoint compatibility test failed:", error);
      return false;
    }
  }

  /**
   * Store data to FilCDN
   */
  async storeData(data) {
    if (!this.isInitialized || !this.storageService) {
      throw new Error("FilCDN uploader not initialized");
    }

    try {
      // Convert data to JSON buffer using BigInt-safe serialization
      const jsonData = safeStringify(data, 0); // Compact JSON
      const buffer = Buffer.from(jsonData, "utf-8");

      log.verbose(`Data size: ${buffer.length} bytes`);

      // Check file size limit (254 MiB)
      const maxSize = 254 * 1024 * 1024; // 254 MiB in bytes
      if (buffer.length > maxSize) {
        throw new Error(
          `Data size (${buffer.length} bytes) exceeds FilCDN limit (${maxSize} bytes)`
        );
      }

      // Run preflight checks
      const preflight = await this.storageService.preflightUpload(
        buffer.length
      );
      log.verbose(`Preflight check completed: ${safeStringify(preflight)}`);

      if (!preflight.allowanceCheck.sufficient) {
        throw new Error(
          "Insufficient allowance. Please increase USDFC allowance via demo web app."
        );
      }

      // Upload to FilCDN
      log.info("Uploading data to FilCDN...");
      const uploadResult = await this.storageService.upload(buffer);

      const result = {
        cid: uploadResult.commp,
        size: buffer.length,
        timestamp: Date.now(),
      };

      log.success(`Data stored successfully with CID: ${result.cid}`);
      return result;
    } catch (error) {
      log.error("Failed to store data:", error);
      throw error;
    }
  }

  /**
   * Check if the service is ready for operations
   */
  isReady() {
    return (
      this.isInitialized &&
      this.synapse !== null &&
      this.storageService !== null
    );
  }

  /**
   * Create fallback local storage for when FilCDN upload fails
   */
  async storeDataLocally(data, errorReason) {
    try {
      // Convert data to JSON using BigInt-safe serialization
      const jsonData = safeStringify(data, 2);

      // Generate a simple mock CID
      const timestamp = Date.now().toString(16);
      const randomPart = Math.random().toString(16).slice(2, 10);
      const mockCid = `local-${timestamp}-${randomPart}`;

      // Save the data to a local file with the mock CID as filename
      const outputDir = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "data",
        "uploads"
      );
      fs.mkdirSync(outputDir, { recursive: true });

      const outputFile = path.join(outputDir, `${mockCid}.json`);
      fs.writeFileSync(outputFile, jsonData);

      log.warn(`FilCDN upload failed: ${errorReason}`);
      log.warn(`Data stored locally as fallback at: ${outputFile}`);

      return {
        cid: mockCid,
        size: Buffer.from(jsonData).length,
        timestamp: Date.now(),
        isLocal: true,
      };
    } catch (localError) {
      log.error("Failed to store data locally:", localError);
      throw localError;
    }
  }
}

/**
 * Read and parse events from JSON file
 * @param {string} filePath - Path to events JSON file
 * @returns {Promise<Array>} Array of event objects
 */
async function readEventsFromFile(filePath) {
  try {
    // In ESM, use dirname-based path resolution instead of process.cwd()
    const resolvedPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      filePath
    );
    log.verbose(`Reading events from ${resolvedPath}`);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    const data = fs.readFileSync(resolvedPath, "utf8");
    const events = JSON.parse(data);

    log.verbose(`Successfully parsed ${events.length} events`);
    return events;
  } catch (error) {
    log.error(
      `Failed to read events from file: ${error.message || String(error)}`
    );
    throw error;
  }
}

/**
 * Validate event data structure
 * @param {Array} events - Array of event objects
 * @returns {{valid: boolean, issues: string[]}} Validation result
 */
function validateEvents(events) {
  const issues = [];

  if (!Array.isArray(events)) {
    issues.push("Data is not an array");
    return { valid: false, issues };
  }

  if (events.length === 0) {
    issues.push("No events found in data");
    return { valid: false, issues };
  }

  events.forEach((event, index) => {
    if (!event.id) issues.push(`Event at index ${index} is missing an id`);
    if (!event.title) issues.push(`Event at index ${index} is missing a title`);
    if (!event.startDate)
      issues.push(`Event at index ${index} is missing a startDate`);
    if (!event.endDate)
      issues.push(`Event at index ${index} is missing an endDate`);
    if (!event.venue || !event.venue.name)
      issues.push(`Event at index ${index} is missing venue information`);
    if (!Array.isArray(event.speakers))
      issues.push(`Event at index ${index} has invalid speakers array`);
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Initialize FilCDN uploader
 * @returns {Promise<FilCDNUploader>} FilCDN uploader instance
 */
async function initializeFilCDN() {
  log.info("Initializing FilCDN service...");

  const config = {
    privateKey: process.env.FILCDN_PRIVATE_KEY || "",
    rpcURL:
      process.env.FILCDN_RPC_URL ||
      "https://api.calibration.node.glif.io/rpc/v1",
    withCDN: process.env.FILCDN_WITH_CDN === "true",
  };

  if (!config.privateKey) {
    throw new Error(
      "FILCDN_PRIVATE_KEY environment variable is required in .env.local"
    );
  }

  // Check if we should skip FilCDN and use local storage only
  const useFilCDN = process.env.VITE_USE_FILCDN === "true";
  if (!useFilCDN) {
    log.warn(
      "FilCDN is disabled (VITE_USE_FILCDN=false). Using local storage only."
    );
    // Return a minimal implementation that only uses local storage
    return {
      isReady: () => false,
      storeData: async (data) => {
        throw new Error("FilCDN is disabled");
      },
      storeDataLocally: async (data, errorReason) => {
        // Create a basic FilCDN uploader just for local storage
        const localUploader = new FilCDNUploader(config);
        return localUploader.storeDataLocally(
          data,
          "FilCDN disabled in configuration"
        );
      },
    };
  }

  const filcdn = new FilCDNUploader(config);
  try {
    const initialized = await filcdn.initialize();
    if (!initialized) {
      throw new Error("FilCDN initialization returned false");
    }
    log.success("FilCDN service initialized successfully");
    return filcdn;
  } catch (error) {
    // Check for specific operator error
    const errorMessage = error.message || String(error);
    const errorCause = error.cause
      ? error.cause.message || String(error.cause)
      : "";

    if (
      errorCause.includes("operator not approved") ||
      errorMessage.includes("operator not approved")
    ) {
      log.warn(
        "FilCDN authentication error: The private key is not authorized as an operator."
      );
      log.warn(
        "This is expected with test keys. Falling back to local storage only."
      );

      // Return a minimal implementation that only uses local storage
      return {
        isReady: () => false,
        storeData: async (data) => {
          throw new Error(
            "FilCDN authentication failed: operator not approved"
          );
        },
        storeDataLocally: async (data, errorReason) => {
          // Create a basic FilCDN uploader just for local storage
          return filcdn.storeDataLocally(
            data,
            "FilCDN authentication failed: operator not approved"
          );
        },
      };
    }

    log.error("Failed to initialize FilCDN service:", errorMessage);
    throw error;
  }
}

/**
 * Upload events to FilCDN
 * @param {Array} events - Array of event objects
 * @param {FilCDNUploader} filcdn - FilCDN uploader instance
 * @returns {Promise<string>} CID of uploaded data
 */
async function uploadEventsToFilCDN(events, filcdn) {
  log.info(`Uploading ${events.length} events to FilCDN...`);

  try {
    // Create a normalized version of the data
    const result = await filcdn.storeData(events);
    log.success(
      `Events uploaded successfully to FilCDN with CID: ${result.cid}`
    );
    log.verbose(`Upload details: ${safeStringify(result)}`);
    return result.cid;
  } catch (error) {
    log.error(
      "Failed to upload events to FilCDN:",
      error.message || String(error)
    );

    // Try to store locally as fallback
    try {
      const localResult = await filcdn.storeDataLocally(
        events,
        error.message || String(error)
      );
      log.warn(`Events stored locally with CID: ${localResult.cid}`);
      return localResult.cid;
    } catch (localError) {
      log.error(
        "Failed to store locally:",
        localError.message || String(localError)
      );
      throw error; // Throw the original error
    }
  }
}

/**
 * Update events index
 * @param {string} cid - CID of events data
 * @param {FilCDNUploader} filcdn - FilCDN uploader instance
 * @returns {Promise<void>}
 */
async function updateEventsIndex(cid, filcdn) {
  log.info("Updating events index...");

  try {
    const index = {
      latestCid: cid,
      updated: Date.now(),
    };

    let result;
    try {
      // Try to store to FilCDN
      result = await filcdn.storeData(index);
    } catch (error) {
      // Fallback to local storage
      log.warn(`Failed to update events index on FilCDN: ${error.message}`);
      result = await filcdn.storeDataLocally(index, error.message);
    }

    log.success(`Events index updated with CID: ${result.cid}`);

    // Create a local record of the index CID for reference
    const indexData = {
      eventsIndex: result.cid,
      latestEventsCid: cid,
      timestamp: Date.now(),
      isLocal: result.isLocal || false,
    };

    // Use absolute path for file writing
    fs.writeFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "data/events-index.json"
      ),
      safeStringify(indexData, 2)
    );
    log.info("Events index saved to local file: data/events-index.json");
  } catch (error) {
    log.error("Failed to update events index:", error.message || String(error));
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log.info("Starting event upload process...");

    // Read and validate event data
    const events = await readEventsFromFile(options.file);
    const validation = validateEvents(events);

    if (!validation.valid) {
      log.error("Event data validation failed:");
      validation.issues.forEach((issue) => log.error(`- ${issue}`));
      process.exit(1);
    }

    log.success(`Validated ${events.length} events`);

    // If dry run, exit here
    if (options.dryRun) {
      log.info("Dry run completed. Data is valid but was not uploaded.");
      process.exit(0);
    }

    try {
      // Initialize FilCDN (may return a local-only implementation if FilCDN is disabled)
      const filcdn = await initializeFilCDN();

      // Upload events
      const eventsCid = await uploadEventsToFilCDN(events, filcdn);

      // Update events index
      await updateEventsIndex(eventsCid, filcdn);

      log.success("Event upload process completed successfully!");
      log.info(`Events CID: ${eventsCid}`);
      log.info("You can now use this data in the MegaVibe application.");
    } catch (filCdnError) {
      // If FilCDN completely fails, try direct local storage as last resort
      log.warn(
        "FilCDN operations failed. Attempting direct local storage as last resort..."
      );

      try {
        // Create a minimal implementation for direct local storage
        const directLocalUploader = new FilCDNUploader({});

        // Store events locally
        const localEventResult = await directLocalUploader.storeDataLocally(
          events,
          `FilCDN error: ${filCdnError.message || String(filCdnError)}`
        );

        // Create and store index locally
        const indexData = {
          latestCid: localEventResult.cid,
          updated: Date.now(),
        };

        const localIndexResult = await directLocalUploader.storeDataLocally(
          indexData,
          "Using direct local storage"
        );

        // Create a local record of the index CID for reference
        const indexFileData = {
          eventsIndex: localIndexResult.cid,
          latestEventsCid: localEventResult.cid,
          timestamp: Date.now(),
          isLocal: true,
        };

        // Write to index file
        fs.writeFileSync(
          path.join(
            path.dirname(fileURLToPath(import.meta.url)),
            "..",
            "data/events-index.json"
          ),
          safeStringify(indexFileData, 2)
        );

        log.success("Event data stored locally as fallback!");
        log.info(`Local Events CID: ${localEventResult.cid}`);
        log.info(`Local Index CID: ${localIndexResult.cid}`);
        log.info("You can use this local data for development purposes.");
      } catch (localError) {
        log.error(
          "All storage methods failed:",
          localError.message || String(localError)
        );
        process.exit(1);
      }
    }
  } catch (error) {
    log.error("Event upload process failed:", error.message || String(error));
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
