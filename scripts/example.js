// Example: How to interact with OMNEE Protocol
// This file demonstrates common usage patterns

const hre = require("hardhat");

async function main() {
  // Get signers
  const [owner, agent1, user1] = await hre.ethers.getSigners();
  
  console.log("Interacting with OMNEE Protocol");
  console.log("===============================\n");
  
  // 1. Deploy the Hub (which deploys omMNEE automatically)
  console.log("1. Deploying OmneeHub...");
  const OmneeHub = await hre.ethers.getContractFactory("OmneeHub");
  const hub = await OmneeHub.deploy();
  await hub.waitForDeployment();
  console.log("   Hub deployed to:", hub.target);
  
  // Get the omMNEE token address
  const omTokenAddress = await hub.omneeToken();
  console.log("   omMNEE Token at:", omTokenAddress);
  
  const OmneeToken = await hre.ethers.getContractFactory("OmneeToken");
  const omToken = OmneeToken.attach(omTokenAddress);
  
  // 2. Authorize an agent
  console.log("\n2. Authorizing agent...");
  const authTx = await hub.authorizeAgent(agent1.address);
  await authTx.wait();
  console.log("   Agent authorized:", agent1.address);
  
  // 3. Simulate MNEE deposit (Note: In production, you'd interact with real MNEE)
  console.log("\n3. Deposit Flow:");
  console.log("   [In production]");
  console.log("   a. Approve MNEE spending: mneeToken.approve(hubAddress, amount)");
  console.log("   b. Deposit and mint: hub.depositAndMint(amount, metadata)");
  
  // 4. Example metadata transfer
  console.log("\n4. Transfer with Metadata:");
  console.log("   omToken.transferWithMetadata(recipient, amount, 'Invoice #123')");
  
  // 5. Redemption flow
  console.log("\n5. Redemption Flow:");
  console.log("   hub.redeem(amount) // Burns omMNEE, returns MNEE");
  
  // 6. Cross-chain teleport
  console.log("\n6. Cross-Chain Teleport:");
  console.log("   hub.teleportFunds(amount, 'Solana', 'solana-address')");
  
  console.log("\n===============================");
  console.log("Example complete!");
  console.log("\nNote: This is a demonstration script.");
  console.log("In production, you would interact with the deployed contracts");
  console.log("and the official MNEE token at 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
