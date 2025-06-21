#!/usr/bin/env node

/**
 * MegaVibe Production Health Check Script
 *
 * Monitors the health of deployed MegaVibe infrastructure:
 * - Smart contract deployment and functionality
 * - Frontend accessibility and performance
 * - Backend API health and database connectivity
 * - Real-time WebSocket connections
 *
 * Usage: node scripts/health-check.js [--verbose] [--json]
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Configuration
const CONFIG = {
  contracts: {
    rpcUrl: "https://rpc.mantle.xyz",
    chainId: 5000,
    explorerUrl: "https://explorer.mantle.xyz",
  },
  frontend: {
    url: import.meta.env.FRONTEND_URL || "https://megavibe.xyz",
    timeout: 10000,
  },
  backend: {
    url: import.meta.env.BACKEND_URL || "https://api.megavibe.xyz",
    timeout: 10000,
  },
  websocket: {
    url: import.meta.env.WS_URL || "wss://api.megavibe.xyz",
    timeout: 10000,
  },
  thresholds: {
    responseTime: 2000, // 2 seconds
    availability: 99.0, // 99% uptime
  },
};

// Utility functions
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  debug: (msg) => import.meta.env.VERBOSE && console.log(`🔍 ${msg}`),
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// HTTP request utility
const httpRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = url.startsWith("https") ? https : http;

    const req = client.request(
      url,
      {
        method: "GET",
        timeout: options.timeout || 10000,
        ...options,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const endTime = Date.now();
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
            responseTime: endTime - startTime,
          });
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => reject(new Error("Request timeout")));
    req.end();
  });
};

// Load deployment information
function loadDeploymentInfo() {
  const deploymentsDir = path.join(__dirname, "../contracts/deployments");

  if (!fs.existsSync(deploymentsDir)) {
    throw new Error("No deployments directory found");
  }

  const deploymentFiles = fs
    .readdirSync(deploymentsDir)
    .filter(
      (file) =>
        file.startsWith("mainnet-") &&
        file.endsWith(".json") &&
        !file.includes("failed")
    )
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    throw new Error("No successful mainnet deployment found");
  }

  const latestFile = path.join(deploymentsDir, deploymentFiles[0]);
  return JSON.parse(fs.readFileSync(latestFile, "utf8"));
}

// Smart contract health checks
async function checkSmartContracts() {
  log.info("Checking smart contract health...");

  try {
    const deploymentInfo = loadDeploymentInfo();
    const { contracts } = deploymentInfo;

    const results = {
      tipping: await checkContract(
        contracts.tipping.address,
        "MegaVibeTipping"
      ),
      bounties: await checkContract(
        contracts.bounties.address,
        "MegaVibeBounties"
      ),
      deployment: {
        timestamp: deploymentInfo.timestamp,
        network: deploymentInfo.network,
        deployer: deploymentInfo.deployer,
        verified: deploymentInfo.verified || false,
      },
    };

    const allHealthy = results.tipping.healthy && results.bounties.healthy;

    if (allHealthy) {
      log.success("Smart contracts are healthy");
    } else {
      log.warning("Some smart contracts have issues");
    }

    return { healthy: allHealthy, details: results };
  } catch (error) {
    log.error(`Smart contract check failed: ${error.message}`);
    return { healthy: false, error: error.message };
  }
}

async function checkContract(address, name) {
  log.debug(`Checking contract ${name} at ${address}`);

  try {
    // Check if contract has code (basic deployment check)
    const codeCheckUrl = `${CONFIG.contracts.explorerUrl}/api?module=proxy&action=eth_getCode&address=${address}&tag=latest`;

    const response = await httpRequest(codeCheckUrl, { timeout: 5000 });
    const data = JSON.parse(response.data);

    if (response.statusCode !== 200) {
      throw new Error(`Explorer API returned ${response.statusCode}`);
    }

    const hasCode = data.result && data.result !== "0x";

    if (!hasCode) {
      throw new Error("Contract has no code deployed");
    }

    log.debug(`Contract ${name} has code deployed`);

    return {
      healthy: true,
      address,
      name,
      hasCode: true,
      explorerUrl: `${CONFIG.contracts.explorerUrl}/address/${address}`,
    };
  } catch (error) {
    log.error(`Contract ${name} check failed: ${error.message}`);
    return {
      healthy: false,
      address,
      name,
      error: error.message,
    };
  }
}

// Frontend health checks
async function checkFrontend() {
  log.info("Checking frontend health...");

  try {
    const startTime = Date.now();
    const response = await httpRequest(CONFIG.frontend.url, {
      timeout: CONFIG.frontend.timeout,
    });
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    const isHealthy =
      response.statusCode === 200 &&
      responseTime < CONFIG.thresholds.responseTime;

    if (isHealthy) {
      log.success(`Frontend is healthy (${responseTime}ms)`);
    } else {
      log.warning(
        `Frontend health issues: ${response.statusCode}, ${responseTime}ms`
      );
    }

    return {
      healthy: isHealthy,
      url: CONFIG.frontend.url,
      statusCode: response.statusCode,
      responseTime,
      contentLength: response.data.length,
      details: {
        hasReactApp:
          response.data.includes("react") || response.data.includes("vite"),
        hasTitle: response.data.includes("<title>"),
        hasMetaTags: response.data.includes("<meta"),
      },
    };
  } catch (error) {
    log.error(`Frontend check failed: ${error.message}`);
    return {
      healthy: false,
      url: CONFIG.frontend.url,
      error: error.message,
    };
  }
}

// Backend health checks
async function checkBackend() {
  log.info("Checking backend health...");

  try {
    // Check main health endpoint
    const healthUrl = `${CONFIG.backend.url}/health`;
    const startTime = Date.now();

    const response = await httpRequest(healthUrl, {
      timeout: CONFIG.backend.timeout,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let healthData = {};
    try {
      healthData = JSON.parse(response.data);
    } catch (e) {
      // If not JSON, check if it's a simple OK response
      healthData = { status: response.data.trim() };
    }

    const isHealthy =
      response.statusCode === 200 &&
      responseTime < CONFIG.thresholds.responseTime;

    if (isHealthy) {
      log.success(`Backend is healthy (${responseTime}ms)`);
    } else {
      log.warning(
        `Backend health issues: ${response.statusCode}, ${responseTime}ms`
      );
    }

    return {
      healthy: isHealthy,
      url: CONFIG.backend.url,
      statusCode: response.statusCode,
      responseTime,
      healthData,
    };
  } catch (error) {
    log.error(`Backend check failed: ${error.message}`);
    return {
      healthy: false,
      url: CONFIG.backend.url,
      error: error.message,
    };
  }
}

// Database health check (through backend)
async function checkDatabase() {
  log.info("Checking database connectivity...");

  try {
    const dbHealthUrl = `${CONFIG.backend.url}/health/database`;
    const response = await httpRequest(dbHealthUrl, {
      timeout: 5000,
    });

    let dbData = {};
    try {
      dbData = JSON.parse(response.data);
    } catch (e) {
      dbData = { status: response.data.trim() };
    }

    const isHealthy = response.statusCode === 200;

    if (isHealthy) {
      log.success("Database is healthy");
    } else {
      log.warning("Database health issues");
    }

    return {
      healthy: isHealthy,
      statusCode: response.statusCode,
      details: dbData,
    };
  } catch (error) {
    log.warning(`Database check failed: ${error.message}`);
    return {
      healthy: false,
      error: error.message,
      note: "Database health endpoint may not be implemented",
    };
  }
}

// WebSocket health check
async function checkWebSocket() {
  log.info("Checking WebSocket connectivity...");

  try {
    // This is a basic check - in a real implementation, you'd use a WebSocket library
    const wsUrl = CONFIG.websocket.url
      .replace("wss://", "https://")
      .replace("ws://", "http://");
    const response = await httpRequest(wsUrl, {
      timeout: 5000,
      headers: {
        Upgrade: "websocket",
        Connection: "Upgrade",
      },
    });

    // WebSocket upgrade should return 101, but we'll check for server response
    const isHealthy =
      response.statusCode === 101 || response.statusCode === 400; // 400 is expected for HTTP->WS upgrade

    if (isHealthy) {
      log.success("WebSocket endpoint is accessible");
    } else {
      log.warning("WebSocket endpoint may have issues");
    }

    return {
      healthy: isHealthy,
      url: CONFIG.websocket.url,
      statusCode: response.statusCode,
      note: "Basic connectivity check only",
    };
  } catch (error) {
    log.warning(`WebSocket check failed: ${error.message}`);
    return {
      healthy: false,
      url: CONFIG.websocket.url,
      error: error.message,
      note: "WebSocket health endpoint may not be implemented",
    };
  }
}

// Overall system health assessment
async function assessSystemHealth(results) {
  log.info("Assessing overall system health...");

  const components = [
    { name: "Smart Contracts", result: results.contracts },
    { name: "Frontend", result: results.frontend },
    { name: "Backend", result: results.backend },
    { name: "Database", result: results.database },
    { name: "WebSocket", result: results.websocket },
  ];

  const healthyComponents = components.filter((c) => c.result.healthy).length;
  const totalComponents = components.length;
  const healthPercentage = (healthyComponents / totalComponents) * 100;

  const overallHealthy = healthPercentage >= CONFIG.thresholds.availability;

  const assessment = {
    healthy: overallHealthy,
    healthPercentage,
    healthyComponents,
    totalComponents,
    components: components.map((c) => ({
      name: c.name,
      healthy: c.result.healthy,
      status: c.result.healthy ? "OK" : "DEGRADED",
    })),
    timestamp: new Date().toISOString(),
  };

  if (overallHealthy) {
    log.success(`System is healthy (${healthPercentage.toFixed(1)}%)`);
  } else {
    log.warning(`System health is degraded (${healthPercentage.toFixed(1)}%)`);
  }

  return assessment;
}

// Generate health report
function generateHealthReport(results, assessment) {
  const report = {
    timestamp: new Date().toISOString(),
    overall: assessment,
    components: results,
    recommendations: [],
  };

  // Generate recommendations based on results
  if (!results.contracts.healthy) {
    report.recommendations.push(
      "Check smart contract deployment and network connectivity"
    );
  }

  if (!results.frontend.healthy) {
    report.recommendations.push(
      "Verify frontend deployment and CDN configuration"
    );
  }

  if (!results.backend.healthy) {
    report.recommendations.push(
      "Check backend server status and API endpoints"
    );
  }

  if (!results.database.healthy) {
    report.recommendations.push("Verify database connectivity and performance");
  }

  if (!results.websocket.healthy) {
    report.recommendations.push("Check WebSocket server configuration");
  }

  return report;
}

// Main health check function
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const jsonOutput = args.includes("--json");

  if (verbose) {
    import.meta.env.VERBOSE = "true";
  }

  console.log("🏥 MegaVibe Health Check");
  console.log("═".repeat(40));

  try {
    const startTime = Date.now();

    // Run all health checks
    const results = {
      contracts: await checkSmartContracts(),
      frontend: await checkFrontend(),
      backend: await checkBackend(),
      database: await checkDatabase(),
      websocket: await checkWebSocket(),
    };

    const assessment = await assessSystemHealth(results);
    const report = generateHealthReport(results, assessment);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log("\n📊 Health Check Results:");
      console.log(`⏱️  Total time: ${totalTime}ms`);
      console.log(
        `🎯 Overall health: ${assessment.healthPercentage.toFixed(1)}%`
      );
      console.log(
        `✅ Healthy components: ${assessment.healthyComponents}/${assessment.totalComponents}`
      );

      if (report.recommendations.length > 0) {
        console.log("\n💡 Recommendations:");
        report.recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. ${rec}`);
        });
      }
    }

    // Exit with appropriate code
    process.exit(assessment.healthy ? 0 : 1);
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);

    if (jsonOutput) {
      console.log(
        JSON.stringify({
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      );
    }

    process.exit(1);
  }
}

// Handle process signals
process.on("SIGINT", () => {
  log.warning("Health check interrupted");
  process.exit(1);
});

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkSmartContracts,
  checkFrontend,
  checkBackend,
  checkDatabase,
  checkWebSocket,
  assessSystemHealth,
  generateHealthReport,
};
