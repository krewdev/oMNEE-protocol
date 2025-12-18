import hre from "hardhat";
import { ethers } from "ethers";

/**
 * Complete faucet setup script for local testing
 * This script:
 * 1. Deploys TestMNEE token
 * 2. Deploys MNEEFaucet
 * 3. Funds the faucet with test tokens
 * 4. Outputs environment variables
 */
async function main() {
  console.log("🚀 Setting up faucet for local testing...\n");

  // Workaround: Use ethers directly - connect to Hardhat's network
  // For hardhat network, use the default RPC URL
  // For localhost, connect to the running node
  const networkUrl = hre.network.name === "hardhat" 
    ? "http://127.0.0.1:8545"  // Hardhat's default (though hardhat network is in-process)
    : (hre.network.config?.url || "http://127.0.0.1:8545");
  
  const provider = new ethers.JsonRpcProvider(networkUrl);
  
  // Hardhat's default first account private key
  const defaultPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployer = new ethers.Wallet(defaultPrivateKey, provider);
  
  // Get current nonce to avoid nonce issues
  let nonce = await provider.getTransactionCount(deployer.address);
  
  console.log("Deploying with account:", deployer.address);
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");
  
  // Get contract factories using artifacts
  const getContractFactory = async (contractName) => {
    const artifact = await hre.artifacts.readArtifact(contractName);
    return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  };

  // Step 1: Deploy TestMNEE
  console.log("📦 Step 1: Deploying TestMNEE token...");
  const TestMNEEFactory = await getContractFactory("TestMNEE");
  const testMnee = await TestMNEEFactory.deploy({ nonce });
  await testMnee.waitForDeployment();
  nonce++; // Increment for next transaction
  const testMneeAddress = await testMnee.getAddress();
  console.log("✅ TestMNEE deployed to:", testMneeAddress);

  // Step 2: Deploy MNEEFaucet
  console.log("\n📦 Step 2: Deploying MNEEFaucet...");
  const MNEEFaucetFactory = await getContractFactory("MNEEFaucet");
  const faucet = await MNEEFaucetFactory.deploy(testMneeAddress, { nonce });
  await faucet.waitForDeployment();
  nonce++; // Increment for next transaction
  const faucetAddress = await faucet.getAddress();
  console.log("✅ MNEEFaucet deployed to:", faucetAddress);

  // Step 3: Fund the faucet
  console.log("\n💰 Step 3: Funding faucet with test tokens...");
  const fundAmount = ethers.parseEther("1000000"); // 1M test tokens
  const tx = await testMnee.transfer(faucetAddress, fundAmount, { nonce });
  await tx.wait();
  console.log(`✅ Funded faucet with ${ethers.formatEther(fundAmount)} test tokens`);

  // Verify balance
  const faucetBalance = await testMnee.balanceOf(faucetAddress);
  console.log(`✅ Faucet balance: ${ethers.formatEther(faucetBalance)} test tokens`);

  // Step 4: Output environment variables
  console.log("\n" + "=".repeat(60));
  console.log("📝 Add these to your frontend/.env file:");
  console.log("=".repeat(60));
  console.log(`VITE_FAUCET_ADDRESS=${faucetAddress}`);
  console.log(`VITE_MNEE_ADDRESS=${testMneeAddress}`);
  console.log("=".repeat(60));

  console.log("\n✅ Faucet setup complete!");
  console.log("\n💡 Next steps:");
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

