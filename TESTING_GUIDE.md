# Complete Testing Guide - Authorization & Revocation

This guide covers all methods to test the authorization and revocation system.

## 🎯 Testing Methods Overview

1. **Automated Tests** (Recommended) - Fast, repeatable, comprehensive
2. **Script-Based Tests** - Quick verification without frontend
3. **Manual Frontend Tests** - Full UI/UX testing
4. **Integration Tests** - End-to-end workflow testing

---

## 🚀 Method 1: Automated Tests (Best for Development)

### Setup

```bash
# Install dependencies (if not already done)
npm install

# Compile contracts
npm run compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run only authorization tests
npm run test:auth

# Run with coverage (if configured)
npx hardhat coverage
```

### What Gets Tested

✅ Authorization flow (authorize, revoke)  
✅ Access control (owner vs agents)  
✅ Operation permissions (deposit, redeem)  
✅ Revocation effects  
✅ Re-authorization  
✅ Edge cases and error handling  

### Expected Output

```
  QuipoHub Authorization System
    Authorization
      ✓ Should allow owner to authorize an agent
      ✓ Should not allow non-owner to authorize agents
      ✓ Should allow owner to revoke an agent
      ✓ Should not allow revoking non-authorized agent
      ✓ Should not allow non-owner to revoke agents
    Authorized Agent Operations
      ✓ Should allow authorized agent to deposit and mint
      ✓ Should not allow unauthorized agent to deposit
      ✓ Should prevent revoked agent from depositing
      ✓ Should allow authorized agent to redeem
      ✓ Should prevent revoked agent from redeeming
    Owner Privileges
      ✓ Owner should be able to perform operations without authorization

  11 passing
```

---

## ⚡ Method 2: Script-Based Testing (Quick Verification)

### Setup Local Network

**Terminal 1:**
```bash
npx hardhat node
```
Keep this running - it provides a local blockchain with test accounts.

### Run Test Script

**Terminal 2:**
```bash
npm run test:manual
```

### What Gets Tested

✅ Contract deployment  
✅ Authorization  
✅ Revocation  
✅ Deposit operations  
✅ Access control  
✅ Re-authorization  

### Expected Output

```
🧪 Testing Authorization System...

📋 Test Accounts:
   Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Agent 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   ...

🔐 Test 1: Authorizing Agent 1...
   ✅ Agent 1 authorized: true

🚫 Test 2: Unauthorized agent trying to deposit (should fail)...
   ✅ Correctly rejected unauthorized agent

💵 Test 3: Authorized Agent 1 depositing...
   ✅ Agent 1 omMNEE balance: 100.0

...

🎉 All tests passed!
```

---

## 🖥️ Method 3: Manual Frontend Testing (Full UI/UX)

### Complete Setup

1. **Start Hardhat Node:**
   ```bash
   npm run node
   ```

2. **Deploy Contracts:**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Configure Frontend:**
   Create `frontend/.env.local`:
   ```env
   VITE_HUB_ADDRESS=<hub-address>
   VITE_OM_TOKEN_ADDRESS=<om-token-address>
   VITE_MNEE_ADDRESS=<mnee-address>
   VITE_RPC_URL=http://localhost:8545
   ```

4. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Test Accounts (Hardhat Default)

Import these into MetaMask:

| Account | Address | Private Key | Role |
|---------|---------|-------------|------|
| Owner | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` | Hub Owner |
| Agent 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d2` | Test Agent |
| Agent 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` | Test Agent |
| Unauthorized | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` | Unauthorized |

### Testing Checklist

- [ ] **Connect as Owner**
  - [ ] Verify "Owner Access" status shown
  - [ ] Admin Panel accessible

- [ ] **Authorize Agent 1**
  - [ ] Enter address in Admin Panel
  - [ ] Click "Authorize"
  - [ ] Confirm transaction
  - [ ] Agent appears in list

- [ ] **Test as Agent 1**
  - [ ] Switch to Agent 1 wallet
  - [ ] Verify "Authorized" status
  - [ ] Access Deposit page ✅
  - [ ] Access Transfer page ✅
  - [ ] Access Redeem page ✅
  - [ ] Access Teleport page ✅

