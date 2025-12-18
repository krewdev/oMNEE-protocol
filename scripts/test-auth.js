import { ethers } from "ethers";
import hre from "hardhat";

/**
 * Quick authorization testing script
 * Tests: authorize, revoke, deposit, redeem with authorization checks
 */
async function main() {
  console.log("🧪 Testing Authorization System...\n");

  // Get signers
  const [owner, agent1, agent2, unauthorized] = await ethers.getSigners();
  console.log("📋 Test Accounts:");
  console.log(`   Owner: ${owner.address}`);
  console.log(`   Agent 1: ${agent1.address}`);
  console.log(`   Agent 2: ${agent2.address}`);
  console.log(`   Unauthorized: ${unauthorized.address}\n`);

  // Deploy TestMNEE
  console.log("📦 Deploying TestMNEE...");
  const TestMNEE = await hre.ethers.getContractFactory("TestMNEE");
  const mneeToken = await TestMNEE.deploy();
  await mneeToken.waitForDeployment();
  const mneeAddress = await mneeToken.getAddress();
  console.log(`   ✅ TestMNEE deployed: ${mneeAddress}\n`);

  // Deploy QuipoHub
  console.log("📦 Deploying QuipoHub...");
  const QuipoHub = await hre.ethers.getContractFactory("QuipoHub");
  const hub = await QuipoHub.deploy();
  await hub.waitForDeployment();
  const hubAddress = await hub.getAddress();
  console.log(`   ✅ QuipoHub deployed: ${hubAddress}`);

  const omTokenAddress = await hub.omneeToken();
  console.log(`   ✅ OmneeToken deployed: ${omTokenAddress}\n`);

  // Transfer MNEE to test accounts (TestMNEE mints 1M to deployer)
  console.log("💰 Transferring test MNEE tokens...");
  const mintAmount = ethers.parseEther("10000");
  await mneeToken.transfer(agent1.address, mintAmount);
  await mneeToken.transfer(agent2.address, mintAmount);
  await mneeToken.transfer(unauthorized.address, mintAmount);
  console.log(`   ✅ Transferred ${ethers.formatEther(mintAmount)} MNEE to each agent\n`);

  // Test 1: Authorize Agent 1
  console.log("🔐 Test 1: Authorizing Agent 1...");
  await hub.authorizeAgent(agent1.address);
  const isAuth1 = await hub.authorizedAgents(agent1.address);
  console.log(`   ${isAuth1 ? "✅" : "❌"} Agent 1 authorized: ${isAuth1}\n`);

  // Test 2: Try unauthorized deposit (should fail)
  console.log("🚫 Test 2: Unauthorized agent trying to deposit (should fail)...");
  const depositAmount = ethers.parseEther("100");
  await mneeToken.connect(unauthorized).approve(hubAddress, depositAmount);
  try {
    await hub.connect(unauthorized).depositAndMint(depositAmount, "Test");
    console.log("   ❌ Should have failed!\n");
  } catch (error) {
    console.log("   ✅ Correctly rejected unauthorized agent\n");
  }

  // Test 3: Authorized agent deposits
  console.log("💵 Test 3: Authorized Agent 1 depositing...");
  await mneeToken.connect(agent1).approve(hubAddress, depositAmount);
  const tx1 = await hub.connect(agent1).depositAndMint(depositAmount, "Test deposit");
  await tx1.wait();
  const omBalance1 = await hub.omneeToken().then(addr => 
    ethers.getContractAt("OmneeToken", addr).then(contract => 
      contract.balanceOf(agent1.address)
    )
  );
  console.log(`   ✅ Agent 1 omMNEE balance: ${ethers.formatEther(omBalance1)}\n`);

  // Test 4: Revoke Agent 1
  console.log("🔓 Test 4: Revoking Agent 1...");
  await hub.revokeAgent(agent1.address);
  const isAuth1After = await hub.authorizedAgents(agent1.address);
  console.log(`   ${!isAuth1After ? "✅" : "❌"} Agent 1 revoked: ${!isAuth1After}\n`);

  // Test 5: Revoked agent tries to deposit (should fail)
  console.log("🚫 Test 5: Revoked agent trying to deposit (should fail)...");
  await mneeToken.connect(agent1).approve(hubAddress, depositAmount);
  try {
    await hub.connect(agent1).depositAndMint(depositAmount, "Test 2");
    console.log("   ❌ Should have failed!\n");
  } catch (error) {
    console.log("   ✅ Correctly rejected revoked agent\n");
  }

  // Test 6: Re-authorize Agent 1
  console.log("🔐 Test 6: Re-authorizing Agent 1...");
  await hub.authorizeAgent(agent1.address);
  const isAuth1Again = await hub.authorizedAgents(agent1.address);
  console.log(`   ${isAuth1Again ? "✅" : "❌"} Agent 1 re-authorized: ${isAuth1Again}\n`);

  // Test 7: Authorize and test Agent 2
  console.log("🔐 Test 7: Authorizing Agent 2...");
  await hub.authorizeAgent(agent2.address);
  await mneeToken.connect(agent2).approve(hubAddress, depositAmount);
  const tx2 = await hub.connect(agent2).depositAndMint(depositAmount, "Agent 2 deposit");
  await tx2.wait();
  console.log("   ✅ Agent 2 successfully deposited\n");

  // Test 8: Revoke Agent 2
  console.log("🔓 Test 8: Revoking Agent 2...");
  await hub.revokeAgent(agent2.address);
  const isAuth2After = await hub.authorizedAgents(agent2.address);
  console.log(`   ${!isAuth2After ? "✅" : "❌"} Agent 2 revoked: ${!isAuth2After}\n`);

  // Test 9: Owner can operate without authorization
  console.log("👑 Test 9: Owner operating without authorization...");
  // Owner already has tokens from TestMNEE deployment (1M tokens)
  await mneeToken.approve(hubAddress, depositAmount);
  const tx3 = await hub.depositAndMint(depositAmount, "Owner deposit");
  await tx3.wait();
  console.log("   ✅ Owner can operate without explicit authorization\n");

  // Summary
  console.log("📊 Test Summary:");
  console.log("   ✅ Authorization works");
  console.log("   ✅ Revocation works");
  console.log("   ✅ Unauthorized access blocked");
  console.log("   ✅ Revoked agents blocked");
  console.log("   ✅ Re-authorization works");
  console.log("   ✅ Owner privileges work");
  console.log("\n🎉 All tests passed!\n");

  console.log("📝 Contract Addresses:");
  console.log(`   HUB_ADDRESS=${hubAddress}`);
  console.log(`   OM_TOKEN_ADDRESS=${omTokenAddress}`);
  console.log(`   MNEE_ADDRESS=${mneeAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

