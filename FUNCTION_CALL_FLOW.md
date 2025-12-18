# Function Call & Response Flow Diagrams

## 1. Blue Team Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ BlueTeamAuth Component  │
└──────┬──────────────────┘
       │
       ├─→ performVerification()
       │     │
       │     ├─→ generateAgentKey()
       │     │     │
       │     │     └─→ POST /generate-key
       │     │           │
       │     │           └─→ Backend Handler
       │     │                 │
       │     │                 ├─→ generateAgentKey(32)
       │     │                 │
       │     │                 └─→ Response: { key: "abc123..." }
       │     │
       │     ├─→ Wait 600ms (avoid speed trap)
       │     │
       │     └─→ testConnection()
       │           │
       │           └─→ GET /me
       │                 │
       │                 └─→ Backend Middleware
       │                       │
       │                       ├─→ Check timing
       │                       │     ├─→ < 0.5s? → Redirect /maze/1
       │                       │     └─→ >= 0.5s? → Continue
       │                       │
       │                       ├─→ Check X-Agent-Auth header
       │                       │     ├─→ Valid? → Allow (0.2s threshold)
       │                       │     └─→ Invalid? → Normal check
       │                       │
       │                       └─→ Handler
       │                             │
       │                             └─→ Response: { name: "...", ... }
       │
       └─→ onVerified(true)
             │
             └─→ Set blueTeamVerified = true
                   │
                   └─→ Enable protected actions
```

## 2. Faucet Request Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│   FaucetForm Component  │
└──────┬──────────────────┘
       │
       ├─→ BlueTeamAuth (required)
       │     └─→ [See Flow 1]
       │
       ├─→ checkFaucetStatus()
       │     │
       │     └─→ faucetContract.canRequestFaucet(address)
       │           │
       │           └─→ Smart Contract Call
       │                 │
       │                 ├─→ Check: block.timestamp >= lastFaucetRequest[user] + COOLDOWN
       │                 │
       │                 ├─→ Check: balance >= MAX_FAUCET_AMOUNT
       │                 │
       │                 └─→ Response: (canRequest: bool, timeUntil: uint256)
       │
       └─→ handleRequestFaucet()
             │
             ├─→ Check: blueTeamVerified === true
             │
             └─→ faucetContract.faucet()
                   │
                   └─→ Smart Contract: MNEEFaucet.faucet()
                         │
                         ├─→ Check: cooldown expired
                         ├─→ Check: sufficient balance
                         ├─→ lastFaucetRequest[msg.sender] = block.timestamp
                         ├─→ mneeToken.transfer(msg.sender, MAX_FAUCET_AMOUNT)
                         └─→ Emit: FaucetRequest(msg.sender, MAX_FAUCET_AMOUNT)
                               │
                               └─→ Transaction Confirmed
                                     │
                                     └─→ Frontend: refreshBalances()
```

## 3. Cross-Chain Teleport Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  TeleportForm Component │
└──────┬──────────────────┘
       │
       ├─→ BlueTeamAuth (required)
       │     └─→ [See Flow 1]
       │
       ├─→ validateAddress(chain, address)
       │     │
       │     ├─→ Solana? → Check base58, 32-44 chars
       │     ├─→ BSV? → Check format, 26-35 chars
       │     └─→ Ethereum? → ethers.isAddress()
       │
       └─→ handleTeleport()
             │
             ├─→ Check: blueTeamVerified === true
             ├─→ Check: amount > 0
             ├─→ Check: balance >= amount
             ├─→ Check: address valid
             │
             └─→ hubContract.teleportFunds(amount, chain, address)
                   │
                   └─→ Smart Contract: QuipoHub.teleportFunds()
                         │
                         ├─→ Modifier: onlyAgent
                         │     │
                         │     └─→ Check: authorizedAgents[msg.sender] || msg.sender == owner()
                         │
                         ├─→ Check: omneeToken.balanceOf(msg.sender) >= amount
                         │
                         ├─→ omneeToken.burn(msg.sender, amount)
                         │     │
                         │     └─→ OmneeToken.burn()
                         │           └─→ _burn(from, amount)
                         │
                         └─→ Emit: RedemptionRequested(msg.sender, amount, "Teleport to {chain}: {address}")
                               │
                               └─→ Off-Chain Agent Listener
                                     │
                                     ├─→ Monitor events
                                     ├─→ Parse destination
                                     ├─→ Execute on target chain
                                     └─→ Update cross-chain ledger