- [ ] **Test Deposit (Agent 1)**
  - [ ] Get MNEE from faucet
  - [ ] Approve Hub to spend MNEE
  - [ ] Deposit and mint omMNEE
  - [ ] Verify balance updated

- [ ] **Revoke Agent 1**
  - [ ] Switch to Owner
  - [ ] Click "Revoke" next to Agent 1
  - [ ] Confirm transaction
  - [ ] Agent removed from list

- [ ] **Verify Revocation**
  - [ ] Switch to Agent 1
  - [ ] Verify "Not Authorized" status
  - [ ] All operation pages show "Not Authorized" message

- [ ] **Test Re-Authorization**
  - [ ] Owner re-authorizes Agent 1
  - [ ] Agent 1 access restored

See [test/ManualTestGuide.md](./test/ManualTestGuide.md) for detailed step-by-step instructions.

---

## 🔗 Method 4: Integration Testing

### Test Complete Workflow

```bash
# Terminal 1: Start node
npm run node

# Terminal 2: Run integration test
npx hardhat run scripts/test-auth.js --network localhost
```

### Workflow Tested

1. Deploy contracts
2. Authorize agent
3. Deposit MNEE → mint omMNEE
4. Transfer omMNEE with metadata
5. Revoke agent
6. Verify revocation blocks operations
7. Re-authorize agent
8. Redeem omMNEE → get MNEE back

---

## 📊 Test Coverage Summary

| Feature | Automated | Script | Manual | Integration |
|---------|-----------|--------|--------|-------------|
| Authorization | ✅ | ✅ | ✅ | ✅ |
| Revocation | ✅ | ✅ | ✅ | ✅ |
| Access Control | ✅ | ✅ | ✅ | ✅ |
| Deposit | ✅ | ✅ | ✅ | ✅ |
| Redeem | ✅ | ✅ | ✅ | ✅ |
| Transfer | ❌ | ❌ | ✅ | ✅ |
| Teleport | ❌ | ❌ | ✅ | ✅ |
| UI/UX | ❌ | ❌ | ✅ | ❌ |
| Events | ✅ | ✅ | ✅ | ✅ |

---

## 🐛 Troubleshooting

### Problem: Tests fail with "OwnableUnauthorizedAccount"

**Solution:** Make sure you're using the correct signer. The owner is the deployer.

### Problem: "Caller is not an authorized Agent Vector"

**Solution:** 
- Verify the agent was authorized: `await hub.authorizedAgents(agentAddress)`
- Make sure you're calling with the correct signer

### Problem: Frontend shows "Not Authorized" but contract says authorized

**Solution:**
- Check environment variables are correct
- Verify contract address matches deployment
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors

### Problem: Hardhat node stops responding

**Solution:**
- Restart the node
- Clear cache: `npx hardhat clean`
- Recompile: `npm run compile`

---

## 🎯 Quick Test Commands Reference

```bash
# Run all automated tests
npm test

# Run authorization tests only
npm run test:auth

# Start local node
npm run node

# Run script-based test
npm run test:manual

# Compile contracts
npm run compile

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost
```

---

## 📝 Best Practices

1. **Always run automated tests first** - They're fastest and catch most issues
2. **Use script tests for quick verification** - Great for checking after code changes
3. **Manual testing for UI/UX** - Essential before user-facing releases
4. **Test on testnet before mainnet** - Always verify on a public testnet first
5. **Keep test accounts separate** - Don't use production keys in tests

---

## 🚀 Next Steps

After testing locally:

1. **Test on Testnet** (Sepolia, Goerli)
   - Deploy contracts to testnet
   - Test with real network conditions
   - Verify gas costs

2. **Load Testing**
   - Test with multiple concurrent operations
   - Verify event handling under load

3. **Security Audit**
   - Review access control logic
   - Test edge cases
   - Consider formal verification

4. **Documentation**
   - Update user guides
   - Document authorization process
   - Create video tutorials

---

For detailed manual testing steps, see: [test/ManualTestGuide.md](./test/ManualTestGuide.md)

