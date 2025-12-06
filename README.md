# oMNEE Protocol - MNEE Hackathon Entry

**OMNEE: Universal Ledger Protocol for Agentic Economies & Real-World Asset Tokenization**

🏆 **Hackathon Submission for: MNEE Hackathon - Programmable Money for Agents, Commerce, and Automated Finance**

## Overview

oMNEE is a Universal Ledger Protocol that transforms MNEE (USD-backed stablecoin at `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`) into a programmable, cross-chain derivative for AI agents and automated financial systems. By locking MNEE in the OmneeHub vault on Ethereum, users and AI agents can:

- **Instant Settlement** on private agent networks for sub-second transactions
- **RWA Tokenization** - Represent real-world assets (invoices, real estate, commodities) as MNEE-backed instruments
- **Cross-Chain Payments** - Enable seamless value transfer across multiple blockchains without fragmentation
- **AI Agent Payments** - Allow autonomous agents to transact, pay for services, and manage treasuries

### Hackathon Tracks Addressed

✅ **AI & Agent Payments** - Autonomous agents can pay for APIs, services, and data using omMNEE  
✅ **Financial Automation** - Programmable invoicing, escrow, treasury management, and RWA tokenization  
✅ **Commerce & Creator Tools** - Enables payment systems using MNEE-backed derivatives

## Why oMNEE?

Traditional financial systems are designed for humans. As AI agents become economic actors, they need:
- **Programmability**: Smart contracts that execute automatically
- **Cross-chain operability**: Transact on any blockchain
- **Instant settlements**: Sub-second finality for agent-to-agent commerce
- **Transparency**: On-chain verifiability and auditable reserves
- **Low costs**: Ultra-low fees for high-frequency agent transactions

oMNEE solves these challenges by creating a **universal ledger** where MNEE serves as the stable foundation, and omMNEE acts as the programmable wrapper enabling advanced automation.

## Architecture

### Core Contracts

#### 1. OmneeHub
The main hub contract deployed on Ethereum that serves as the "Central Bank" for the protocol.

**Features:**
- Lock MNEE tokens
- Mint omMNEE tokens at 1:1 ratio
- Unlock MNEE by burning omMNEE
- Track all locks and their states

**Key Functions:**
```solidity
function lockAndMint(uint256 amount) external returns (bytes32 lockId)
function unlockAndBurn(bytes32 lockId) external
```

#### 2. omMNEE Token
ERC20-compatible programmable token representing locked MNEE.

**Features:**
- Standard ERC20 functionality
- Burnable tokens
- Access control (roles: MINTER, PAUSER, BRIDGE)
- Pausable for emergency situations
- Reentrancy protection

#### 3. Settlement Contract
Handles instant settlement on private agent networks.

**Features:**
- Initiate settlements between parties
- Complete settlements with omMNEE transfers
- Track settlement history per network
- Agent-based access control

**Use Cases:**
- Instant payments between AI agents
- Micropayments for agent services
- Settlement in private agent networks

#### 4. RWATokenization Contract
Enables tokenization of Real-World Assets using omMNEE as collateral.

**Features:**
- Issue RWA tokens backed by omMNEE
- Support for multiple asset types (invoices, real estate, commodities)
- Maturity-based redemption
- Transfer RWA token ownership
- Mark tokens as defaulted

**Asset Types:**
- `INVOICE` - Trade invoices and receivables
- `REAL_ESTATE` - Property-backed tokens
- `COMMODITY` - Physical commodity representations
- `OTHER` - Custom asset types

#### 5. CrossChainBridge Contract
Facilitates omMNEE transfers across different blockchain networks.

**Features:**
- Initiate cross-chain transfers
- Support multiple blockchain networks
- Bridge operator role for completing transfers
- Refund mechanism for failed transfers
- Chain whitelist management

**Supported Operations:**
- Lock tokens on source chain
- Mint tokens on destination chain (via operator)
- Handle failed transfers with refunds

## MNEE Integration (Hackathon Requirement)

This project uses the **MNEE USD-backed stablecoin** deployed on Ethereum at:

**Contract Address:** `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`

### How We Use MNEE

1. **OmneeHub Vault**: Users and AI agents deposit MNEE tokens into the OmneeHub contract
2. **1:1 Minting**: For each MNEE locked, an equivalent omMNEE is minted as a programmable derivative
3. **Programmable Wrapper**: omMNEE inherits MNEE's USD stability while adding smart contract automation
4. **Redemption**: Users can burn omMNEE to unlock their original MNEE at any time

### Key Benefits for AI Agents

- **Autonomous Payments**: AI agents can pay for APIs, data feeds, and services without human intervention
- **Treasury Management**: Automated allocation and tracking of agent spending
- **Cross-Chain Access**: Bridge omMNEE to other chains for multichain agent operations
- **RWA Backing**: Use MNEE-backed tokens to represent real-world assets like invoices or commodities

