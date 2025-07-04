/**
 * test-cross-chain-reputation.js
 *
 * Script to test the SimpleReputation contract across multiple chains.
 * Tests Ethereum Sepolia, Optimism Sepolia, and Unichain Sepolia deployments.
 */
const { ethers } = require("ethers");
require("dotenv").config();

// Contract addresses from deployed-addresses.json - using lowercase to avoid checksum issues
const SEPOLIA_CONTRACT = "0x4b7f67dbe2731e462a4047a19b2fdf14c910afea"; // lowercase to fix checksum error
const OP_SEPOLIA_CONTRACT = "0x7877ac5c8158ab46ad608cb6990eccb2a5265718"; // lowercase to fix checksum error
const UNICHAIN_SEPOLIA_CONTRACT = process.env.UNICHAIN_SEPOLIA_CONTRACT || ""; // Will be set after deployment

// ABI for SimpleReputation contract
const SIMPLE_REPUTATION_ABI = [
  "function reputation(address user) external view returns (uint256)",
  "function increaseReputation(address user, uint256 amount) external",
  "function decreaseReputation(address user, uint256 amount) external",
  "function setReputation(address user, uint256 value) external",
  "function getMultipleReputations(address[] calldata users) external view returns (uint256[] memory)",
];

// Provider configuration
const SEPOLIA_RPC =
  process.env.SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com";
const OP_SEPOLIA_RPC =
  process.env.OP_SEPOLIA_RPC || "https://sepolia.optimism.io";
const UNICHAIN_SEPOLIA_RPC =
  process.env.UNICHAIN_SEPOLIA_RPC || "https://1301.rpc.thirdweb.com";

// Test wallet - make sure to fund this address on both chains
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("Please set PRIVATE_KEY in your environment or .env file");
  process.exit(1);
}

// Test user addresses
const TEST_ADDRESSES = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Test address 1
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Test address 2
];

/**
 * Initialize provider and contract for a specific chain
 */
async function initializeChain(rpcUrl, contractAddress) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Using lowercase address to avoid checksum validation issues with ethers.js v5
  const contract = new ethers.Contract(
    contractAddress,
    SIMPLE_REPUTATION_ABI,
    wallet
  );

  return { provider, wallet, contract };
}

/**
 * Test reputation functionality on a specific chain
 */
async function testChain(chainName, rpcUrl, contractAddress) {
  console.log(`\n----- Testing ${chainName} -----`);

  // Skip if contract address is not set
  if (!contractAddress) {
    console.log(`Contract address not set for ${chainName}, skipping...`);
    return false;
  }

  try {
    // Initialize
    const { provider, wallet, contract } = await initializeChain(
      rpcUrl,
      contractAddress
    );
    const network = await provider.getNetwork();
    const signerAddress = await wallet.getAddress();

    console.log(`Connected to ${chainName} (Chain ID: ${network.chainId})`);
    console.log(`Signer address: ${signerAddress}`);

    // Get initial reputation scores
    console.log("\nInitial reputation scores:");
    for (const address of TEST_ADDRESSES) {
      const score = await contract.reputation(address);
      console.log(`${address}: ${score.toString()}`);
    }

    // Set reputation for test address 1
    console.log("\nSetting reputation for test address 1...");
    const setTx = await contract.setReputation(TEST_ADDRESSES[0], 100);
    await setTx.wait();
    console.log("Transaction successful!");

    // Increase reputation for test address 2
    console.log("\nIncreasing reputation for test address 2...");
    const increaseTx = await contract.increaseReputation(TEST_ADDRESSES[1], 50);
    await increaseTx.wait();
    console.log("Transaction successful!");

    // Get updated reputation scores
    console.log("\nUpdated reputation scores:");
    const scores = await contract.getMultipleReputations(TEST_ADDRESSES);
    for (let i = 0; i < TEST_ADDRESSES.length; i++) {
      console.log(`${TEST_ADDRESSES[i]}: ${scores[i].toString()}`);
    }

    return true;
  } catch (error) {
    console.error(`Error testing ${chainName}:`, error);
    return false;
  }
}

/**
 * Main function to run tests
 */
async function main() {
  console.log("🚀 Testing Cross-Chain Reputation System");

  // Get which chains to test from command line arguments
  const args = process.argv.slice(2);
  const testEthereum = args.includes("--ethereum") || args.length === 0;
  const testOptimism = args.includes("--optimism") || args.length === 0;
  const testUnichain = args.includes("--unichain") || args.length === 0;

  // Test results
  let sepoliaSuccess = false;
  let opSepoliaSuccess = false;
  let unichainSepoliaSuccess = false;

  // Test Ethereum Sepolia
  if (testEthereum) {
    sepoliaSuccess = await testChain(
      "Ethereum Sepolia",
      SEPOLIA_RPC,
      SEPOLIA_CONTRACT
    );
  }

  // Test Optimism Sepolia
  if (testOptimism) {
    opSepoliaSuccess = await testChain(
      "Optimism Sepolia",
      OP_SEPOLIA_RPC,
      OP_SEPOLIA_CONTRACT
    );
  }

  // Test Unichain Sepolia
  if (testUnichain && UNICHAIN_SEPOLIA_CONTRACT) {
    unichainSepoliaSuccess = await testChain(
      "Unichain Sepolia",
      UNICHAIN_SEPOLIA_RPC,
      UNICHAIN_SEPOLIA_CONTRACT
    );
  } else if (testUnichain) {
    console.log("\n----- Testing Unichain Sepolia -----");
    console.log(
      "Unichain Sepolia contract address not set in environment. Please deploy first."
    );
  }

  // Summary
  console.log("\n----- Test Summary -----");
  if (testEthereum) {
    console.log(
      `Ethereum Sepolia: ${sepoliaSuccess ? "✅ Success" : "❌ Failed"}`
    );
  }
  if (testOptimism) {
    console.log(
      `Optimism Sepolia: ${opSepoliaSuccess ? "✅ Success" : "❌ Failed"}`
    );
  }
  if (testUnichain) {
    console.log(
      `Unichain Sepolia: ${
        unichainSepoliaSuccess
          ? "✅ Success"
          : "❌ Not Tested (Contract address not set)"
      }`
    );
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