```

## 4. Bot Detection & Trapping Flow

```
┌─────────────┐
│     Bot     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Backend Middleware     │
└──────┬──────────────────┘
       │
       ├─→ Extract: clientIp = req.ip
       ├─→ Extract: currentTime = Date.now() / 1000
       │
       ├─→ Skip check? (stats, maze, generate-key)
       │     └─→ YES → Allow through
       │
       ├─→ Check: X-Agent-Auth header
       │     │
       │     └─→ Matches FRIENDLY_AGENT_KEY?
       │           └─→ YES → Allow (0.2s threshold)
       │
       └─→ Speed Trap Check
             │
             ├─→ lastRequestTime = requestLog.get(clientIp)
             ├─→ timeDiff = currentTime - lastRequestTime
             │
             ├─→ timeDiff < 0.5s?
             │     │
             │     └─→ YES → Redirect 307 to /maze/1
             │           │
             │           └─→ Bot follows redirect
             │                 │
             │                 └─→ GET /maze/1 Handler
             │                       │
             │                       ├─→ Update: activeTraps[clientIp] = {level: 1, lastSeen: now}
             │                       ├─→ Increment: totalTrappedCount++
             │                       ├─→ Wait: 2 seconds (tarpit)
             │                       ├─→ Generate: fake product data
             │                       └─→ Return: HTML with links to /maze/2
             │
             └─→ timeDiff >= 0.5s?
                   │
                   └─→ Allow request
                         │
                         └─→ Update: requestLog[clientIp] = currentTime
```

## 5. Dashboard Stats Update Flow

```
┌─────────────────────────┐
│  Dashboard Component   │
└──────┬──────────────────┘
       │
       ├─→ TrapMonitor Component
       │     │
       │     └─→ useEffect() → fetchStats()
       │           │
       │           └─→ GET /stats/trapped (every 2s)
       │                 │
       │                 └─→ Backend Handler
       │                       │
       │                       ├─→ currentTime = Date.now() / 1000
       │                       ├─→ Filter: activeTraps (last 30s)
       │                       ├─→ Format: activeBots array
       │                       └─→ Response: {
       │                             trappedCount: totalTrappedCount,
       │                             activeBots: [{ip, level}, ...]
       │                           }
       │
       ├─→ ProtocolStats Hook
       │     │
       │     └─→ useProtocolStats()
       │           │
       │           ├─→ mneeContract.balanceOf(HUB_ADDRESS)
       │           │     │
       │           │     └─→ Smart Contract Call
       │           │           └─→ Returns: uint256 balance
       │           │
       │           └─→ omTokenContract.totalSupply()
       │                 │
       │                 └─→ Smart Contract Call
       │                       └─→ Returns: uint256 supply
       │
       └─→ BalanceCard Component
             │
             └─→ useBalances()
                   │
                   ├─→ mneeContract.balanceOf(address)
                   └─→ omTokenContract.balanceOf(address)
```

## 6. Deposit & Mint Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│   DepositForm Component │
└──────┬──────────────────┘
       │
       ├─→ checkApprovalStatus()
       │     │
       │     └─→ mneeContract.allowance(address, HUB_ADDRESS)
       │           │
       │           └─→ Smart Contract Call
       │                 └─→ Returns: uint256 allowance
       │
       ├─→ If not approved → handleApprove()
       │     │
       │     └─→ mneeContract.approve(HUB_ADDRESS, amount)
       │           │
       │           └─→ Smart Contract: IERC20.approve()
       │                 │
       │                 └─→ Transaction Confirmed
       │
       └─→ handleDeposit()
             │
             └─→ hubContract.depositAndMint(amount, metadata)
                   │
                   └─→ Smart Contract: QuipoHub.depositAndMint()
                         │
                         ├─→ Modifier: onlyAgent
                         ├─→ Check: amount > 0
                         ├─→ officialMneeToken.transferFrom(msg.sender, this, amount)
                         │     │
                         │     └─→ IERC20.transferFrom()
                         │           └─→ Transfers MNEE to hub
                         │
                         ├─→ omneeToken.mint(msg.sender, amount)
                         │     │
                         │     └─→ OmneeToken.mint()
                         │           └─→ _mint(to, amount)
                         │
                         └─→ Emit: CollateralLocked(msg.sender, amount, metadata)
                               │
                               └─→ Frontend: refreshBalances()
```

