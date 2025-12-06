# oMNEE Protocol

**OMNEE: The Omnichain Settlement Layer for Agentic Economies**

oMNEE is a Universal Ledger Protocol built on top of MNEE. It acts as a hyper-efficient "Central Bank" for Agents, enabling seamless cross-chain operations and real-world asset tokenization.

## Overview

By locking MNEE in the OmneeHub (Ethereum), agents can mint omMNEE—a programmable, cross-chain derivative used for:

- **Instant Settlement** on private agent networks
- **RWA Tokenization** - Representing real-world invoices/assets as omMNEE
- **Cross-Chain Payments** without fragmentation

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

The protocol can be deployed to any EVM-compatible blockchain. Example deployment:

```javascript
// 1. Deploy MockMNEE (or use existing MNEE token)
const MockMNEE = await ethers.getContractFactory("MockMNEE");
const mnee = await MockMNEE.deploy();

// 2. Deploy OmneeHub
const OmneeHub = await ethers.getContractFactory("OmneeHub");
const hub = await OmneeHub.deploy(mnee.address, adminAddress);

// 3. Get omMNEE token address
const omMNEEAddress = await hub.getomMNEEAddress();

// 4. Deploy other contracts
const Settlement = await ethers.getContractFactory("Settlement");
const settlement = await Settlement.deploy(omMNEEAddress, adminAddress);

const RWATokenization = await ethers.getContractFactory("RWATokenization");
const rwa = await RWATokenization.deploy(omMNEEAddress, adminAddress);

const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
const bridge = await CrossChainBridge.deploy(omMNEEAddress, adminAddress);
```

## Usage Examples

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

For questions and support, please open an issue in the GitHub repository.

