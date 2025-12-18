# Relayer Fee System for Cross-Chain Teleports

## Overview

The relayer fee system ensures that the Agent Listener (relayer) has funds to pay for gas costs on target chains (e.g., Solana, BSV) when executing cross-chain teleport operations.

## Problem Solved

**Before:** When a user teleported funds from Ethereum to Solana, the Agent Listener needed to pay Solana transaction fees out of pocket, creating an unsustainable economic model.

**After:** Users pay a relayer fee in omMNEE when teleporting, which accumulates for the relayer to claim and use for target chain gas costs.

## Architecture

### Smart Contract Changes

#### `teleportFunds()` Function
```solidity
function teleportFunds(
    uint256 amount,           // Amount to teleport
    string calldata targetChain,
    string calldata targetAddress,
    uint256 relayerFee        // Fee to pay relayer (NEW)
) external onlyAgent
```

**What happens:**
1. User's omMNEE balance is checked: `amount + relayerFee`
2. `amount` is burned (teleported)
3. `relayerFee` is burned and accumulated in `relayerFees[relayerAddress]`
4. Event emitted includes `relayerFee` so Agent Listener knows how much it will receive

#### Fee Accumulation
```solidity
mapping(address => uint256) public relayerFees;
address public relayerAddress;
```

- Fees accumulate per relayer address
- Only the designated `relayerAddress` can claim fees
- Owner can change `relayerAddress` via `setRelayerAddress()`

#### Fee Claiming
```solidity
function claimRelayerFees() external
```

**Process:**
1. Only `relayerAddress` can call
2. Accumulated fees are transferred as MNEE (underlying collateral)
3. Fees are reset to 0 after claiming
4. Emits `RelayerFeeClaimed` event

### Event Changes

**Updated `RedemptionRequested` event:**
```solidity
event RedemptionRequested(
    address indexed agent,
    uint256 amount,
    string destination,
    uint256 relayerFee  // NEW: Fee amount for relayer
);
```

**New `RelayerFeeClaimed` event:**
```solidity
event RelayerFeeClaimed(
    address indexed relayer,
    uint256 amount
);
```

## Frontend Implementation

### TeleportForm Component

**Features:**
- **Automatic Fee Calculation:** Default 0.5% of teleport amount
- **Adjustable Fee Percentage:** User can adjust (0.1% - 1%)
- **Minimum Fee:** 0.001 omMNEE
- **Maximum Fee:** 1% of amount
- **Total Display:** Shows amount + fee = total required
- **Balance Validation:** Ensures user has enough for amount + fee

**UI Elements:**
1. **Relayer Fee Section:**
   - Shows calculated fee
   - Adjustable percentage input
   - Breakdown: Fee + Amount = Total
   - Explanation of what the fee covers

2. **Teleport Preview:**
   - Shows burn amount
   - Shows mint amount on target chain
   - Shows relayer fee separately
   - Visual indicators for each component

## Fee Calculation Logic

```typescript
// Default: 0.5% of teleport amount
const feePercent = 0.5;

// Calculate fee
const fee = (amount * feePercent) / 100;

// Apply constraints
const minFee = 0.001;        // Minimum 0.001 omMNEE
const maxFee = amount * 0.01; // Maximum 1% of amount
const finalFee = Math.max(minFee, Math.min(fee, maxFee));
```

## Agent Listener Integration

### Event Monitoring

The Agent Listener should monitor `RedemptionRequested` events:

```javascript
hub.on("RedemptionRequested", async (agent, amount, destination, relayerFee) => {
  if (destination.startsWith("Teleport to ")) {
    // Parse destination chain and address
    const [chain, address] = parseDestination(destination);
    
    // Execute cross-chain operation
    await executeCrossChainMint(chain, address, amount);
    
    // Note: relayerFee is accumulated in contract
    // Claim fees periodically to fund target chain operations
  }
});
```

### Fee Claiming Strategy

**Option 1: Periodic Claiming**
```javascript
// Claim fees every hour or when balance is low
setInterval(async () => {
  const fees = await hub.getRelayerFees(relayerAddress);
  if (fees > MIN_CLAIM_AMOUNT) {
    await hub.claimRelayerFees();
  }
}, 3600000); // 1 hour
```

**Option 2: Threshold-Based Claiming**
```javascript
// Claim when accumulated fees reach threshold
const threshold = ethers.parseEther("100"); // 100 omMNEE
const fees = await hub.getRelayerFees(relayerAddress);
if (fees >= threshold) {
  await hub.claimRelayerFees();
}
```

