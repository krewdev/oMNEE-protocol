import hre from "hardhat";
import { ethers } from "ethers";

/**
 * Script to test faucet cooldown functionality
 * This script:
 * 1. Deploys TestMNEE and TestMNEEFaucet (with short cooldown)
 * 2. Funds the faucet
 * 3. Makes a request (should succeed)
 * 4. Tries to make another request immediately (should fail due to cooldown)
 * 5. Checks cooldown status
 */
async function main() {
  console.log("🧪 Testing Faucet Cooldown Functionality...\n");

  // Connect to network
  const networkUrl = hre.network.name === "hardhat" 
    ? "http://127.0.0.1:8545"
    : (hre.network.config?.url || "http://127.0.0.1:8545");
  
  const provider = new ethers.JsonRpcProvider(networkUrl);
  const defaultPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployer = new ethers.Wallet(defaultPrivateKey, provider);
  let nonce = await provider.getTransactionCount(deployer.address);

  console.log("Using account:", deployer.address);
  console.log("Network:", hre.network.name, "\n");

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

  // Step 2: Deploy TestMNEEFaucet with 60 second cooldown (for testing)
  console.log("\n📦 Step 2: Deploying TestMNEEFaucet with 60 second cooldown...");
  const TestMNEEFaucetFactory = await getContractFactory("TestMNEEFaucet");
  const cooldownSeconds = 60; // 1 minute for testing
  const faucet = await TestMNEEFaucetFactory.deploy(testMneeAddress, cooldownSeconds, { nonce });
  await faucet.waitForDeployment();
  nonce++;
  const faucetAddress = await faucet.getAddress();
  console.log("✅ TestMNEEFaucet deployed to:", faucetAddress);
  console.log("   Cooldown period:", cooldownSeconds, "seconds");

  // Step 3: Fund the faucet
  console.log("\n💰 Step 3: Funding faucet...");
  const fundAmount = ethers.parseEther("1000000");
  const fundTx = await testMnee.transfer(faucetAddress, fundAmount, { nonce });
  await fundTx.wait();
  nonce++;
  const faucetBalance = await testMnee.balanceOf(faucetAddress);
  console.log(`✅ Funded faucet with ${ethers.formatEther(faucetBalance)} tokens`);

  // Step 4: Check initial cooldown status
  console.log("\n⏱️  Step 4: Checking cooldown status...");
  const [canRequest1, timeUntil1] = await faucet.canRequestFaucet(deployer.address);
  console.log(`   Can request: ${canRequest1}`);
  console.log(`   Time until next request: ${timeUntil1} seconds`);

  // Step 5: Make first request (should succeed)
  console.log("\n🚰 Step 5: Making first faucet request...");
  try {
    const requestTx1 = await faucet.faucet({ nonce });
    await requestTx1.wait();
    nonce++;
    console.log("✅ First request successful!");
    
    const balance1 = await testMnee.balanceOf(deployer.address);
    console.log(`   Your balance: ${ethers.formatEther(balance1)} tokens`);
  } catch (error) {
    console.log("❌ First request failed:", error.message);
    return;
  }

  // Step 6: Try to make another request immediately (should fail)
  console.log("\n🚫 Step 6: Attempting second request immediately (should fail)...");
  try {
    const requestTx2 = await faucet.faucet({ nonce });
    await requestTx2.wait();
    console.log("❌ ERROR: Second request should have failed but didn't!");
  } catch (error) {
    if (error.message.includes("cooldown")) {
      console.log("✅ Correctly rejected - cooldown active!");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Step 7: Check cooldown status after request
  console.log("\n⏱️  Step 7: Checking cooldown status after request...");
  const [canRequest2, timeUntil2] = await faucet.canRequestFaucet(deployer.address);
  console.log(`   Can request: ${canRequest2}`);
  console.log(`   Time until next request: ${timeUntil2} seconds`);
  
  if (timeUntil2 > 0) {
    const minutes = Math.floor(timeUntil2 / 60);
    const seconds = timeUntil2 % 60;
    console.log(`   (${minutes}m ${seconds}s remaining)`);
  }

  // Step 8: Show how to reduce cooldown for faster testing
  console.log("\n💡 Step 8: Cooldown can be reduced for testing...");
  console.log("   Owner can call: faucet.setCooldown(0) to remove cooldown");
  console.log("   Or set to a shorter time like: faucet.setCooldown(10) for 10 seconds");

  console.log("\n" + "=".repeat(60));
  console.log("📝 Contract Addresses:");
  console.log("=".repeat(60));
  console.log(`VITE_FAUCET_ADDRESS=${faucetAddress}`);
  console.log(`VITE_MNEE_ADDRESS=${testMneeAddress}`);
  console.log("=".repeat(60));
  console.log("\n✅ Cooldown test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

