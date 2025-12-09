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
  
  // 1. Deploy the Hub
  const QuipoHub = await ethers.getContractFactory("QuipoHub");
  const hub = await QuipoHub.deploy();
  await hub.waitForDeployment();

  console.log("QUIPO Hub deployed to:", hub.target);

  // 2. Get the address of the automatically deployed omMNEE token
  const omTokenAddress = await hub.omneeToken();
  console.log("omMNEE Token deployed to:", omTokenAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

