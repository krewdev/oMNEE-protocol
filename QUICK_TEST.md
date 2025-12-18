# Quick Test Guide - Authorization System

## 🚀 Fastest Way to Test (5 minutes)

### Step 1: Start Local Network
```bash
npm run node
```

### Step 2: Run Automated Tests
In a new terminal:
```bash
npm test
```

**Done!** ✅ If all tests pass, the authorization system works correctly.

---

## ⚡ Quick Script Test (2 minutes)

### Step 1: Start Local Network
```bash
npm run node
```

### Step 2: Run Test Script
```bash
npm run test:manual
```

**Done!** ✅ You'll see a complete test run with results.

---

## 🖥️ Full Manual Test (15 minutes)

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete manual testing instructions.

---

## 📋 Test Commands Cheat Sheet

```bash
# Automated tests (fastest)
npm test                    # All tests
npm run test:auth          # Authorization only

# Script-based test
npm run test:manual        # Quick verification

# Start local node
npm run node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Compile
npm run compile
```

---

## ✅ What Gets Tested

- ✅ Owner can authorize agents
- ✅ Owner can revoke agents
- ✅ Non-owners cannot authorize/revoke
- ✅ Authorized agents can deposit/redeem
- ✅ Revoked agents are blocked
- ✅ Re-authorization works
- ✅ Owner can operate without explicit authorization

---

## 🐛 Quick Troubleshooting

**Tests fail?**
- Make sure Hardhat node is running: `npm run node`
- Recompile: `npm run compile`

**Frontend not working?**
- Check `.env.local` has correct contract addresses
- Hard refresh browser (Ctrl+Shift+R)

**Can't connect wallet?**
- Make sure you're on the correct network (localhost:8545)
- Import test account private keys into MetaMask

---

For detailed instructions, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)

