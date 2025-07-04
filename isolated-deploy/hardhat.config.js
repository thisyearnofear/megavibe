require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    optimismSepolia: {
      url:
        process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      chainId: 11155420,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 3000000000, // 3 gwei
    },
    unichainSepolia: {
      url: process.env.UNICHAIN_SEPOLIA_RPC || "https://1301.rpc.thirdweb.com",
      chainId: 1301,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 2500000000, // 2.5 gwei
    },
  },
  etherscan: {
    apiKey: {
      optimisticSepolia: process.env.OPTIMISM_API_KEY || "",
      // Unichain Sepolia uses Blockscout which doesn't require an API key for verification
    },
    customChains: [
      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimistic.etherscan.io",
        },
      },
      // Blockscout verification is different from Etherscan, so we may need to verify manually
      // or use a different approach for Unichain Sepolia
    ],
  },
};
