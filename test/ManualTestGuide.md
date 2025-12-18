# Manual Testing Guide - Authorization & Revocation

This guide walks you through testing the authorization and revocation system manually using the frontend and local Hardhat network.

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install
   ```

2. **Start local Hardhat node:**
   ```bash
   npx hardhat node
   ```
   Keep this terminal open - it will provide test accounts with ETH.

3. **Deploy contracts:**
   In a new terminal:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   Save the contract addresses that are printed.

4. **Update environment variables:**
   Create `frontend/.env.local`:
   ```env
   VITE_HUB_ADDRESS=<hub-address-from-deployment>
   VITE_OM_TOKEN_ADDRESS=<om-token-address-from-deployment>
   VITE_MNEE_ADDRESS=<mnee-address-or-test-mnee>
   VITE_RPC_URL=http://localhost:8545
   ```

5. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Test Accounts (Hardhat Default)

When you run `npx hardhat node`, you get these accounts with 10,000 ETH each:

- **Account 0 (Owner)**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account 1 (Agent 1)**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account 2 (Agent 2)**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Account 3 (Unauthorized)**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`

## Testing Workflow

### Step 1: Connect as Owner

1. Open the frontend in your browser (usually `http://localhost:5173`)
2. Click "Connect Wallet"
3. Import the owner account into MetaMask:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Or use MetaMask's "Import Account" feature
4. Connect to the local network (add network if needed):
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

### Step 2: Verify Owner Status

1. Navigate to the Dashboard
2. Check the "Authorization Status" component
3. Should show: **"Owner Access"** with a crown icon ✅

### Step 3: Authorize Agent 1

1. Navigate to **Admin Panel** (should be accessible as owner)
2. In the "Authorize New Agent" section:
   - Enter Agent 1 address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Click "Authorize"
   - Confirm transaction in MetaMask
3. Wait for confirmation
4. Check "Authorized Agents" list - Agent 1 should appear ✅

### Step 4: Test as Agent 1

1. **Disconnect** current wallet
2. **Import Agent 1** into MetaMask:
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d2`
3. **Connect** Agent 1 wallet
4. Navigate to Dashboard
5. Check Authorization Status - should show: **"Authorized"** ✅
6. Try to access:
   - ✅ Deposit Page - should be accessible
   - ✅ Transfer Page - should be accessible
   - ✅ Redeem Page - should be accessible
   - ✅ Teleport Page - should be accessible

### Step 5: Test Deposit (Agent 1)

1. Navigate to **Deposit** page
2. You'll need MNEE tokens first. Options:
   - **Option A**: Deploy TestMNEE and use faucet
     ```bash
     npx hardhat run scripts/deploy-test-mnee.js --network localhost
     # Then use the faucet in the frontend
     ```
   - **Option B**: Use the existing MNEE address if on mainnet/testnet
3. If using TestMNEE:
   - Go to Faucet page
   - Request test tokens
   - Approve the Hub to spend your MNEE
   - Enter amount (e.g., "100")
   - Enter metadata (e.g., "Test deposit")
   - Click "Deposit & Mint"
   - Confirm transaction
4. Check balance - should show omMNEE balance ✅

### Step 6: Revoke Agent 1

1. **Switch back to Owner account** in MetaMask
2. Navigate to **Admin Panel**
3. In "Authorized Agents" list, find Agent 1
4. Click **"Revoke"** button next to Agent 1
5. Confirm transaction in MetaMask
6. Wait for confirmation
7. Agent 1 should disappear from the list ✅

### Step 7: Verify Revocation Works

1. **Switch back to Agent 1** account
2. Navigate to Dashboard
3. Check Authorization Status - should show: **"Not Authorized"** ✅
4. Try to access:
   - ❌ Deposit Page - should show "Not Authorized" message
   - ❌ Transfer Page - should show "Not Authorized" message
   - ❌ Redeem Page - should show "Not Authorized" message
   - ❌ Teleport Page - should show "Not Authorized" message

### Step 8: Test Re-Authorization

1. **Switch back to Owner**
2. Go to Admin Panel
3. Authorize Agent 1 again
4. **Switch to Agent 1**
5. Verify access is restored ✅

### Step 9: Test Multiple Agents

1. As Owner, authorize Agent 2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
2. Switch to Agent 2
3. Verify Agent 2 can perform operations ✅
4. Switch back to Owner
5. Revoke Agent 2
6. Switch to Agent 2
7. Verify Agent 2 is blocked ✅

### Step 10: Test Unauthorized User

1. Import Account 3 (Unauthorized): `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
   - Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
2. Connect as Account 3
3. Verify all operations show "Not Authorized" ✅

## Quick Test Script

For faster testing, you can also use a script:

```bash
# Create test-auth.js in scripts/
npx hardhat run scripts/test-auth.js --network localhost
```

## Expected Results Summary

| Test Case | Expected Result |
|-----------|----------------|
| Owner can authorize | ✅ Success |
| Owner can revoke | ✅ Success |
| Non-owner cannot authorize | ❌ Reverted |
| Non-owner cannot revoke | ❌ Reverted |
| Authorized agent can deposit | ✅ Success |
| Authorized agent can redeem | ✅ Success |
| Revoked agent cannot deposit | ❌ Reverted |
| Revoked agent cannot redeem | ❌ Reverted |
| Owner can operate without auth | ✅ Success |
| Unauthorized user blocked | ❌ Reverted |

## Troubleshooting

**Problem: "Caller is not an authorized Agent Vector"**
- Solution: Make sure you're connected as an authorized agent or the owner

**Problem: "Access Restricted" on Admin Panel**
- Solution: Make sure you're connected as the owner account

**Problem: Transactions failing**
- Solution: Check you have enough ETH for gas fees (Hardhat accounts have 10,000 ETH)

**Problem: Can't see contract addresses**
- Solution: Make sure you deployed contracts and set environment variables correctly

## Next Steps

After manual testing, you can:
1. Run automated tests: `npx hardhat test`
2. Test on a testnet (Sepolia, Goerli, etc.)
3. Test cross-chain teleport functionality
4. Test relayer fee system

