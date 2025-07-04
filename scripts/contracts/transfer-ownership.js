const { ethers } = require("hardhat");

async function main() {
  const eventContractAddress = "0x3332Af8198A2b7382153f0F21f94216540c98598";
  const newOwner = "0x8502d079f93AEcdaC7B0Fe71Fa877721995f1901";

  console.log(
    `Requesting to transfer ownership of contract at: ${eventContractAddress}`
  );
  console.log(`New owner address: ${newOwner}`);

  const EventContract = await ethers.getContractFactory("EventContract");
  const eventContract = EventContract.attach(eventContractAddress);

  // This transaction MUST be executed by the current owner of the contract.
  const transaction = await eventContract.transferOwnership(newOwner);
  await transaction.wait();

  console.log("Ownership transferred successfully!");
  console.log(`The new owner of the contract is now: ${newOwner}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to transfer ownership:", error);
    process.exit(1);
  });
