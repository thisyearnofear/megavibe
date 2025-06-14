/**
 * IPFS Service
 * Handles integration with IPFS for decentralized storage of audio snippets and other data in the MegaVibe platform.
 * Uses Pinata as the IPFS pinning service for reliable data storage and retrieval.
 * Focuses on core functionality for uploading and retrieving data.
 */

const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const config = require("../config/env.cjs");

// Pinata API endpoints
const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_PIN_FILE_URL = `${PINATA_API_URL}/pinning/pinFileToIPFS`;
const PINATA_PIN_JSON_URL = `${PINATA_API_URL}/pinning/pinJSONToIPFS`;

// Headers for Pinata API requests using JWT token
const getAuthHeaders = () => ({
  Authorization: `Bearer ${config.PINATA_JWT_TOKEN}`,
  "Content-Type": "multipart/form-data",
});

// Function to check if Pinata credentials are available
function checkPinataCredentials() {
  if (!config.PINATA_JWT_TOKEN) {
    throw new Error("Pinata JWT token is not set in environment variables.");
  }
}

// Upload audio snippet to IPFS via Pinata
async function uploadAudioSnippet(filePath) {
  try {
    checkPinataCredentials();

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(PINATA_PIN_FILE_URL, formData, {
      headers: getAuthHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data && response.data.IpfsHash) {
      const cid = response.data.IpfsHash;
      console.log(`Audio snippet uploaded to IPFS with CID: ${cid}`);
      return {
        success: true,
        cid: cid,
        url: `https://ipfs.io/ipfs/${cid}`,
      };
    } else {
      throw new Error("Invalid response from Pinata API");
    }
  } catch (error) {
    console.error("Error uploading audio snippet to IPFS:", error.message);
    return {
      success: false,
      error: "Failed to upload audio snippet to IPFS",
    };
  }
}

// Retrieve audio snippet from IPFS (via public gateway)
async function getAudioSnippet(cid) {
  try {
    const url = `https://ipfs.io/ipfs/${cid}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return {
      success: true,
      data: Buffer.from(response.data),
    };
  } catch (error) {
    console.error(
      `Error retrieving audio snippet from IPFS with CID ${cid}:`,
      error.message
    );
    return {
      success: false,
      error: "Failed to retrieve audio snippet from IPFS",
    };
  }
}

// Upload metadata (e.g., for NFTs or audio details) to IPFS via Pinata
async function uploadMetadata(metadata) {
  try {
    checkPinataCredentials();

    const response = await axios.post(PINATA_PIN_JSON_URL, metadata, {
      headers: {
        Authorization: `Bearer ${config.PINATA_JWT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.IpfsHash) {
      const cid = response.data.IpfsHash;
      console.log(`Metadata uploaded to IPFS with CID: ${cid}`);
      return {
        success: true,
        cid: cid,
        url: `https://ipfs.io/ipfs/${cid}`,
      };
    } else {
      throw new Error("Invalid response from Pinata API");
    }
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error.message);
    return {
      success: false,
      error: "Failed to upload metadata to IPFS",
    };
  }
}

module.exports = {
  uploadAudioSnippet,
  getAudioSnippet,
  uploadMetadata,
};
