# OMNEE Protocol - Contract Documentation

## Table of Contents
1. [OmneeToken Contract](#omneetoken-contract)
2. [OmneeHub Contract](#omneehub-contract)
3. [Integration Guide](#integration-guide)
4. [Security Model](#security-model)

## OmneeToken Contract

### Overview
The OmneeToken (omMNEE) is an ERC20 token with extended functionality to support metadata-rich transfers. This enables "programmable money" where each transfer can carry contextual information about the transaction.

### Inheritance
- `ERC20` - Standard token functionality
- `Ownable` - Access control (owner is the OmneeHub)

### State Variables
- Inherits standard ERC20 state (balances, allowances, total supply)

### Events

#### OmniTransfer
```solidity
event OmniTransfer(
    address indexed from, 
    address indexed to, 
    uint256 value, 
    string metadata
);
```
Emitted when a metadata transfer occurs. This allows off-chain systems to track the purpose and context of each transaction.

### Functions

#### mint
```solidity
function mint(address to, uint256 amount) external onlyOwner
```
Mints new omMNEE tokens. Only callable by the OmneeHub.

**Parameters:**
- `to` - Recipient address
- `amount` - Amount to mint

**Access:** Owner only (OmneeHub)

#### burn
```solidity
function burn(address from, uint256 amount) external onlyOwner
```
Burns omMNEE tokens. Only callable by the OmneeHub.

**Parameters:**
- `from` - Address to burn from
- `amount` - Amount to burn

**Access:** Owner only (OmneeHub)

#### transferWithMetadata
```solidity
function transferWithMetadata(
    address to, 
    uint256 value, 
    string calldata metadata
) external returns (bool)
```
Transfers tokens with attached metadata for tracking purposes.

**Parameters:**
- `to` - Recipient address
- `value` - Amount to transfer
- `metadata` - String containing transaction context (e.g., "Invoice #992", "Task Hash: 0x...")

**Returns:** `true` on success

**Example Usage:**
```javascript
// Transfer tokens with invoice reference
await omMNEE.transferWithMetadata(
    recipientAddress,
    ethers.parseEther("100"),
    "Payment for Invoice #12345"
);

// Transfer for RWA tracking
await omMNEE.transferWithMetadata(
    recipientAddress,
    ethers.parseEther("500"),
    "Real Estate Token ID: property-abc-123"
);
```

---

## OmneeHub Contract

### Overview
The OmneeHub is the core vault and orchestration contract. It manages the MNEE collateral, controls omMNEE minting/burning, and authorizes AI agents to interact with the system.

### Inheritance
- `Ownable` - Administrative access control

### Constants

#### MNEE_ADDRESS
```solidity
address constant MNEE_ADDRESS = 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF;
```
The official MNEE token contract address.

### State Variables

#### officialMneeToken
```solidity
IERC20 public immutable officialMneeToken;
```
Reference to the official MNEE ERC20 token.

#### omneeToken
```solidity
OmneeToken public immutable omneeToken;
```
Reference to the deployed omMNEE token (created in constructor).

#### authorizedAgents
```solidity
mapping(address => bool) public authorizedAgents;
```
Whitelist of addresses authorized to perform operations (deposit, redeem, teleport).

#### processedCrossChainOps
```solidity
mapping(bytes32 => bool) public processedCrossChainOps;
```
Reserved for future cross-chain replay protection.

### Events

#### CollateralLocked
```solidity
event CollateralLocked(
    address indexed agent, 
    uint256 amount, 
    string purpose
);
```
Emitted when MNEE is deposited and omMNEE is minted.

#### RedemptionRequested
```solidity
event RedemptionRequested(
    address indexed agent, 
    uint256 amount, 
    string destination
);
```
Emitted when omMNEE is burned for MNEE redemption or cross-chain teleport.

#### AgentAuthorized
```solidity
event AgentAuthorized(address indexed agent);
```
Emitted when a new agent is authorized.

### Modifiers

#### onlyAgent
```solidity
modifier onlyAgent()
```
Restricts function access to authorized agents or the contract owner.

### Functions

#### constructor
```solidity
constructor() Ownable(msg.sender)
```
Initializes the Hub, sets up the MNEE token reference, and deploys the omMNEE token.

#### authorizeAgent
```solidity
function authorizeAgent(address _agent) external onlyOwner
```
Authorizes an AI agent address to interact with the protocol.

**Parameters:**
- `_agent` - Address to authorize

**Access:** Owner only

**Example:**
```javascript
await hub.authorizeAgent("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
```

#### depositAndMint
```solidity
function depositAndMint(
    uint256 amount, 
    string calldata metadata
) external onlyAgent
```
Locks MNEE in the vault and mints equivalent omMNEE to the caller.

**Parameters:**
- `amount` - Amount of MNEE to lock
- `metadata` - Purpose/context of the deposit

**Access:** Authorized agents only

**Requirements:**
- Caller must have approved the Hub to spend MNEE
- Amount must be > 0

**Example:**
```javascript
// First approve MNEE spending
await mneeToken.approve(hubAddress, ethers.parseEther("1000"));

// Then deposit
await hub.depositAndMint(
    ethers.parseEther("1000"),
    "Collateral for RWA Property #456"
);
```

#### redeem
```solidity
function redeem(uint256 amount) external onlyAgent
```
Burns omMNEE and returns the equivalent MNEE to the caller.

**Parameters:**
- `amount` - Amount of omMNEE to burn

**Access:** Authorized agents only

**Requirements:**
- Caller must have sufficient omMNEE balance

**Example:**
```javascript
await hub.redeem(ethers.parseEther("500"));
```

#### teleportFunds
```solidity
function teleportFunds(
    uint256 amount, 
    string calldata targetChain, 
    string calldata targetAddress
) external onlyAgent
```
Burns omMNEE locally and emits an event for cross-chain bridging.

**Parameters:**
- `amount` - Amount to teleport
- `targetChain` - Name of the destination chain (e.g., "Solana", "BSV")
- `targetAddress` - Recipient address on the target chain

**Access:** Authorized agents only

**Requirements:**
- Caller must have sufficient omMNEE balance
- Off-chain Agent Listener must process the event

**Example:**
```javascript
await hub.teleportFunds(
    ethers.parseEther("250"),
    "Solana",
    "SolanaPubKeyAddressHere123"
);
```

**Note:** The MNEE remains locked in the Hub, backing the value on the destination chain. An off-chain system must listen for the `RedemptionRequested` event and mint/transfer equivalent value on the target chain.

---

## Integration Guide

### For Frontend Developers

1. **Connect to Contracts**
```javascript
const hubAddress = "0x..."; // Deployed Hub address
const hub = new ethers.Contract(hubAddress, HubABI, signer);
const omTokenAddress = await hub.omneeToken();
const omToken = new ethers.Contract(omTokenAddress, TokenABI, signer);
```

2. **Check Authorization**
```javascript
const isAuthorized = await hub.authorizedAgents(userAddress);
```

3. **Deposit Flow**
```javascript
// Approve MNEE
const mnee = new ethers.Contract(MNEE_ADDRESS, ERC20ABI, signer);
await mnee.approve(hubAddress, amount);

// Deposit
await hub.depositAndMint(amount, "Purpose description");
```

4. **Listen to Events**
```javascript
hub.on("CollateralLocked", (agent, amount, purpose) => {
    console.log(`Agent ${agent} deposited ${amount} for: ${purpose}`);
});

omToken.on("OmniTransfer", (from, to, value, metadata) => {
    console.log(`Transfer ${value} from ${from} to ${to}: ${metadata}`);
});
```

### For Backend Agent Listeners

Monitor events for cross-chain operations:

```javascript
// Listen for teleport requests
hub.on("RedemptionRequested", async (agent, amount, destination) => {
    if (destination.startsWith("Teleport to ")) {
        // Parse destination
        // Execute cross-chain mint/transfer
        // Update cross-chain ledger
    }
});
```

---

## Security Model

### Access Control
- **OmneeHub Owner:** Can authorize agents
- **Authorized Agents:** Can deposit, redeem, and teleport
- **OmneeToken Owner (Hub):** Controls minting and burning

### Collateral Backing
- Every omMNEE in circulation is backed 1:1 by MNEE locked in the Hub
- Minting only occurs through `depositAndMint()`
- Burning occurs through `redeem()` and `teleportFunds()`

### Cross-Chain Security
- Cross-chain operations rely on off-chain Agent Listeners
- `processedCrossChainOps` mapping available for replay protection
- MNEE remains locked in Hub during cross-chain operations

### Audit Recommendations
1. Verify correct MNEE token address
2. Review agent authorization process
3. Monitor collateral ratio (should always be 1:1)
4. Implement off-chain monitoring for cross-chain operations
5. Consider adding pause functionality for emergency situations

---

## Additional Resources

- [Main README](./README.md)
- [OpenZeppelin Contracts Documentation](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