### Integration Example

```javascript
// AI Agent deposits MNEE and receives omMNEE
const mneeContract = new ethers.Contract(MNEE_ADDRESS, MNEE_ABI, signer);
const hubContract = new ethers.Contract(HUB_ADDRESS, HUB_ABI, signer);

// Approve OmneeHub to spend MNEE
await mneeContract.approve(HUB_ADDRESS, amount);

// Lock MNEE and mint omMNEE
const tx = await hubContract.lockAndMint(amount);
const receipt = await tx.wait();

// Agent now has omMNEE for programmable payments
const omMNEEBalance = await omMNEEContract.balanceOf(agentAddress);
```

## Installation

```bash
# Clone the repository
git clone https://github.com/krewdev/oMNEE-protocol.git
cd oMNEE-protocol

# Install dependencies
npm install
```

## Compilation

```bash
# Compile contracts
npm run compile
```

This will compile all Solidity contracts and generate artifacts in the `artifacts/` directory.

## Testing

```bash
# Run all tests
npm test
```

The test suite covers:
- Lock and mint functionality
- Unlock and burn operations
- Settlement initiation and completion
- RWA token issuance and redemption
- Cross-chain bridge operations
- Access control and security features

## Deployment

### For Hackathon: Using Real MNEE on Ethereum Mainnet

To use the actual MNEE token (required for hackathon submission):

```javascript
// MNEE Token Address (Ethereum Mainnet)
const MNEE_ADDRESS = "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF";

// Deploy OmneeHub with real MNEE
const OmneeHub = await ethers.getContractFactory("OmneeHub");
const hub = await OmneeHub.deploy(MNEE_ADDRESS, adminAddress);
await hub.waitForDeployment();

// Get omMNEE token address
const omMNEEAddress = await hub.getomMNEEAddress();
console.log("omMNEE deployed at:", omMNEEAddress);

// Deploy supporting contracts
const Settlement = await ethers.getContractFactory("Settlement");
const settlement = await Settlement.deploy(omMNEEAddress, adminAddress);

const RWATokenization = await ethers.getContractFactory("RWATokenization");
const rwa = await RWATokenization.deploy(omMNEEAddress, adminAddress);

const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
const bridge = await CrossChainBridge.deploy(omMNEEAddress, adminAddress);
```

### For Testing: Using MockMNEE

For local development and testing:

```javascript
// Deploy MockMNEE for testing
const MockMNEE = await ethers.getContractFactory("MockMNEE");
const mockMNEE = await MockMNEE.deploy();

// Deploy OmneeHub with mock token
const OmneeHub = await ethers.getContractFactory("OmneeHub");
const hub = await OmneeHub.deploy(await mockMNEE.getAddress(), adminAddress);
```

## Use Cases & Examples

### 1. AI Agent Pays for API Access

An AI agent autonomously pays for gated API services using MNEE:

```javascript
// Agent locks MNEE to get omMNEE
const lockTx = await omneeHub.connect(agentSigner).lockAndMint(
  ethers.parseUnits("100", 18) // 100 MNEE
);

// Agent uses omMNEE to pay for API subscription
const apiPayment = await omMNEE.connect(agentSigner).transfer(
  apiProviderAddress,
  ethers.parseUnits("10", 18) // 10 omMNEE/month
);

console.log("Agent successfully paid for API access");
```

### 2. RWA Tokenization - Invoice Financing

Tokenize a business invoice as a MNEE-backed asset:

```javascript
// Business locks MNEE as collateral
await omMNEE.approve(rwaAddress, collateralAmount);

// Issue RWA token representing the invoice
const invoiceToken = await rwa.issueRWAToken(
  businessOwner,
  ethers.parseUnits("1000", 18), // $1000 collateral
  ethers.parseUnits("1200", 18), // $1200 invoice value
  0, // AssetType.INVOICE
  Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days maturity
  "ipfs://Qm..." // Invoice metadata on IPFS
);

// Invoice can now be traded or used as collateral
```

### 3. Cross-Chain Agent Payments

AI agent bridges omMNEE to another chain for payment:

```javascript
// Add target chain support
await crossChainBridge.addSupportedChain(137); // Polygon

// Agent initiates bridge transfer
await omMNEE.connect(agentSigner).approve(bridgeAddress, amount);

const bridgeTx = await crossChainBridge.connect(agentSigner).initiateBridge(
  recipientAddress,
  ethers.parseUnits("50", 18),
  137 // Target chain ID
);

// Bridge operator completes on destination chain
// Agent can now spend on Polygon
```

### 4. Autonomous Treasury Management

