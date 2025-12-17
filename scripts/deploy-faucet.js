import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("Deploying MNEEFaucet contract...");
  console.log("This faucet will distribute MNEE tokens from:", "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF");

  const MNEEFaucet = await hre.ethers.getContractFactory("MNEEFaucet");
  const faucet = await MNEEFaucet.deploy();

  await faucet.waitForDeployment();

  const address = await faucet.getAddress();
  console.log("\n✅ MNEEFaucet deployed to:", address);
  console.log("\n📝 Add this to your frontend .env file:");
  console.log(`VITE_FAUCET_ADDRESS=${address}`);
  console.log("\n💡 Next steps:");
  console.log("1. Fund the faucet with MNEE tokens:");
  console.log(`   - Approve the faucet to spend your MNEE: mneeToken.approve("${address}", amount)`);
  console.log(`   - Fund the faucet: faucet.fundFaucet(amount)`);
  console.log("2. Users can now request tokens from the faucet!");
  console.log("\n⚠️  Note: The faucet needs to be funded with MNEE tokens before users can request.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


