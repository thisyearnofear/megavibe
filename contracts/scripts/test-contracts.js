const { ethers } = require("hardhat");

async function testContracts() {
  console.log("🧪 Testing deployed contracts...");

  // Contract addresses
  const addresses = {
    SimpleReputation: "0x53628a5d15cfFac8C8F6c95b76b4FA436C7eaD1A",
    MegaVibeBounties: "0xA78d4FcDaee13A11c11AEaD7f3a68CD15E8CB722",
    MegaVibeTipping: "0x86D7cD141775f866403161974fB941F39F4C38Ef",
  };

  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);

  try {
    // Test SimpleReputation
    const SimpleReputation = await ethers.getContractFactory(
      "SimpleReputation"
    );
    const reputation = SimpleReputation.attach(addresses.SimpleReputation);

    const userReputation = await reputation.reputation(signer.address);
    console.log(
      "✅ SimpleReputation - User reputation:",
      userReputation.toString()
    );

    // Test MegaVibeBounties
    const MegaVibeBounties = await ethers.getContractFactory(
      "MegaVibeBounties"
    );
    const bounties = MegaVibeBounties.attach(addresses.MegaVibeBounties);

    const totalBounties = await bounties.getTotalBounties();
    console.log(
      "✅ MegaVibeBounties - Total bounties:",
      totalBounties.toString()
    );

    const contractParams = await bounties.getContractParameters();
    console.log(
      "✅ MegaVibeBounties - Platform fee:",
      contractParams[0].toString(),
      "bps"
    );
    console.log(
      "✅ MegaVibeBounties - Min bounty amount:",
      contractParams[1].toString()
    );

    // Test MegaVibeTipping
    const MegaVibeTipping = await ethers.getContractFactory("MegaVibeTipping");
    const tipping = MegaVibeTipping.attach(addresses.MegaVibeTipping);

    const totalTips = await tipping.getTotalTips();
    console.log("✅ MegaVibeTipping - Total tips:", totalTips.toString());

    const tippingParams = await tipping.getContractParameters();
    console.log(
      "✅ MegaVibeTipping - Platform fee:",
      tippingParams[0].toString(),
      "bps"
    );
    console.log(
      "✅ MegaVibeTipping - Min tip amount:",
      tippingParams[1].toString()
    );

    console.log("\n🎉 All contracts are functioning correctly!");
    console.log("\n📊 Contract Summary:");
    console.log("   SimpleReputation:", addresses.SimpleReputation);
    console.log("   MegaVibeBounties:", addresses.MegaVibeBounties);
    console.log("   MegaVibeTipping:", addresses.MegaVibeTipping);
    console.log("\n🔗 Explorer Links:");
    console.log(
      "   SimpleReputation: https://explorer.sepolia.mantle.xyz/address/" +
        addresses.SimpleReputation
    );
    console.log(
      "   MegaVibeBounties: https://explorer.sepolia.mantle.xyz/address/" +
        addresses.MegaVibeBounties
    );
    console.log(
      "   MegaVibeTipping: https://explorer.sepolia.mantle.xyz/address/" +
        addresses.MegaVibeTipping
    );
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    throw error;
  }
}

// Execute the test
if (require.main === module) {
  testContracts()
    .then(() => {
      console.log("\n✅ Contract testing completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Contract testing failed:", error);
      process.exit(1);
    });
}

module.exports = testContracts;
