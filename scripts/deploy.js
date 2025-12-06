#!/usr/bin/env node
/**
 * Deployment script for oMNEE Protocol
 * 
 * This script deploys all contracts in the correct order:
 * 1. MockMNEE (or use existing MNEE token address)
 * 2. OmneeHub (which deploys omMNEE internally)
 * 3. Settlement
 * 4. RWATokenization
 * 5. CrossChainBridge
 */

import hre from "hardhat";

async function main() {
  console.log("Starting oMNEE Protocol deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", await deployer.getAddress());
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.getAddress())).toString());
  console.log("");

  // 1. Deploy MockMNEE (replace with actual MNEE token address in production)
  console.log("Deploying MockMNEE...");
  const MockMNEE = await hre.ethers.getContractFactory("MockMNEE");
  const mockMNEE = await MockMNEE.deploy();
  await mockMNEE.waitForDeployment();
  const mneeAddress = await mockMNEE.getAddress();
  console.log("MockMNEE deployed to:", mneeAddress);
  console.log("");

  // 2. Deploy OmneeHub
  console.log("Deploying OmneeHub...");
  const OmneeHub = await hre.ethers.getContractFactory("OmneeHub");
  const omneeHub = await OmneeHub.deploy(mneeAddress, await deployer.getAddress());
  await omneeHub.waitForDeployment();
  const hubAddress = await omneeHub.getAddress();
  console.log("OmneeHub deployed to:", hubAddress);

  // Get omMNEE token address
  const omMNEEAddress = await omneeHub.getomMNEEAddress();
  console.log("omMNEE token deployed to:", omMNEEAddress);
  console.log("");

  // 3. Deploy Settlement
  console.log("Deploying Settlement...");
  const Settlement = await hre.ethers.getContractFactory("Settlement");
  const settlement = await Settlement.deploy(omMNEEAddress, await deployer.getAddress());
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log("Settlement deployed to:", settlementAddress);
  console.log("");

  // 4. Deploy RWATokenization
  console.log("Deploying RWATokenization...");
  const RWATokenization = await hre.ethers.getContractFactory("RWATokenization");
  const rwaTokenization = await RWATokenization.deploy(omMNEEAddress, await deployer.getAddress());
  await rwaTokenization.waitForDeployment();
  const rwaAddress = await rwaTokenization.getAddress();
  console.log("RWATokenization deployed to:", rwaAddress);
  console.log("");

  // 5. Deploy CrossChainBridge
  console.log("Deploying CrossChainBridge...");
  const CrossChainBridge = await hre.ethers.getContractFactory("CrossChainBridge");
  const crossChainBridge = await CrossChainBridge.deploy(omMNEEAddress, await deployer.getAddress());
  await crossChainBridge.waitForDeployment();
  const bridgeAddress = await crossChainBridge.getAddress();
  console.log("CrossChainBridge deployed to:", bridgeAddress);
  console.log("");

  // Summary
  console.log("=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("");
  console.log("Contract Addresses:");
  console.log("  MockMNEE:          ", mneeAddress);
  console.log("  OmneeHub:          ", hubAddress);
  console.log("  omMNEE Token:      ", omMNEEAddress);
  console.log("  Settlement:        ", settlementAddress);
  console.log("  RWATokenization:   ", rwaAddress);
  console.log("  CrossChainBridge:  ", bridgeAddress);
  console.log("=".repeat(60));
  console.log("");

  // Save deployment addresses to file
  const fs = await import('fs');
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: await deployer.getAddress(),
    timestamp: new Date().toISOString(),
    contracts: {
      MockMNEE: mneeAddress,
      OmneeHub: hubAddress,
      omMNEE: omMNEEAddress,
      Settlement: settlementAddress,
      RWATokenization: rwaAddress,
      CrossChainBridge: bridgeAddress,
    },
  };

  fs.writeFileSync(
    `deployment-${hre.network.name}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-*.json");
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