AI-managed treasury with automated allocations:

```javascript
// DAO deposits MNEE into treasury
await mnee.approve(hubAddress, totalBudget);
await omneeHub.lockAndMint(totalBudget);

// AI agent manages allocations
const allocations = [
  { category: "API_COSTS", amount: ethers.parseUnits("1000", 18) },
  { category: "DATA_FEEDS", amount: ethers.parseUnits("500", 18) },
  { category: "COMPUTE", amount: ethers.parseUnits("2000", 18) }
];

// Agent automatically distributes based on usage
for (const allocation of allocations) {
  await omMNEE.transfer(categoryWallets[allocation.category], allocation.amount);
}
```

### 5. Instant Agent-to-Agent Settlement

Two AI agents settle payments on a private network:

```javascript
// Setup settlement network
const AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGENT_ROLE"));
await settlement.grantRole(AGENT_ROLE, agent1Address);

// Agent 1 initiates settlement with Agent 2
const settlementTx = await settlement.connect(agent1).initiateSettlement(
  agent1Address,
  agent2Address,
  ethers.parseUnits("25", 18),
  ethers.keccak256(ethers.toUtf8Bytes("agent-network-1"))
);

// Get settlement ID and complete
const receipt = await settlementTx.wait();
const settlementId = receipt.logs[0].args.settlementId;

await omMNEE.connect(agent1).approve(settlementAddress, amount);
await settlement.completeSettlement(settlementId);

console.log("Instant settlement completed between agents");
```

## Usage Examples (Solidity)

### Lock MNEE and Mint omMNEE

```solidity
// Approve OmneeHub to spend MNEE
mneeToken.approve(omneeHubAddress, amount);

// Lock MNEE and mint omMNEE
bytes32 lockId = omneeHub.lockAndMint(amount);
```

### Instant Settlement

```solidity
// Grant agent role
settlement.grantRole(AGENT_ROLE, agentAddress);

// Initiate settlement
bytes32 settlementId = settlement.initiateSettlement(
    from,
    to,
    amount,
    networkId
);

// Approve and complete settlement
omMNEE.approve(settlementAddress, amount);
settlement.completeSettlement(settlementId);
```

### Tokenize Real-World Asset

```solidity
// Grant issuer role
rwa.grantRole(ISSUER_ROLE, issuerAddress);

// Approve collateral
omMNEE.approve(rwaAddress, collateralAmount);

// Issue RWA token
bytes32 tokenId = rwa.issueRWAToken(
    owner,
    collateralAmount,
    assetValue,
    AssetType.INVOICE,
    maturityTimestamp,
    "ipfs://metadata-hash"
);
```

### Cross-Chain Bridge

```solidity
// Add supported chain
bridge.addSupportedChain(targetChainId);

// Approve and initiate bridge
omMNEE.approve(bridgeAddress, amount);
bytes32 requestId = bridge.initiateBridge(
    recipientAddress,
    amount,
    targetChainId
);

// Operator completes bridge (on backend)
bridge.completeBridge(requestId);
```

## Security Features

- **Access Control**: Role-based permissions (OpenZeppelin AccessControl)
- **Pausable**: Emergency stop mechanism
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Upgradeable**: Contracts can be upgraded if needed
- **Audited Libraries**: Uses OpenZeppelin battle-tested contracts

## Roles

### OmneeHub
- `DEFAULT_ADMIN_ROLE`: Contract administration
- `OPERATOR_ROLE`: Operational permissions
- `PAUSER_ROLE`: Can pause/unpause operations

### omMNEE Token
- `DEFAULT_ADMIN_ROLE`: Token administration
- `MINTER_ROLE`: Can mint new tokens
- `PAUSER_ROLE`: Can pause/unpause transfers
- `BRIDGE_ROLE`: Can bridge tokens cross-chain

### Settlement
- `DEFAULT_ADMIN_ROLE`: Contract administration
- `AGENT_ROLE`: Can initiate and complete settlements
- `PAUSER_ROLE`: Can pause/unpause operations

### RWATokenization
- `DEFAULT_ADMIN_ROLE`: Contract administration
- `ISSUER_ROLE`: Can issue RWA tokens
- `PAUSER_ROLE`: Can pause/unpause operations

### CrossChainBridge
- `DEFAULT_ADMIN_ROLE`: Contract administration
- `BRIDGE_OPERATOR_ROLE`: Can complete bridge transfers
- `PAUSER_ROLE`: Can pause/unpause operations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

## Hackathon Submission Details

### 🎯 Project Summary

**oMNEE Protocol** is a universal ledger system that transforms MNEE (the USD-backed stablecoin) into a programmable financial infrastructure for AI agents, automated commerce, and RWA tokenization. Our solution addresses all three hackathon tracks:

