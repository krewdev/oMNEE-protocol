// Example: How to interact with QUIPO Protocol
// This file demonstrates common usage patterns

async function main() {
  // Import hardhat - with @nomicfoundation/hardhat-ethers v4, ethers is available
  // directly when scripts run, accessed through the runtime environment
  const hardhatModule = await import("hardhat");
  
  // Try to access ethers - it should be injected by the plugin when Hardhat runs
  // If direct import doesn't work, we'll construct it manually
  let ethers;
  
  try {
    // The plugin should make ethers available, try multiple access patterns
    ethers = hardhatModule.ethers || 
             hardhatModule.default?.ethers || 
             (await hardhatModule.default)?.ethers;
  } catch (e) {
    // Fall through to manual construction
  }
  
  if (!ethers) {
    // Manual construction: use ethers.js directly with Hardhat's artifacts and provider
    const hre = hardhatModule.default || hardhatModule;
    const { ethers: ethersLib } = await import("ethers");
    
    // Get signers from Hardhat's network
    const provider = new ethersLib.JsonRpcProvider(
      hre.network.config?.url || "http://127.0.0.1:8545"
    );
    
    // Use Hardhat's default accounts
    const defaultAccount = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const signer = new ethersLib.Wallet(defaultAccount, provider);
    
    ethers = {
      getContractFactory: async (name) => {
        const artifact = await hre.artifacts.readArtifact(name);
        return new ethersLib.ContractFactory(artifact.abi, artifact.bytecode, signer);
      },
      getSigners: async () => [signer],
    };
  }
  
  // Get signers
  const [owner, agent1, user1] = await ethers.getSigners();
  
  console.log("Interacting with QUIPO Protocol");
  console.log("===============================\n");
  
  // 1. Deploy the Hub (which deploys omMNEE automatically)
  console.log("1. Deploying QuipoHub...");
  const QuipoHub = await ethers.getContractFactory("QuipoHub");
  const hub = await QuipoHub.deploy();
  await hub.waitForDeployment();
  console.log("   Hub deployed to:", hub.target);
  
  // Get the omMNEE token address
  const omTokenAddress = await hub.omneeToken();
  console.log("   omMNEE Token at:", omTokenAddress);
  
  const OmneeToken = await ethers.getContractFactory("OmneeToken");
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

