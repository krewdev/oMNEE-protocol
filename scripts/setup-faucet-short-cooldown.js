import hre from "hardhat";
import { ethers } from "ethers";

/**
 * Setup script for faucet with short cooldown (for testing)
 * This deploys TestMNEEFaucet with a configurable short cooldown period
 */
async function main() {
  const cooldownSeconds = process.env.FAUCET_COOLDOWN_SECONDS 
    ? parseInt(process.env.FAUCET_COOLDOWN_SECONDS) 
    : 60; // Default to 60 seconds for testing

  console.log(`🚀 Setting up faucet with ${cooldownSeconds} second cooldown for testing...\n`);

  // Connect to network
  const networkUrl = hre.network.name === "hardhat" 
    ? "http://127.0.0.1:8545"
    : (hre.network.config?.url || "http://127.0.0.1:8545");
  
  const provider = new ethers.JsonRpcProvider(networkUrl);
  const defaultPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployer = new ethers.Wallet(defaultPrivateKey, provider);
  let nonce = await provider.getTransactionCount(deployer.address);

  console.log("Deploying with account:", deployer.address);
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get contract factories
  const getContractFactory = async (contractName) => {
    const artifact = await hre.artifacts.readArtifact(contractName);
    return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  };

  // Step 1: Deploy TestMNEE
  console.log("📦 Step 1: Deploying TestMNEE token...");
  const TestMNEEFactory = await getContractFactory("TestMNEE");
  const testMnee = await TestMNEEFactory.deploy({ nonce });
  await testMnee.waitForDeployment();
  nonce++;
  const testMneeAddress = await testMnee.getAddress();
  console.log("✅ TestMNEE deployed to:", testMneeAddress);

  // Step 2: Deploy TestMNEEFaucet with short cooldown
  console.log(`\n📦 Step 2: Deploying TestMNEEFaucet with ${cooldownSeconds} second cooldown...`);
  const TestMNEEFaucetFactory = await getContractFactory("TestMNEEFaucet");
  const faucet = await TestMNEEFaucetFactory.deploy(testMneeAddress, cooldownSeconds, { nonce });
  await faucet.waitForDeployment();
  nonce++;
  const faucetAddress = await faucet.getAddress();
  console.log("✅ TestMNEEFaucet deployed to:", faucetAddress);

  // Step 3: Fund the faucet
  console.log("\n💰 Step 3: Funding faucet with test tokens...");
  const fundAmount = ethers.parseEther("1000000");
  const tx = await testMnee.transfer(faucetAddress, fundAmount, { nonce });
  await tx.wait();
  nonce++;
  const faucetBalance = await testMnee.balanceOf(faucetAddress);
  console.log(`✅ Funded faucet with ${ethers.formatEther(faucetBalance)} test tokens`);

  // Step 4: Output environment variables
  console.log("\n" + "=".repeat(60));
  console.log("📝 Add these to your frontend/.env file:");
  console.log("=".repeat(60));
  console.log(`VITE_FAUCET_ADDRESS=${faucetAddress}`);
  console.log(`VITE_MNEE_ADDRESS=${testMneeAddress}`);
  console.log("=".repeat(60));

  console.log("\n✅ Faucet setup complete!");
  console.log(`\n💡 Cooldown: ${cooldownSeconds} seconds (${cooldownSeconds / 60} minutes)`);
  console.log("   To change cooldown, owner can call: faucet.setCooldown(seconds)");
  console.log("\n📝 Next steps:");
  console.log("1. Copy the environment variables above to frontend/.env");
  console.log("2. Restart your frontend dev server");
  console.log("3. Connect your wallet and request tokens from the faucet!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

