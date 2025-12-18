# Faucet Setup Guide

This guide will help you set up the faucet for local testing.

## Quick Setup (Local Testing)

### 1. Start Local Hardhat Node

In one terminal, start a local Hardhat node:

```bash
npx hardhat node
```

This will start a local blockchain on `http://localhost:8545` with 20 test accounts.

### 2. Deploy Faucet

In another terminal, run the setup script:

```bash
npx hardhat run scripts/setup-faucet.js --network localhost
```

This script will:
- Deploy TestMNEE token
- Deploy MNEEFaucet contract
- Fund the faucet with 1M test tokens
- Output environment variables you need

### 3. Configure Frontend

Copy the environment variables from the script output to `frontend/.env`:

```bash
VITE_FAUCET_ADDRESS=0x...
VITE_MNEE_ADDRESS=0x...
```

### 4. Restart Frontend

Restart your frontend dev server to load the new environment variables:

```bash
cd frontend
npm run dev
```

### 5. Test the Faucet

1. Navigate to the Faucet page in your frontend
2. Connect your wallet (use one of the Hardhat test accounts)
3. Complete the Blue Team verification
4. Click "Request [amount] MNEE" to get test tokens

## Alternative: Manual Deployment

If you prefer to deploy manually:

```bash
# Deploy TestMNEE
npx hardhat run scripts/deploy-test-mnee.js --network localhost

# Deploy MNEEFaucet (use TestMNEE address from above)
npx hardhat run scripts/deploy-faucet.js --network localhost

# Fund the faucet (using Hardhat console or a script)
```

## Mainnet/Testnet Deployment

For mainnet or testnet deployments, use:

```bash
npx hardhat run scripts/deploy-faucet.js --network <network-name>
```

The script will automatically detect the network and use the real MNEE token address (`0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`).

**Important:** For mainnet/testnet, you'll need to manually fund the faucet with real MNEE tokens after deployment.

## Troubleshooting

### "Faucet Not Configured" Error
- Make sure `VITE_FAUCET_ADDRESS` is set in `frontend/.env`
- Restart the frontend dev server after adding the variable

### "Insufficient tokens in faucet" Error
- The faucet needs to be funded with tokens
- For local testing, the setup script does this automatically
- For mainnet/testnet, fund it manually using the `fundFaucet()` function

### "Contract not found" Error
- Make sure you're connected to the correct network (localhost for local testing)
- Verify the contract address is correct
- Check that the contracts are deployed on the network you're using

### "Faucet cooldown not expired" Error
- Wait for the cooldown period (1 hour by default)
- The UI shows the remaining time until you can request again

