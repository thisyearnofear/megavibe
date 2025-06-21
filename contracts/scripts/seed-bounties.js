const { ethers } = require("hardhat");

// --- Configuration ---
const BOUNTY_CONTRACT_ADDRESS = "0xf6D9428094bD1EF3427c8f0bBce6A4068B900b5F";
const EVENT_ID = "devcon-7-bangkok"; // A default event ID for the bounties

// --- Sample Bounty Data ---
const sampleBounties = [
  {
    speakerId: "vitalik-buterin",
    description:
      "Create a 5-minute summary video of the keynote speech on 'The Future of Ethereum'.",
    reward: "1.5", // in MNT
    deadlineDays: 7,
  },
  {
    speakerId: "sandeep-nailwal",
    description:
      "Write a detailed blog post about the 'Scaling Solutions' panel, comparing the different approaches discussed.",
    reward: "2.0",
    deadlineDays: 5,
  },
  {
    speakerId: "general-devcon",
    description:
      "Design a high-quality infographic summarizing the main takeaways from the first day of Devcon.",
    reward: "1.0",
    deadlineDays: 3,
  },
  {
    speakerId: "hayden-adams",
    description:
      "Develop a short, animated explainer (under 60 seconds) of the new features announced for Uniswap v4.",
    reward: "3.5",
    deadlineDays: 10,
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`🌱 Seeding bounties from account: ${deployer.address}`);
  console.log(
    `💰 Account balance: ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} MNT`
  );
  console.log(`----------------------------------------------------`);

  const MegaVibeBounties = await ethers.getContractAt(
    "MegaVibeBounties",
    BOUNTY_CONTRACT_ADDRESS
  );

  console.log(
    `✅ Attached to MegaVibeBounties contract at: ${BOUNTY_CONTRACT_ADDRESS}`
  );

  for (const bounty of sampleBounties) {
    try {
      const deadline =
        Math.floor(Date.now() / 1000) + bounty.deadlineDays * 24 * 60 * 60;
      const rewardInWei = ethers.parseEther(bounty.reward);

      console.log(`\nCreating bounty: "${bounty.description}"`);
      console.log(`  - Reward: ${bounty.reward} MNT`);
      console.log(`  - Speaker: ${bounty.speakerId}`);

      const tx = await MegaVibeBounties.createBounty(
        EVENT_ID,
        bounty.speakerId,
        bounty.description,
        deadline,
        { value: rewardInWei }
      );

      const receipt = await tx.wait();
      const bountyId = receipt.logs[0].args[0]; // Get bountyId from the event log

      console.log(`  ✅ Bounty created successfully! (ID: ${bountyId})`);
      console.log(`  🔗 Transaction hash: ${tx.hash}`);
    } catch (error) {
      console.error(
        `  ❌ Failed to create bounty for "${bounty.speakerId}":`,
        error.message
      );
    }
  }

  console.log(`\n----------------------------------------------------`);
  console.log("🎉 Bounty seeding complete!");
  const totalBounties = await MegaVibeBounties.getTotalBounties();
  console.log(`📈 Total bounties in contract: ${totalBounties}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
