oMNEE Protocol - Universal Ledger for Agentic Economies

🏆 MNEE Hackathon Submission — Programmable Money for Agents, Commerce, and Automated Finance
Overview

oMNEE is a Universal Ledger Protocol that transforms MNEE (USD-backed stablecoin at 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF) into a programmable, cross-chain derivative. It creates a high-velocity layer for AI agents to transact, tokenize real-world assets (RWA), and settle payments with instant finality.
Architecture

The protocol uses a Vault-based Mint/Burn mechanism. By locking MNEE in the OmneeHub, agents receive omMNEE — a programmable wrapper that supports rich metadata and cross-chain teleportation.
Core Components
Contract	Purpose	Key Feature
OmneeHub	Central Vault & Controller	Manages 1:1 MNEE collateral and authorizes AI "Vectors."
omMNEE Token	Programmable Derivative	ERC20 with transferWithMetadata() for agent tracking.
Settlement	Private Network Clearing	Enables sub-second finality between AI agent clusters.
RWATokenization	Asset Backing	Tokenizes invoices and real estate using omMNEE collateral.
CrossChainBridge	Liquidity Portability	Facilitates "teleport" operations across multiple chains.
Technical Integration
1. Deposit & Mint (Agent Onboarding)

AI agents lock MNEE to gain programmable liquidity.
Solidity

// Approve and lock MNEE
mneeToken.approve(hubAddress, amount);
hub.lockAndMint(amount); // Mints 1:1 omMNEE

2. Rich Transfers (Metadata)

Agents can attach "Task IDs" or "Invoice Hashes" directly to the transfer, allowing for automated accounting.
JavaScript

await omMNEE.transferWithMetadata(
  serviceProvider, 
  amount, 
  "TaskID: agent-sub-442"
);

3. RWA Tokenization

Convert real-world business receivables into MNEE-backed instruments.
Solidity

rwa.issueRWAToken(
    owner,
    collateralAmount,
    AssetType.INVOICE,
    maturityTimestamp,
    "ipfs://invoice-data"
);

Installation & Setup
1. Install Dependencies
Bash

git clone https://github.com/krewdev/oMNEE-protocol.git
cd oMNEE-protocol
npm install

2. Compilation
Bash

npx hardhat compile

3. Deployment

The script deploys the Hub (the "Central Bank") and initializes the derivative ecosystem.
Bash

npx hardhat run scripts/deploy.js --network sepolia

Security & Roles

    AccessControl: Modular roles (MINTER_ROLE, AGENT_ROLE, BRIDGE_OPERATOR_ROLE) ensure that only verified AI vectors can trigger minting/burning.

    1:1 Backing: The OmneeHub is non-custodial and maintains a strict 1:1 ratio between locked MNEE and circulating omMNEE.

    Emergency Pause: All critical functions include a circuit breaker for protocol safety.

Hackathon Track Summary

    ✅ AI & Agent Payments: Native metadata support for autonomous service payments.

    ✅ Financial Automation: Automated RWA issuance and maturity-based redemption.

    ✅ Commerce Tools: Instant settlement layer for sub-second agent-to-agent trade.

MNEE Contract: 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF

License: MIT

Would you like me to generate a Demo Script that simulates a full AI Agent workflow (Lock -> Pay for API -> Tokenize Invoice -> Redeem)?