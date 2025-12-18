# MNEE Token Faucet

The faucet allows you to get MNEE tokens (from contract `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`) for local development and testing purposes.

## Setup

### 1. Deploy the MNEEFaucet Contract

Deploy the faucet contract to your local network or testnet:

```bash
# For localhost
npx hardhat run scripts/deploy-faucet.js --network localhost

# For a testnet (e.g., Sepolia)
npx hardhat run scripts/deploy-faucet.js --network sepolia
```

The script will output the contract address. Copy it.

### 2. Configure Environment Variable

Add the Faucet contract address to your frontend `.env` file:

```bash
VITE_FAUCET_ADDRESS=0x...
```

### 3. Fund the Faucet

Before users can request tokens, the faucet needs to be funded with MNEE tokens:

```javascript
// Using ethers.js
const mneeToken = await ethers.getContractAt("IERC20", "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF");
const faucet = await ethers.getContractAt("MNEEFaucet", faucetAddress);

// Approve the faucet to spend your MNEE
await mneeToken.approve(faucetAddress, ethers.parseEther("100000")); // Approve 100k MNEE

// Fund the faucet
await faucet.fundFaucet(ethers.parseEther("100000")); // Fund with 100k MNEE
```

### 3. Restart Frontend

Restart your frontend development server to load the new environment variable:

```bash
cd frontend
npm run dev
```

## Usage

1. Navigate to the **Faucet** page in the frontend (usually at `/faucet`)
2. Connect your wallet
3. Click "Request [amount] MNEE" to get tokens
4. Wait for the transaction to confirm
5. You can request tokens once per cooldown period (default: 1 hour)

## Features

- **Cooldown Period**: Prevents spam by limiting requests to once per hour (configurable in contract)
- **Maximum Amount**: Each request gives you 10,000 test tokens (configurable in contract)
- **Real-time Status**: Shows when you can request next tokens
- **Transaction Tracking**: View transaction hashes on Etherscan

## Contract Details

The MNEEFaucet contract includes:
- Distribution of MNEE tokens from the official contract (0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF)
- Faucet function with cooldown protection
- Configurable maximum amount (10,000 MNEE) and cooldown period (1 hour)
- Owner functions to fund and withdraw tokens
- Event emissions for tracking

## Troubleshooting

### "Faucet Not Configured" Error

Make sure you've:
1. Deployed the MNEEFaucet contract
2. Set the `VITE_FAUCET_ADDRESS` environment variable
3. Restarted the frontend server

### "Insufficient tokens in faucet" Error

The faucet needs to be funded with MNEE tokens. Ask the faucet owner to fund it, or if you're the owner, fund it using the `fundFaucet()` function.

### "Wallet Not Connected" Error

Connect your wallet using the wallet connect button in the app.

### "Faucet cooldown not expired" Error

Wait for the cooldown period to expire. The UI shows the remaining time.

### Contract Not Found

Ensure you're on the correct network (localhost, testnet, etc.) where the contract was deployed.


