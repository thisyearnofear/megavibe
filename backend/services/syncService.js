import { ethers } from "ethers";
import TippingContractABI from "../contracts/abis/TippingContract.json";
import BountyContractABI from "../contracts/abis/BountyContract.json";
import { Tip, Bounty } from "../models/index.js";

const TIPPING_CONTRACT_ADDRESS = process.env.TIPPING_CONTRACT_ADDRESS;
const BOUNTY_CONTRACT_ADDRESS = process.env.BOUNTY_CONTRACT_ADDRESS;
const MANTLE_RPC_URL =
  process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz";

class SyncService {
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
  }

  async syncTips(fromBlock = 0) {
    console.log(`Syncing tips from block ${fromBlock}...`);

    try {
      // Get the current block number
      const currentBlock = await this.provider.getBlockNumber();

      // Query for TipSent events
      const filter = this.tippingContract.filters.TipSent();
      const events = await this.tippingContract.queryFilter(
        filter,
        fromBlock,
        currentBlock
      );

      console.log(`Found ${events.length} tip events to sync`);

      // Process each event
      for (const event of events) {
        const [sender, recipient, amount, message, timestamp] = event.args;

        // Check if this tip already exists in the database
        const existingTip = await Tip.findOne({
          transactionHash: event.transactionHash,
        });

        if (!existingTip) {
          // Save to database
          const tip = new Tip({
            sender: sender.toLowerCase(),
            recipient: recipient.toLowerCase(),
            amount: ethers.utils.formatEther(amount),
            message,
            timestamp: new Date(timestamp.toNumber() * 1000),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });

          await tip.save();
          console.log(`Synced tip: ${event.transactionHash}`);
        }
      }

      return { synced: events.length, latestBlock: currentBlock };
    } catch (error) {
      console.error("Error syncing tips:", error);
      throw error;
    }
  }

  async syncBounties(fromBlock = 0) {
    console.log(`Syncing bounties from block ${fromBlock}...`);

    try {
      // Get the current block number
      const currentBlock = await this.provider.getBlockNumber();

      // Query for BountyCreated events
      const createdFilter = this.bountyContract.filters.BountyCreated();
      const createdEvents = await this.bountyContract.queryFilter(
        createdFilter,
        fromBlock,
        currentBlock
      );

      console.log(
        `Found ${createdEvents.length} bounty creation events to sync`
      );

      // Process each creation event
      for (const event of createdEvents) {
        const [bountyId, creator, title, description, amount, deadline] =
          event.args;

        // Check if this bounty already exists in the database
        const existingBounty = await Bounty.findOne({
          bountyId: bountyId.toString(),
        });

        if (!existingBounty) {
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
            blockNumber: event.blockNumber,
          });

          await bounty.save();
          console.log(`Synced bounty creation: ${bountyId}`);
        }
      }

      // Query for BountyClaimed events
      const claimedFilter = this.bountyContract.filters.BountyClaimed();
      const claimedEvents = await this.bountyContract.queryFilter(
        claimedFilter,
        fromBlock,
        currentBlock
      );

      console.log(`Found ${claimedEvents.length} bounty claim events to sync`);

      // Process each claim event
      for (const event of claimedEvents) {
        const [bountyId, claimer, contentUrl] = event.args;

        // Update the bounty in the database
        await Bounty.findOneAndUpdate(
          { bountyId: bountyId.toString() },
          {
            status: "claimed",
            claimer: claimer.toLowerCase(),
            contentUrl,
            claimedAt: new Date(),
            claimTransactionHash: event.transactionHash,
            claimBlockNumber: event.blockNumber,
          }
        );

        console.log(`Synced bounty claim: ${bountyId}`);
      }

      return {
        synced: {
          created: createdEvents.length,
          claimed: claimedEvents.length,
        },
        latestBlock: currentBlock,
      };
    } catch (error) {
      console.error("Error syncing bounties:", error);
      throw error;
    }
  }

  async syncAll() {
    try {
      const tipSync = await this.syncTips();
      const bountySync = await this.syncBounties();

      return {
        tips: tipSync,
        bounties: bountySync,
      };
    } catch (error) {
      console.error("Error in full sync:", error);
      throw error;
    }
  }
}

export default new SyncService();
