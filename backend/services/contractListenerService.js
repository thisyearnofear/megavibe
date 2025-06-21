import { ethers } from "ethers";
import TippingContractABI from "../contracts/abis/TippingContract.json";
import BountyContractABI from "../contracts/abis/BountyContract.json";
import { Tip, Bounty } from "../models/index.js";
import { io } from "../server.js";

// Contract addresses from environment variables
const TIPPING_CONTRACT_ADDRESS = process.env.TIPPING_CONTRACT_ADDRESS;
const BOUNTY_CONTRACT_ADDRESS = process.env.BOUNTY_CONTRACT_ADDRESS;
const MANTLE_RPC_URL =
  process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz";

class ContractListenerService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(MANTLE_RPC_URL);
    this.tippingContract = new ethers.Contract(
      TIPPING_CONTRACT_ADDRESS,
      TippingContractABI,
      this.provider
    );
    this.bountyContract = new ethers.Contract(
      BOUNTY_CONTRACT_ADDRESS,
      BountyContractABI,
      this.provider
    );

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for tip events
    this.tippingContract.on(
      "TipSent",
      async (sender, recipient, amount, message, timestamp, event) => {
        console.log(
          `New tip detected: ${sender} -> ${recipient}, ${ethers.utils.formatEther(
            amount
          )} MNT`
        );

        try {
          // Save to database
          const tip = new Tip({
            sender: sender.toLowerCase(),
            recipient: recipient.toLowerCase(),
            amount: ethers.utils.formatEther(amount),
            message,
            timestamp: new Date(timestamp.toNumber() * 1000),
            transactionHash: event.transactionHash,
          });

          await tip.save();

          // Emit to connected clients
          io.emit("new_tip", {
            sender: sender.toLowerCase(),
            recipient: recipient.toLowerCase(),
            amount: ethers.utils.formatEther(amount),
            message,
            timestamp: new Date(timestamp.toNumber() * 1000),
            transactionHash: event.transactionHash,
          });
        } catch (error) {
          console.error("Error processing tip event:", error);
        }
      }
    );

    // Listen for bounty events
    this.bountyContract.on(
      "BountyCreated",
      async (
        bountyId,
        creator,
        title,
        description,
        amount,
        deadline,
        event
      ) => {
        console.log(
          `New bounty created: ${bountyId} by ${creator}, ${ethers.utils.formatEther(
            amount
          )} MNT`
        );

        try {
          // Save to database
          const bounty = new Bounty({
            bountyId: bountyId.toString(),
            creator: creator.toLowerCase(),
            title,
            description,
            amount: ethers.utils.formatEther(amount),
            deadline: new Date(deadline.toNumber() * 1000),
            status: "open",
            transactionHash: event.transactionHash,
          });

          await bounty.save();

          // Emit to connected clients
          io.emit("new_bounty", {
            bountyId: bountyId.toString(),
            creator: creator.toLowerCase(),
            title,
            description,
            amount: ethers.utils.formatEther(amount),
            deadline: new Date(deadline.toNumber() * 1000),
            status: "open",
            transactionHash: event.transactionHash,
          });
        } catch (error) {
          console.error("Error processing bounty creation event:", error);
        }
      }
    );

    // Listen for bounty claim events
    this.bountyContract.on(
      "BountyClaimed",
      async (bountyId, claimer, contentUrl, event) => {
        console.log(`Bounty claimed: ${bountyId} by ${claimer}`);

        try {
          // Update in database
          await Bounty.findOneAndUpdate(
            { bountyId: bountyId.toString() },
            {
              status: "claimed",
              claimer: claimer.toLowerCase(),
              contentUrl,
              claimedAt: new Date(),
              claimTransactionHash: event.transactionHash,
            }
          );

          // Emit to connected clients
          io.emit("bounty_claimed", {
            bountyId: bountyId.toString(),
            claimer: claimer.toLowerCase(),
            contentUrl,
            claimTransactionHash: event.transactionHash,
          });
        } catch (error) {
          console.error("Error processing bounty claim event:", error);
        }
      }
    );
  }
}

export default new ContractListenerService();