**Option 3: Pre-Teleport Claiming**
```javascript
// Check balance before executing teleport
const solanaBalance = await getSolanaBalance(relayerWallet);
if (solanaBalance < MIN_SOLANA_BALANCE) {
  // Claim fees to get more MNEE, convert to SOL if needed
  await hub.claimRelayerFees();
  await convertMneeToSol(claimedAmount);
}
```

## Economic Model

### Fee Structure

| Teleport Amount | Default Fee (0.5%) | Min Fee | Max Fee |
|----------------|-------------------|---------|---------|
| 1 omMNEE       | 0.005             | 0.001   | 0.01    |
| 10 omMNEE      | 0.05              | 0.001   | 0.1     |
| 100 omMNEE     | 0.5               | 0.001   | 1.0     |
| 1000 omMNEE    | 5.0               | 0.001   | 10.0    |

### Relayer Economics

**Costs:**
- Solana transaction fee: ~0.000005 SOL (~$0.0001)
- BSV transaction fee: ~0.00001 BSV (~$0.0001)
- Ethereum gas (for claiming): ~$1-5 per claim

**Revenue:**
- Relayer fees from teleports
- Fees accumulate in omMNEE, claimed as MNEE
- Can be converted to target chain native tokens

**Break-Even:**
- If average teleport is 100 omMNEE with 0.5% fee = 0.5 omMNEE
- Need ~2000 teleports to accumulate 1000 omMNEE
- At $0.10 per omMNEE, that's $100 worth of fees
- Can fund ~1,000,000 Solana transactions

## Security Considerations

### Access Control
- ✅ Only `relayerAddress` can claim fees
- ✅ Owner can change `relayerAddress` (for key rotation)
- ✅ Fees are tracked per address (multiple relayers possible)

### Fee Validation
- ✅ Frontend enforces minimum/maximum fees
- ✅ Contract requires `relayerFee > 0`
- ✅ Contract checks sufficient balance for `amount + fee`

### Economic Security
- ⚠️ Relayer must maintain sufficient target chain balance
- ⚠️ Fee accumulation may lag behind teleport volume
- ⚠️ Consider implementing minimum fee thresholds per chain

## Future Enhancements

### 1. Chain-Specific Fee Rates
```solidity
mapping(string => uint256) public chainFeeRates; // Fee % per chain
```

### 2. Dynamic Fee Adjustment
- Adjust fees based on target chain gas prices
- Higher fees for high-gas chains (e.g., Ethereum L2s)
- Lower fees for low-gas chains (e.g., Solana)

### 3. Fee Splitting
- Split fees between multiple relayers
- Reward system for reliable relayers
- Penalties for failed teleports

### 4. Fee Estimation API
```javascript
// Backend endpoint
GET /api/teleport/fee-estimate?chain=Solana&amount=100
Response: { fee: "0.5", feePercent: 0.5, estimatedGasCost: "0.000005" }
```

### 5. Automatic Fee Conversion
- Automatically convert claimed MNEE to target chain native tokens
- Maintain balances across multiple chains
- Rebalance based on teleport patterns

## Testing

### Unit Tests

```javascript
describe("Relayer Fee System", () => {
  it("Should collect relayer fee on teleport", async () => {
    const amount = ethers.parseEther("100");
    const fee = ethers.parseEther("0.5");
    await hub.teleportFunds(amount, "Solana", solanaAddress, fee);
    const accumulated = await hub.getRelayerFees(relayerAddress);
    expect(accumulated).to.equal(fee);
  });

  it("Should allow relayer to claim fees", async () => {
    // ... accumulate fees ...
    await hub.connect(relayer).claimRelayerFees();
    const balance = await mnee.balanceOf(relayerAddress);
    expect(balance).to.equal(fee);
  });

  it("Should reject teleport with insufficient balance for fee", async () => {
    await expect(
      hub.teleportFunds(amount, "Solana", address, fee)
    ).to.be.revertedWith("QUIPO: Insufficient omMNEE (amount + fee)");
  });
});
```

## Migration Notes

### For Existing Deployments

If you have existing contracts deployed:

1. **Deploy new contract** with relayer fee support
2. **Migrate state** (authorized agents, etc.)
3. **Update frontend** to use new contract address
4. **Set relayer address** via `setRelayerAddress()`

### For New Deployments

1. Deploy contract (relayer address defaults to owner)
2. Set relayer address: `hub.setRelayerAddress(relayerAddress)`
3. Configure frontend with contract address
4. Start Agent Listener with relayer wallet

---

**The relayer fee system ensures sustainable cross-chain operations by properly compensating relayers for target chain gas costs.**

