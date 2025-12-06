const hre = require("hardhat");

async function main() {
  // 1. Deploy the Hub
  const OmneeHub = await hre.ethers.getContractFactory("OmneeHub");
  const hub = await OmneeHub.deploy();
  await hub.waitForDeployment();

  console.log("OMNEE Hub deployed to:", hub.target);

  // 2. Get the address of the automatically deployed omMNEE token
  const omTokenAddress = await hub.omneeToken();
  console.log("omMNEE Token deployed to:", omTokenAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
