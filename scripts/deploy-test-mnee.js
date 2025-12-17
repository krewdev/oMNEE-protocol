import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("Deploying TestMNEE contract...");

  const TestMNEE = await hre.ethers.getContractFactory("TestMNEE");
  const testMnee = await TestMNEE.deploy();

  await testMnee.waitForDeployment();

  const address = await testMnee.getAddress();
  console.log("\n✅ TestMNEE deployed to:", address);
  console.log("\n📝 Add this to your .env file:");
  console.log(`VITE_TEST_MNEE_ADDRESS=${address}`);
  console.log("\n💡 You can now use the faucet to get test tokens!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


