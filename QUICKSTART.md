# Quick Start Guide - OMNEE Protocol

## What is OMNEE?

OMNEE is a Universal Settlement Layer for AI Agents that creates a programmable wrapper around the MNEE token, enabling:
- **Rich Transfers**: Every transaction can carry metadata (invoice IDs, task hashes, RWA data)
- **1:1 Backing**: Each omMNEE token is backed by MNEE locked in the Hub
- **Cross-Chain Operations**: Teleport funds between blockchains
- **Agent Authorization**: Whitelist AI agents for automated operations

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Deploy Contracts

```bash
# Deploy to local network (for testing)
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet/mainnet
npx hardhat run scripts/deploy.js --network <your-network>
```

### 3. Save Contract Addresses

The deployment script outputs:
```
OMNEE Hub deployed to: 0x...
omMNEE Token deployed to: 0x...
```

Save these addresses - you'll need them for interaction!

## Basic Usage

### For Contract Owners

**1. Authorize an AI Agent:**
```javascript
const hub = await ethers.getContractAt("OmneeHub", hubAddress);
await hub.authorizeAgent("0xAgentAddress...");
```

### For Authorized Agents

**2. Deposit MNEE and Get omMNEE:**
```javascript
// Approve MNEE spending first
const mnee = await ethers.getContractAt("IERC20", MNEE_ADDRESS);
await mnee.approve(hubAddress, amount);

// Deposit and mint
await hub.depositAndMint(amount, "Purpose: RWA Collateral");
```

**3. Transfer with Metadata:**
```javascript
const omToken = await ethers.getContractAt("OmneeToken", omTokenAddress);
await omToken.transferWithMetadata(
    recipientAddress,
    amount,
    "Invoice #12345"
);
```

**4. Redeem Back to MNEE:**
```javascript
await hub.redeem(amount);
```

**5. Cross-Chain Teleport:**
```javascript
await hub.teleportFunds(amount, "Solana", "SolanaAddress...");
```

## Contract Addresses

- **MNEE Token**: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- **OmneeHub**: *(Deploy and add here)*
- **omMNEE Token**: *(Automatically created by Hub)*

## Testing Locally

### 1. Start Local Hardhat Node
```bash
npx hardhat node
```

### 2. Deploy to Local Network
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Run Example Script
```bash
npx hardhat run scripts/example.js --network localhost
```

## Important Notes

⚠️ **For Production:**
- The MNEE token address is hardcoded: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- Only the Hub owner can authorize agents
- Cross-chain operations require an off-chain Agent Listener to process events
- Always verify you're interacting with the correct contract addresses

📚 **Documentation:**
- [Full README](./README.md) - Comprehensive overview
- [CONTRACTS.md](./CONTRACTS.md) - Detailed API documentation

## Common Operations

### Check if Address is Authorized
```javascript
const isAuthorized = await hub.authorizedAgents(address);
console.log(`Authorized: ${isAuthorized}`);
```

### Check omMNEE Balance
```javascript
const balance = await omToken.balanceOf(address);
console.log(`omMNEE Balance: ${ethers.formatEther(balance)}`);
```

### Listen for Events
```javascript
// Listen for deposits
hub.on("CollateralLocked", (agent, amount, purpose) => {
    console.log(`${agent} deposited ${amount} for: ${purpose}`);
});

// Listen for metadata transfers
omToken.on("OmniTransfer", (from, to, value, metadata) => {
    console.log(`Transfer ${value} from ${from} to ${to}: ${metadata}`);
});
```

## Troubleshooting

**Problem:** "Caller is not an authorized Agent Vector"
- **Solution:** Ask the Hub owner to authorize your address using `authorizeAgent()`

**Problem:** "MNEE transfer failed"
- **Solution:** Make sure you've approved the Hub to spend your MNEE tokens first

**Problem:** "Insufficient omMNEE balance"
- **Solution:** Check your omMNEE balance. You need to deposit MNEE first to get omMNEE.

## Next Steps

1. ✅ Deploy contracts
2. ✅ Authorize your agents
3. ✅ Test deposit/redemption flow
4. ✅ Implement metadata tracking in your application
5. ✅ Set up event listeners for your backend
6. ✅ Consider implementing cross-chain bridge listener for teleport operations

## Support

For detailed API documentation and advanced usage, see [CONTRACTS.md](./CONTRACTS.md).
