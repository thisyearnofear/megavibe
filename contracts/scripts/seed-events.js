const { ethers } = require("hardhat");
const {
  experienceEvents,
} = require("../../backend/server/data/cryptoEventsSeed.cjs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Populating events using account:", deployer.address);

  const eventContractAddress = "0x3332Af8198A2b7382153f0F21f94216540c98598";
  console.log(`Using EventContract at: ${eventContractAddress}`);

  const EventContract = await ethers.getContractFactory("EventContract");
  const eventContract = EventContract.attach(eventContractAddress);

  for (const event of experienceEvents) {
    try {
      const tx = await eventContract.createEvent(
        event.name,
        event.description,
        Math.floor(new Date(event.dates.start).getTime() / 1000),
        event.venue
      );
      await tx.wait();
      console.log(`Event "${event.name}" has been added to the contract.`);
    } catch (error) {
      console.error(`Failed to add event "${event.name}":`, error);
    }
  }

  console.log("Event seeding complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
