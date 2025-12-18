#!/usr/bin/env node
/**
 * Deployment script for oMNEE Protocol
 * * This script deploys all contracts in the correct order:
 * 1. MockMNEE (or use existing MNEE token address)
 * 2. OmneeHub (which deploys omMNEE internally)
 * 3. Settlement
 * 4. RWATokenization
 * 5. CrossChainBridge
 */

import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("Starting oMNEE Protocol deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("Deploying contracts with account:", deployerAddress);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployerAddress)).toString());
  console.log("");

  // 1. Deploy MockMNEE (replace with actual MNEE token address in production)
  console.log("Deploying MockMNEE...");
  const MockMNEE = await hre.ethers.getContractFactory("MockMNEE");
  const mockMNEE = await MockMNEE.deploy();
  await mockMNEE.waitForDeployment();
  const mneeAddress = await mockMNEE.getAddress();
  console.log("MockMNEE deployed to:", mneeAddress);

  // 2. Deploy OmneeHub
  console.log("Deploying OmneeHub...");
  const OmneeHub = await hre.ethers.getContractFactory("OmneeHub");
  const omneeHub = await OmneeHub.deploy(mneeAddress, deployerAddress);
  await omneeHub.waitForDeployment();
  const hubAddress = await omneeHub.getAddress();
  console.log("OmneeHub deployed to:", hubAddress);

  // Get omMNEE token address (deployed internally by Hub)
  const omMNEEAddress = await omneeHub.getomMNEEAddress();
  console.log("omMNEE token deployed to:", omMNEEAddress);

  // 3. Deploy Settlement
  console.log("Deploying Settlement...");
  const Settlement = await hre.ethers.getContractFactory("Settlement");
  const settlement = await Settlement.deploy(omMNEEAddress, deployerAddress);
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log("Settlement deployed to:", settlementAddress);

  // 4. Deploy RWATokenization
  console.log("Deploying RWATokenization...");
  const RWATokenization = await hre.ethers.getContractFactory("RWATokenization");
  const rwaTokenization = await RWATokenization.deploy(omMNEEAddress, deployerAddress);
  await rwaTokenization.waitForDeployment();
  const rwaAddress = await rwaTokenization.getAddress();
  console.log("RWATokenization deployed to:", rwaAddress);

  // 5. Deploy CrossChainBridge
  console.log("Deploying CrossChainBridge...");
  const CrossChainBridge = await hre.ethers.getContractFactory("CrossChainBridge");
  const crossChainBridge = await CrossChainBridge.deploy(omMNEEAddress, deployerAddress);
  await crossChainBridge.waitForDeployment();
  const bridgeAddress = await crossChainBridge.getAddress();
  console.log("CrossChainBridge deployed to:", bridgeAddress);

  // --- Summary ---
  const network = await hre.ethers.provider.getNetwork();
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:        ", hre.network.name);
  console.log("Chain ID:       ", network.chainId.toString());
  console.log("");
  console.log("Contract Addresses:");
  console.log("  MockMNEE:          ", mneeAddress);
  console.log("  OmneeHub:          ", hubAddress);
  console.log("  omMNEE Token:      ", omMNEEAddress);
  console.log("  Settlement:        ", settlementAddress);
  console.log("  RWATokenization:   ", rwaAddress);
  console.log("  CrossChainBridge:  ", bridgeAddress);
  console.log("=".repeat(60) + "\n");

  // Save deployment addresses to file
  const deploymentInfo = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    deployer: deployerAddress,
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

  const fileName = `deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));

  console.log(`Deployment info saved to ${fileName}`);
  console.log("Deployment completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});