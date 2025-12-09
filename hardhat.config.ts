import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as path from "path";

export default defineConfig({
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    quipo: {
      url: "https://public-node.testnet.rsk.co", // RSK Testnet - Chain ID 33
      chainId: 33,
      type: "http",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
});