1. **AI & Agent Payments**: Autonomous agents can lock MNEE, receive omMNEE, and use it to pay for APIs, data feeds, and services without human intervention
2. **Financial Automation**: Programmable invoicing through RWA tokenization, automated escrow via settlement contracts, and treasury management for agent ecosystems
3. **Commerce & Creator Tools**: Instant payment settlement infrastructure that creators and businesses can use for subscriptions, paywalls, and automated payouts

### 🚀 Key Innovations

- **Vault-Based Architecture**: Lock MNEE in a secure vault, mint 1:1 omMNEE derivatives with programmable features
- **Cross-Chain Bridge**: Enable MNEE-backed assets to move across blockchains seamlessly
- **RWA Tokenization**: Convert real-world assets (invoices, real estate, commodities) into MNEE-backed on-chain instruments
- **Agent-First Design**: Built specifically for AI agents with autonomous treasury management and agentic OAuth-like identification
- **Universal Ledger**: Foundation for global RWA tokenization with transparent, auditable on-chain tracking

### 📊 Demonstrated Use Cases

1. **AI Agent API Payments**: Agents autonomously pay for gated APIs and services
2. **Invoice Financing**: Businesses tokenize invoices as MNEE-backed RWA tokens
3. **Cross-Chain Commerce**: Bridge omMNEE to other chains for multichain payments
4. **Treasury Automation**: AI-managed budgets with automated allocations
5. **Agent-to-Agent Settlement**: Instant settlements on private agent networks

### 🛠️ Technical Stack

- **Smart Contracts**: Solidity 0.8.20 with OpenZeppelin security libraries
- **MNEE Integration**: Uses official MNEE contract at `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- **Testing**: Comprehensive test suite with Hardhat & Chai
- **Security**: Access control, pausable patterns, reentrancy guards
- **Deployment**: Automated deployment scripts for all contracts

### 📝 Repository Structure

```
oMNEE-protocol/
├── contracts/           # Solidity smart contracts
│   ├── OmneeHub.sol    # Main vault for MNEE locking
│   ├── omMNEE.sol      # Programmable derivative token
│   ├── Settlement.sol   # Instant settlement for agents
│   ├── RWATokenization.sol  # Real-world asset tokenization
│   ├── CrossChainBridge.sol # Cross-chain transfer
│   └── MockMNEE.sol    # Testing mock (not for production)
├── test/               # Comprehensive test suite
├── scripts/            # Deployment and compilation scripts
├── README.md           # This file - full documentation
└── LICENSE             # MIT License
```

### 🎬 Demo Video (To Be Created)

The demo video will showcase:
- Deploying contracts with real MNEE token
- AI agent locking MNEE and receiving omMNEE
- Agent paying for an API service
- Tokenizing an invoice as an RWA
- Cross-chain bridge operation
- Full transparency via Etherscan

### 🔗 Live Demo (Testnet)

- **Network**: Ethereum Sepolia Testnet
- **OmneeHub**: [To be deployed]
- **omMNEE Token**: [To be deployed]
- **Web Interface**: [To be created]

### 📦 Installation for Judges

```bash
# Clone repository
git clone https://github.com/krewdev/oMNEE-protocol.git
cd oMNEE-protocol

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests (requires network access for some dependencies)
# Tests demonstrate all core functionality
npm test

# Deploy to testnet
npm run deploy -- --network sepolia
```

### 🏆 Why oMNEE Wins

1. **Practical & Production-Ready**: Built with battle-tested OpenZeppelin libraries, ready for real-world deployment
2. **Multi-Track Coverage**: Addresses AI payments, financial automation, AND commerce infrastructure
3. **Universal Ledger Vision**: Foundation for global RWA tokenization with MNEE as the stable anchor
4. **Agent-First Architecture**: Designed specifically for AI agents as economic actors
5. **Extensible & Future-Proof**: Modular design allows easy addition of new chains and features
6. **Transparent & Auditable**: All operations on-chain with clear event logging
7. **Ease of Use**: Simple APIs for agents and developers to integrate

### 📧 Contact

- **Developer**: developer@mnee.io (as per hackathon guidelines)
- **Repository**: https://github.com/krewdev/oMNEE-protocol
- **Issues**: Open an issue on GitHub for questions

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! This project is open-source and encourages community participation in building the future of programmable money for AI agents.

## Acknowledgments

- **MNEE Team**: For creating the USD-backed stablecoin foundation
- **OpenZeppelin**: For secure smart contract libraries
- **Ethereum Community**: For the robust development ecosystem

---

**Built for the MNEE Hackathon 2025-2026**  
*Programmable Money for Agents, Commerce, and Automated Finance*

For questions and support, please open an issue in the GitHub repository.

