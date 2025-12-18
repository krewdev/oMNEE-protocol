# Faucet Cooldown Testing Guide

This guide shows you how to test the faucet cooldown functionality with a shorter cooldown period.

## Quick Setup with Short Cooldown

### Option 1: Use TestMNEEFaucet (Recommended for Testing)

The `TestMNEEFaucet` contract has a **configurable cooldown** that you can set to any value for testing.

#### 1. Start Hardhat Node
```bash
npx hardhat node
```

#### 2. Deploy with Short Cooldown
```bash
# Default: 60 second cooldown
npx hardhat run scripts/setup-faucet-short-cooldown.js --network localhost

# Or set custom cooldown (e.g., 10 seconds)
FAUCET_COOLDOWN_SECONDS=10 npx hardhat run scripts/setup-faucet-short-cooldown.js --network localhost

# Or 0 seconds (no cooldown - for instant testing)
FAUCET_COOLDOWN_SECONDS=0 npx hardhat run scripts/setup-faucet-short-cooldown.js --network localhost
```

#### 3. Test the Cooldown
```bash
npx hardhat run scripts/test-faucet-cooldown.js --network localhost
```

This script will:
- Deploy TestMNEE and TestMNEEFaucet
- Make a successful request
- Try to make another request immediately (will fail)
- Show the cooldown status

## Changing Cooldown After Deployment

If you've already deployed the faucet, you can change the cooldown as the owner:

```javascript
// Using Hardhat console or a script
const faucet = await ethers.getContractAt("TestMNEEFaucet", faucetAddress);

// Set cooldown to 0 (no cooldown - for instant testing)
await faucet.setCooldown(0);

// Set cooldown to 10 seconds
await faucet.setCooldown(10);

// Set cooldown to 60 seconds (1 minute)
await faucet.setCooldown(60);

// Set cooldown back to 1 hour (3600 seconds)
await faucet.setCooldown(3600);
```

## Testing Cooldown in Frontend

1. Deploy the faucet with a short cooldown (e.g., 60 seconds)
2. Add the addresses to `frontend/.env`
3. Restart your frontend
4. Make a request from the faucet
5. Try to make another request immediately - you should see the cooldown message
6. Wait for the cooldown period to expire
7. Make another request - it should succeed

## Cooldown Status

The frontend automatically checks the cooldown status and shows:
- ✅ "You can request tokens now!" when cooldown has expired
- ⏱️ "Cooldown active. Next request available in: X" when cooldown is active

## Contract Comparison

| Feature | MNEEFaucet | TestMNEEFaucet |
|---------|-----------|----------------|
| Cooldown | Fixed (1 hour) | Configurable (owner can change) |
| Use Case | Production | Testing/Development |
| Interface | Same | Same (frontend compatible) |

## Quick Commands

```bash
# Deploy with 0 cooldown (instant requests)
FAUCET_COOLDOWN_SECONDS=0 npx hardhat run scripts/setup-faucet-short-cooldown.js --network localhost

# Deploy with 10 second cooldown
FAUCET_COOLDOWN_SECONDS=10 npx hardhat run scripts/setup-faucet-short-cooldown.js --network localhost

# Deploy with 1 minute cooldown (default)
npx hardhat run scripts/setup-faucet-short-cooldown.js --network localhost

# Test cooldown functionality
npx hardhat run scripts/test-faucet-cooldown.js --network localhost
```

## Notes

- The `TestMNEEFaucet` contract is identical to `MNEEFaucet` except for the configurable cooldown
- The frontend works with both contracts (same interface)
- For production, use `MNEEFaucet` with the fixed 1-hour cooldown
- For testing, use `TestMNEEFaucet` with a short or zero cooldown

