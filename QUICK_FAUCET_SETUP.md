# Quick Faucet Setup

## 🚀 Get the Faucet Running in 3 Steps

### Step 1: Start Local Blockchain
**Important:** You must start a local Hardhat node first!

```bash
npx hardhat node
```

Keep this terminal running. The node will start on `http://localhost:8545` with 20 test accounts.

### Step 2: Deploy & Setup Faucet
In a **new terminal** (keep the node running):
```bash
npx hardhat run scripts/setup-faucet.js --network localhost
```

This will:
- Deploy TestMNEE token
- Deploy MNEEFaucet contract  
- Fund the faucet with 1M test tokens
- Output environment variables

You'll see output like:
```
============================================================
📝 Add these to your frontend/.env file:
============================================================
VITE_FAUCET_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
VITE_MNEE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
============================================================
```

### Step 3: Configure Frontend
Create or update `frontend/.env` and add the addresses from Step 2:
```bash
VITE_FAUCET_ADDRESS=0x...
VITE_MNEE_ADDRESS=0x...
```

Then restart your frontend:
```bash
cd frontend
npm run dev
```

## ✅ Done!

Now you can:
1. Go to the Faucet page in your frontend
2. Connect your wallet (use one of the Hardhat test accounts from the node output)
3. Complete Blue Team verification
4. Request test tokens!

## 📝 Notes

- **Important:** The Hardhat node must be running when you deploy and when you use the frontend
- The setup script automatically funds the faucet with 1M test tokens
- Each request gives you 10,000 test tokens
- There's a 1-hour cooldown between requests
- For mainnet/testnet, use `scripts/deploy-faucet.js` instead

## Troubleshooting

**Error: "nonce has already been used"**
- Make sure only one deployment is running at a time
- Restart the Hardhat node if needed

**Error: "Cannot connect to network"**
- Make sure `npx hardhat node` is running in another terminal
- Check that it's running on port 8545

