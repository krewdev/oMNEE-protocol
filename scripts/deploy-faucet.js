import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  const network = await hre.ethers.provider.getNetwork();
  const isLocalhost = network.chainId === 31337n || hre.network.name === "localhost" || hre.network.name === "hardhat";
  
  let mneeTokenAddress;
  
  if (isLocalhost) {
    console.log("🌐 Local network detected - deploying TestMNEE first...");
    const TestMNEE = await hre.ethers.getContractFactory("TestMNEE");
    const testMnee = await TestMNEE.deploy();
    await testMnee.waitForDeployment();
    mneeTokenAddress = await testMnee.getAddress();
    console.log("✅ TestMNEE deployed to:", mneeTokenAddress);
  } else {
    // Mainnet or testnet - use real MNEE address
    mneeTokenAddress = "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF";
    console.log("🌐 Mainnet/Testnet detected - using MNEE token:", mneeTokenAddress);
  }

  console.log("\nDeploying MNEEFaucet contract...");
  console.log("This faucet will distribute tokens from:", mneeTokenAddress);

  const MNEEFaucet = await hre.ethers.getContractFactory("MNEEFaucet");
  const faucet = await MNEEFaucet.deploy(mneeTokenAddress);

  await faucet.waitForDeployment();

  const faucetAddress = await faucet.getAddress();
  console.log("\n✅ MNEEFaucet deployed to:", faucetAddress);
  console.log("\n📝 Add this to your frontend .env file:");
  console.log(`VITE_FAUCET_ADDRESS=${faucetAddress}`);
  
  if (isLocalhost) {
    console.log(`VITE_MNEE_ADDRESS=${mneeTokenAddress}`);
    console.log("\n💰 Funding faucet with test tokens...");
    const [deployer] = await hre.ethers.getSigners();
    const testMnee = await hre.ethers.getContractAt("TestMNEE", mneeTokenAddress);
    
    // Fund faucet with 1M test tokens
    const fundAmount = ethers.parseEther("1000000");
    await testMnee.transfer(faucetAddress, fundAmount);
    console.log(`✅ Funded faucet with ${ethers.formatEther(fundAmount)} test tokens`);
  } else {
    console.log("\n💡 Next steps:");
    console.log("1. Fund the faucet with MNEE tokens:");
    console.log(`   - Approve the faucet to spend your MNEE: mneeToken.approve("${faucetAddress}", amount)`);
    console.log(`   - Fund the faucet: faucet.fundFaucet(amount)`);
  }
  
  console.log("\n✅ Faucet is ready! Users can now request tokens.");
  console.log("\n⚠️  Note: The faucet needs to be funded with tokens before users can request.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