## 7. Event Monitoring Flow

```
┌─────────────────────────┐
│  useEvents Hook        │
└──────┬──────────────────┘
       │
       └─→ useEffect() → setupEventListeners()
             │
             ├─→ hubContract.on("CollateralLocked", ...)
             │     │
             │     └─→ Event: (agent, amount, purpose)
             │           │
             │           └─→ Update: events state
             │
             ├─→ hubContract.on("RedemptionRequested", ...)
             │     │
             │     └─→ Event: (agent, amount, destination)
             │           │
             │           └─→ Update: events state
             │
             ├─→ omTokenContract.on("OmniTransfer", ...)
             │     │
             │     └─→ Event: (from, to, value, metadata)
             │           │
             │           └─→ Update: events state
             │
             └─→ hubContract.on("AgentAuthorized", ...)
                   │
                   └─→ Event: (agent)
                         │
                         └─→ Update: events state
                               │
                               └─→ Components re-render with new events
```

## 8. Agent Authorization Flow

```
┌─────────────┐
│   Owner    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│   AdminPanel Component  │
└──────┬──────────────────┘
       │
       ├─→ Check: isOwner === true
       │
       └─→ handleAuthorizeAgent()
             │
             └─→ hubContract.authorizeAgent(agentAddress)
                   │
                   └─→ Smart Contract: QuipoHub.authorizeAgent()
                         │
                         ├─→ Modifier: onlyOwner
                         ├─→ authorizedAgents[_agent] = true
                         └─→ Emit: AgentAuthorized(_agent)
                               │
                               └─→ Frontend: checkAuthorization()
                                     │
                                     └─→ Updates authorization status
```

## Response Format Examples

### Backend API Responses

#### `/stats/trapped`
```json
{
  "trappedCount": 42,
  "activeBots": [
    {"ip": "192.168.1.5", "level": 3},
    {"ip": "10.0.0.1", "level": 7}
  ]
}
```

#### `/generate-key`
```json
{
  "key": "wp1TLVkBwROGLxfBwfcQebSTZgd7bBSt"
}
```

#### `/me`
```json
{
  "name": "OMNEE Protocol",
  "jobTitle": "Universal Settlement Layer",
  "location": "Ethereum Mainnet",
  "availability": {
    "status": "Online",
    "nextOpenSlot": "Always available"
  },
  "knowsAbout": [
    "Cross-chain operations",
    "Bot detection"
  ],
  "contact": {
    "email": "info@omnee.protocol",
    "github": "https://github.com/krewdev/oMNEE-protocol"
  }
}
```

### Smart Contract Responses

#### `authorizedAgents(address)`
```solidity
Returns: bool
Example: true
```

#### `balanceOf(address)`
```solidity
Returns: uint256
Example: 1000000000000000000 (1 token with 18 decimals)
```

#### `canRequestFaucet(address)`
```solidity
Returns: (bool canRequest, uint256 timeUntilNextRequest)
Example: (false, 1800) // Can't request, 30 min remaining
```

---

## Error Handling Flows

### Frontend Error Handling

```
User Action → Component Function
  │
  ├─→ Try block
  │     │
  │     └─→ Contract/API call
  │           │
  │           ├─→ Success → Update UI
  │           │
  │           └─→ Error → Catch block
  │                 │
  │                 ├─→ Set error state
  │                 ├─→ Display error message
  │                 └─→ Log to console
  │
  └─→ Finally block
        └─→ Reset loading state
```

### Backend Error Handling

```
Request → Middleware
  │
  ├─→ Try block
  │     │
  │     └─→ Handler function
  │           │
  │           ├─→ Success → Return response
  │           │
  │           └─→ Error → Catch block
  │                 │
  │                 ├─→ Log error
  │                 └─→ Return error response
  │
  └─→ Middleware errors
        └─→ Redirect to maze (bot trap)
```

---

This document provides complete function call flows for understanding the system's operation at a detailed level.

