/**
 * Mantle Service
 * Handles integration with Mantle blockchain for smart contracts related to tipping and bounties in the MegaVibe platform.
 * Uses viem for blockchain interactions with Mantle Mainnet via Alchemy RPC endpoint.
 * Authentication is handled via Dynamic in the frontend, with necessary wallet details passed to the backend.
 */

const {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
  parseEther,
} = require("viem");
const { mainnet } = require("viem/chains");
const config = require("../config/env.cjs");

// Mantle Mainnet RPC endpoint via Alchemy
const MANTLE_RPC_URL =
  "https://mantle-mainnet.g.alchemy.com/v2/ELsVQvVFLWI9WHNrNlnOU1kNffsZxZqV";

// Placeholder for contract addresses (to be updated after deployment)
const TIPPING_CONTRACT_ADDRESS =
  config.MANTLE_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";
const BOUNTY_CONTRACT_ADDRESS =
  config.MANTLE_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// ABI for Tipping and Bounty contracts (simplified for core functionality)
const TIPPING_ABI = [
  {
    name: "sendTip",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "message", type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
];

const BOUNTY_ABI = [
  {
    name: "createBounty",
    type: "function",
    inputs: [{ name: "songId", type: "string" }],
    outputs: [],
    stateMutability: "payable",
  },
];

// Configure Mantle Mainnet chain
const mantleChain = {
  ...mainnet,
  id: 5000, // Mantle Mainnet chain ID
  name: "Mantle Mainnet",
  network: "mantle",
  rpcUrls: {
    default: { http: [MANTLE_RPC_URL] },
    public: { http: [MANTLE_RPC_URL] },
  },
};

// Initialize public client for read-only operations
const publicClient = createPublicClient({
  chain: mantleChain,
  transport: http(MANTLE_RPC_URL),
});

// Initialize connection to Mantle blockchain
async function initializeConnection() {
  try {
    // Check if we can connect to the Mantle blockchain
    const blockNumber = await publicClient.getBlockNumber();
    console.log(
      `Connected to Mantle blockchain. Current block number: ${blockNumber}`
    );
    return {
      success: true,
      contractAddress: TIPPING_CONTRACT_ADDRESS,
      message: `Connected to Mantle Mainnet at block ${blockNumber}`,
    };
  } catch (error) {
    console.error("Error connecting to Mantle blockchain:", error.message);
    return {
      success: false,
      error: "Failed to connect to Mantle blockchain",
    };
  }
}

// Send a tip to an artist
async function sendTip(toAddress, amount, fromPrivateKey) {
  try {
    // Validate inputs
    if (!toAddress || !amount || amount <= 0) {
      throw new Error("Invalid tip parameters");
    }

    // Create wallet client for transaction signing
    const walletClient = createWalletClient({
      chain: mantleChain,
      transport: http(MANTLE_RPC_URL),
      account: fromPrivateKey, // Private key passed from frontend or securely stored
    });

    const amountInWei = parseEther(amount.toString());

    // Prepare and send transaction
    const hash = await walletClient.writeContract({
      address: TIPPING_CONTRACT_ADDRESS,
      abi: TIPPING_ABI,
      functionName: "sendTip",
      args: [toAddress, "Tip from MegaVibe user"],
      value: amountInWei,
    });

    console.log(`Tip transaction sent with hash: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      console.log(
        `Tip of ${amount} MNT sent successfully to ${toAddress}. Transaction hash: ${hash}`
      );
      return {
        success: true,
        transactionId: hash,
      };
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.error(`Error sending tip to ${toAddress}:`, error.message);
    return {
      success: false,
      error: "Failed to send tip",
    };
  }
}

// Create a bounty for a song request
async function createBounty(songId, amount, fromPrivateKey) {
  try {
    // Validate inputs
    if (!songId || !amount || amount <= 0) {
      throw new Error("Invalid bounty parameters");
    }

    // Create wallet client for transaction signing
    const walletClient = createWalletClient({
      chain: mantleChain,
      transport: http(MANTLE_RPC_URL),
      account: fromPrivateKey, // Private key passed from frontend or securely stored
    });

    const amountInWei = parseEther(amount.toString());

    // Prepare and send transaction
    const hash = await walletClient.writeContract({
      address: BOUNTY_CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "createBounty",
      args: [songId],
      value: amountInWei,
    });

    console.log(`Bounty transaction sent with hash: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      console.log(
        `Bounty of ${amount} MNT created successfully for song ${songId}. Transaction hash: ${hash}`
      );
      return {
        success: true,
        bountyId: hash, // In a real implementation, we'd parse logs to get the actual bounty ID
      };
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.error(`Error creating bounty for song ${songId}:`, error.message);
    return {
      success: false,
      error: "Failed to create bounty",
    };
  }
}

module.exports = {
  initializeConnection,
  sendTip,
  createBounty,
};
