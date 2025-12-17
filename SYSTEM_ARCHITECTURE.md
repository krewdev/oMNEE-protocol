# OMNEE Protocol - Complete System Architecture

## System Overview

The OMNEE Protocol is a Universal Settlement Layer for AI Agents built on Ethereum, enabling cross-chain operations with bot detection and protection. The system consists of:

1. **Smart Contracts** (Solidity) - On-chain protocol logic
2. **Frontend** (React + TypeScript) - User interface and Web3 integration
3. **Backend** (Node.js/Express) - Bot detection and trap system
4. **Blue Team Auth** - Bot protection middleware

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER/AGENT                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Dashboard  │  │   Faucet     │  │  Teleport    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│  ┌──────▼─────────────────▼──────────────────▼──────┐         │
│  │         BlueTeamAuth Component                     │         │
│  │  - Generates agent key                             │         │
│  │  - Verifies bot status                             │         │
│  │  - Handles authentication                         │         │
│  └──────┬────────────────────────────────────────────┘         │
│         │                                                       │
│  ┌──────▼────────────────────────────────────────────┐         │
│  │         Web3Context                                │         │
│  │  - Wallet connection (MetaMask)                    │         │
│  │  - Provider/Signer management                       │         │
│  └──────┬────────────────────────────────────────────┘         │
└─────────┼──────────────────────────────────────────────────────┘
          │
          ├─────────────────┐
          │                 │
          ▼                 ▼
┌─────────────────┐  ┌─────────────────────────────────┐
│  Ethereum RPC   │  │  Blue Team Backend (Port 8000)  │
│  (MetaMask/Infura)│  │  ┌──────────────────────────┐ │
└────────┬────────┘  │  │  Speed Trap Middleware     │ │
         │           │  │  - Request timing check    │ │
         │           │  │  - Bot detection           │ │
         │           │  │  - Maze redirect           │ │
         │           │  └──────────┬─────────────────┘ │
         │           │             │                     │
         │           │  ┌──────────▼─────────────────┐ │
         │           │  │  API Endpoints             │ │
         │           │  │  - /stats/trapped          │ │
         │           │  │  - /maze/:level            │ │
         │           │  │  - /generate-key          │ │
         │           │  │  - /me                     │ │
         │           │  └────────────────────────────┘ │
         │           └─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           SMART CONTRACTS (Ethereum)                │
│  ┌──────────────────────────────────────────────┐   │
│  │  QuipoHub (Main Protocol)                   │   │
│  │  - Manages MNEE collateral                  │   │
│  │  - Authorizes agents                        │   │
│  │  - Handles deposits/redemptions             │   │
│  │  - Cross-chain teleport events              │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐   │
│  │  OmneeToken (omMNEE)                         │   │
│  │  - ERC20 token                               │   │
│  │  - Metadata transfers                        │   │
│  │  - Minted/burned by Hub                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  MNEEFaucet (Test Token Distribution)        │   │
│  │  - Faucet functionality                      │   │
│  │  - Cooldown protection                       │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Function Call Flow Diagrams

### 1. Faucet Request Flow (with Bot Protection)

```
User → FaucetForm Component
  │
  ├─→ BlueTeamAuth.performVerification()
  │     │
  │     ├─→ generateAgentKey()
  │     │     └─→ POST /generate-key
  │     │           └─→ Backend: Generate random key
  │     │                 └─→ Response: { key: "abc123..." }
  │     │
  │     ├─→ Wait 600ms (avoid speed trap)
  │     │
  │     └─→ testConnection()
  │           └─→ GET /me (with X-Agent-Auth header)
  │                 │
  │                 ├─→ Backend Middleware
  │                 │     ├─→ Check X-Agent-Auth header
  │                 │     ├─→ Check request timing
  │                 │     └─→ Allow/Redirect decision
  │                 │
  │                 └─→ Response: { verified: true } or redirect
  │
  ├─→ Verification Success → Enable faucet button
  │
  └─→ handleRequestFaucet()
        └─→ faucetContract.faucet()
              └─→ Smart Contract: MNEEFaucet.faucet()
                    ├─→ Check cooldown
                    ├─→ Check balance
                    └─→ Transfer MNEE tokens
```

### 2. Cross-Chain Teleport Flow (with Bot Protection)

```
User → TeleportForm Component
  │
  ├─→ BlueTeamAuth.performVerification()
  │     └─→ [Same as above]
  │
  ├─→ Verification Success → Enable teleport button
  │
  └─→ handleTeleport()
        └─→ hubContract.teleportFunds(amount, chain, address)
              └─→ Smart Contract: QuipoHub.teleportFunds()
                    ├─→ Check: onlyAgent modifier
                    ├─→ Check: sufficient omMNEE balance
                    ├─→ Burn omMNEE tokens
                    └─→ Emit: RedemptionRequested event
                          │
                          └─→ Agent Listener (off-chain)
                                └─→ Process cross-chain mint/transfer
```

### 3. Bot Detection Flow

```
Bot Request → Backend Middleware
  │
  ├─→ Extract client IP
  ├─→ Check request timing
  │     │
  │     ├─→ < 0.5s since last request?
  │     │     └─→ YES → Redirect to /maze/1
  │     │
  │     └─→ >= 0.5s?
  │           └─→ Check X-Agent-Auth header
  │                 │
  │                 ├─→ Valid key?
  │                 │     └─→ YES → Allow (0.2s threshold)
  │                 │
  │                 └─→ NO → Allow request
  │
  └─→ If redirected to maze:
        ├─→ Update activeTraps map
        ├─→ Increment totalTrappedCount
        ├─→ Generate fake product page
        ├─→ Add 2 second delay
        └─→ Return HTML with infinite links
```

### 4. Dashboard Stats Flow

```
Dashboard Component
  │
  ├─→ TrapMonitor Component
  │     │
  │     └─→ useEffect() → fetchStats()
  │           └─→ GET /stats/trapped (every 2 seconds)
  │                 │
  │                 └─→ Backend: Calculate stats
  │                       ├─→ Filter active bots (last 30s)
  │                       └─→ Response: {
  │                             trappedCount: number,
  │                             activeBots: [{ ip, level }]
  │                           }
  │
  ├─→ ProtocolStats Hook
  │     └─→ useProtocolStats()
  │           ├─→ mneeContract.balanceOf(HUB_ADDRESS)
  │           └─→ omTokenContract.totalSupply()
  │
  └─→ BalanceCard Component
        └─→ useBalances()
              ├─→ mneeContract.balanceOf(address)
              └─→ omTokenContract.balanceOf(address)
```

---

## API Endpoints & Responses

### Backend API (Port 8000)

#### `GET /stats/trapped`
**Purpose:** Get bot detection statistics

**Response:**
```json
{
  "trappedCount": 42,
  "activeBots": [
    { "ip": "192.168.1.5", "level": 3 },
    { "ip": "10.0.0.1", "level": 7 }
  ]
}
```

**Function Flow:**
```
Request → Middleware (skip check) → Handler
  ├─→ Filter activeTraps (last 30s)
  ├─→ Count total trapped
  └─→ Return JSON
```

#### `GET /maze/:level`
**Purpose:** Bot trap - infinite maze

**Response:** HTML page with fake product data

**Function Flow:**
```
Request → Middleware (skip check) → Handler
  ├─→ Extract level from URL
  ├─→ Update activeTraps[ip] = { level, lastSeen }
  ├─→ Increment totalTrappedCount (if new)
  ├─→ Wait 2 seconds (tarpit delay)
  ├─→ Generate fake mouse trap product data
  ├─→ Create HTML with infinite links to next level
  └─→ Return HTML
```

#### `POST /generate-key`
**Purpose:** Generate agent authentication key

**Response:**
```json
{
  "key": "wp1TLVkBwROGLxfBwfcQebSTZgd7bBSt"
}
```

**Function Flow:**
```
Request → Middleware (skip check) → Handler
  ├─→ Generate random 32-char key
  └─→ Return JSON
```

#### `GET /me`
**Purpose:** Personal API info (protected by speed trap)

**Response:**
```json
{
  "name": "OMNEE Protocol",
  "jobTitle": "Universal Settlement Layer",
  "location": "Ethereum Mainnet",
  "availability": { "status": "Online" },
  "knowsAbout": ["Cross-chain operations", "Bot detection"],
  "contact": { "email": "info@omnee.protocol" }
}
```

**Function Flow:**
```
Request → Middleware (speed trap check)
  ├─→ Check timing (< 0.5s?) → Redirect to /maze/1
  ├─→ Check X-Agent-Auth → Allow if valid
  └─→ Handler → Read me.json → Return JSON
```

---

## Smart Contract Functions

### QuipoHub Contract

#### `authorizeAgent(address _agent)`
**Modifier:** `onlyOwner`
**Event:** `AgentAuthorized(address indexed agent)`

**Flow:**
```
Owner → authorizeAgent(0x...)
  └─→ authorizedAgents[_agent] = true
      └─→ Emit event
```

#### `depositAndMint(uint256 amount, string metadata)`
**Modifier:** `onlyAgent`
**Event:** `CollateralLocked(address indexed agent, uint256 amount, string purpose)`

**Flow:**
```
Agent → depositAndMint(amount, "Purpose")
  ├─→ Check: onlyAgent modifier
  ├─→ officialMneeToken.transferFrom(agent, hub, amount)
  ├─→ omneeToken.mint(agent, amount)
  └─→ Emit CollateralLocked event
```

#### `redeem(uint256 amount)`
**Modifier:** `onlyAgent`
**Event:** `RedemptionRequested(address indexed agent, uint256 amount, string destination)`

**Flow:**
```
Agent → redeem(amount)
  ├─→ Check: onlyAgent modifier
  ├─→ Check: omneeToken.balanceOf(agent) >= amount
  ├─→ omneeToken.burn(agent, amount)
  ├─→ officialMneeToken.transfer(agent, amount)
  └─→ Emit RedemptionRequested event
```

#### `teleportFunds(uint256 amount, string targetChain, string targetAddress)`
**Modifier:** `onlyAgent`
**Event:** `RedemptionRequested(address indexed agent, uint256 amount, string destination)`

**Flow:**
```
Agent → teleportFunds(amount, "Solana", "address")
  ├─→ Check: onlyAgent modifier
  ├─→ Check: omneeToken.balanceOf(agent) >= amount
  ├─→ omneeToken.burn(agent, amount)
  └─→ Emit RedemptionRequested("Teleport to Solana: address")
      └─→ Agent Listener processes off-chain
```

### OmneeToken Contract

#### `mint(address to, uint256 amount)`
**Modifier:** `onlyOwner` (Hub is owner)

**Flow:**
```
Hub → omneeToken.mint(agent, amount)
  └─→ _mint(to, amount)
```

#### `burn(address from, uint256 amount)`
**Modifier:** `onlyOwner` (Hub is owner)

**Flow:**
```
Hub → omneeToken.burn(agent, amount)
  └─→ _burn(from, amount)
```

#### `transferWithMetadata(address to, uint256 value, string metadata)`
**Event:** `OmniTransfer(address indexed from, address indexed to, uint256 value, string metadata)`

**Flow:**
```
User → omneeToken.transferWithMetadata(to, value, "Invoice #123")
  ├─→ _transfer(msg.sender, to, value)
  └─→ Emit OmniTransfer event
```

### MNEEFaucet Contract

#### `faucet()`
**Event:** `FaucetRequest(address indexed to, uint256 amount)`

**Flow:**
```
User → faucet()
  ├─→ Check: block.timestamp >= lastFaucetRequest[user] + COOLDOWN
  ├─→ Check: balance >= MAX_FAUCET_AMOUNT
  ├─→ lastFaucetRequest[user] = block.timestamp
  ├─→ mneeToken.transfer(user, MAX_FAUCET_AMOUNT)
  └─→ Emit FaucetRequest event
```

---

## Frontend Component Structure

### Page Components

```
App.tsx (Root)
  └─→ BrowserRouter
      └─→ Layout
          └─→ Routes
              ├─→ / → Dashboard
              ├─→ /deposit → DepositPage
              ├─→ /redeem → RedeemPage
              ├─→ /transfer → TransferPage
              ├─→ /teleport → TeleportPage
              ├─→ /faucet → FaucetPage
              ├─→ /create-wallet → WalletCreatorPage
              ├─→ /history → HistoryPage
              └─→ /admin → AdminPage
```

### Key Components

#### Web3Context
**Purpose:** Global Web3 state management

**State:**
- `provider`: ethers.BrowserProvider
- `signer`: ethers.JsonRpcSigner
- `address`: string | null
- `isConnected`: boolean
- `chainId`: number | null

**Functions:**
- `connectWallet()`: Connect MetaMask
- `disconnectWallet()`: Disconnect and cleanup

#### BlueTeamAuth
**Purpose:** Bot verification component

**State:**
- `isVerified`: boolean
- `isLoading`: boolean
- `agentKey`: string | null
- `error`: string | null

**Functions:**
- `generateAgentKey()`: POST /generate-key
- `testConnection()`: GET /me with auth
- `performVerification()`: Full verification flow

#### TrapMonitor
**Purpose:** Real-time bot trap statistics

**State:**
- `stats`: { trappedCount, activeBots }
- `loading`: boolean
- `counterAnimating`: boolean

**Functions:**
- `fetchStats()`: GET /stats/trapped (every 2s)

#### FaucetForm
**Purpose:** Request test tokens

**State:**
- `amount`: string
- `blueTeamVerified`: boolean
- `canRequest`: boolean
- `requesting`: boolean

**Functions:**
- `handleRequestFaucet()`: Call faucet contract
- `checkFaucetStatus()`: Check cooldown

#### TeleportForm
**Purpose:** Cross-chain teleport

**State:**
- `amount`: string
- `targetChain`: SupportedChain
- `targetAddress`: string
- `blueTeamVerified`: boolean

**Functions:**
- `handleTeleport()`: Call hub.teleportFunds()
- `validateAddress()`: Chain-specific validation

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
1. User opens app
   └─→ Web3Context.autoConnect()
       └─→ Check window.ethereum
           └─→ If connected → Set provider/signer

2. User clicks "Connect"
   └─→ connectWallet()
       ├─→ window.ethereum.request("eth_requestAccounts")
       ├─→ Create BrowserProvider
       ├─→ Get signer
       ├─→ Get address
       └─→ Set up event listeners

3. User navigates to protected page
   └─→ BlueTeamAuth component mounts
       ├─→ Auto-verify if address exists
       └─→ performVerification()
           ├─→ Generate agent key
           ├─→ Wait 600ms
           └─→ Test connection
```

### 2. Bot Detection & Trapping Flow

```
1. Bot makes rapid request
   └─→ Backend Middleware
       ├─→ Extract IP: "192.168.1.5"
       ├─→ Check timing: 0.1s since last
       └─→ TOO FAST → Redirect 307 to /maze/1

2. Bot follows redirect
   └─→ GET /maze/1
       ├─→ Update activeTraps["192.168.1.5"] = { level: 1, lastSeen: now }
       ├─→ Increment totalTrappedCount
       ├─→ Wait 2 seconds
       ├─→ Generate fake product HTML
       └─→ Return with links to /maze/2

3. Bot crawls deeper
   └─→ Follows link to /maze/2
       └─→ Same process, level increases

4. Frontend monitors
   └─→ TrapMonitor polls /stats/trapped
       └─→ Updates UI with:
           - Total trapped count
           - Active bots list
           - Maze depth visualization
```

### 3. Cross-Chain Teleport Flow

```
1. User fills teleport form
   ├─→ Amount: 100 omMNEE
   ├─→ Target Chain: "Solana"
   └─→ Target Address: "SolanaPubKey..."

2. Blue Team verification
   └─→ BlueTeamAuth verifies user
       └─→ Sets blueTeamVerified = true

3. User clicks "Teleport"
   └─→ handleTeleport()
       ├─→ Validate inputs
       ├─→ Check blueTeamVerified
       └─→ hubContract.teleportFunds(amount, chain, address)
           └─→ Smart Contract Execution:
               ├─→ Check: onlyAgent modifier
               ├─→ Check: balance >= amount
               ├─→ omneeToken.burn(msg.sender, amount)
               └─→ Emit RedemptionRequested event
                   │
                   └─→ Off-chain Agent Listener
                       ├─→ Listen for event
                       ├─→ Parse destination
                       ├─→ Execute on Solana
                       └─→ Update cross-chain ledger
```

---

## Complete Site Description

### Frontend Application (React + TypeScript + Vite)

**Technology Stack:**
- React 18.3.1
- TypeScript 5.8.0
- Vite 6.0.5
- Ethers.js 6.16.0
- React Router 6.28.0
- Tailwind CSS 3.4.17
- Lucide React (icons)

**Pages:**

1. **Dashboard** (`/`)
   - Protocol overview
   - Balance cards (MNEE, omMNEE)
   - Protocol statistics
   - Quick action links
   - Recent activity feed
   - **Bot Trap Monitor** (new) - Real-time bot detection stats

2. **Deposit Page** (`/deposit`)
   - DepositForm component
   - Lock MNEE → Mint omMNEE
   - Requires authorization
   - Approval flow for MNEE token

3. **Redeem Page** (`/redeem`)
   - RedeemForm component
   - Burn omMNEE → Get MNEE back
   - Requires authorization

4. **Transfer Page** (`/transfer`)
   - TransferForm component
   - Transfer omMNEE with metadata
   - Rich transfer functionality

5. **Teleport Page** (`/teleport`)
   - TeleportForm component
   - Cross-chain operations
   - **Blue Team verification required**
   - Chain selection (Solana, BSV, etc.)
   - Address validation per chain

6. **Faucet Page** (`/faucet`)
   - FaucetForm component
   - Request test MNEE tokens
   - **Blue Team verification required**
   - Cooldown protection
   - Balance display

7. **Create Wallet Page** (`/create-wallet`)
   - WalletCreator component
   - Generate new wallets
   - Import from mnemonic/private key
   - Download private key/JSON wallet
   - Security warnings

8. **History Page** (`/history`)
   - TransactionHistory component
   - Event monitoring
   - Transaction logs

9. **Admin Page** (`/admin`)
   - AdminPanel component
   - Authorize agents
   - Protocol statistics
   - Authorized agents list
   - Owner-only access

**Key Features:**

- **Web3 Integration:**
  - MetaMask wallet connection
  - Auto-connect on page load
  - Account/chain change listeners
  - Provider/signer management

- **Bot Protection:**
  - Blue Team authentication on faucet/teleport
  - Agent key generation
  - Verification before sensitive operations
  - Real-time bot trap monitoring

- **UI/UX:**
  - Retro/cyberpunk theme
  - CRT screen effects
  - Animated backgrounds
  - Responsive design
  - Loading states
  - Error handling

### Backend Server (Node.js + Express)

**Technology Stack:**
- Node.js
- Express 4.18.2
- CORS 2.8.5

**Endpoints:**

1. `GET /stats/trapped` - Bot statistics
2. `GET /maze/:level` - Bot trap (infinite maze)
3. `GET /me` - Personal API (protected)
4. `POST /generate-key` - Generate agent key
5. `GET /verify-wallet/:address` - Wallet verification

**Middleware:**
- CORS configuration
- Speed trap detection (< 0.5s threshold)
- Agent key authentication
- Request logging

**Data Structures:**
- `activeTraps`: Map<IP, {level, lastSeen}>
- `requestLog`: Map<IP, timestamp>
- `totalTrappedCount`: number

### Smart Contracts (Solidity 0.8.20)

**Contracts:**

1. **QuipoHub** (Main Protocol)
   - Manages MNEE collateral
   - Authorizes agents
   - Handles deposits/redemptions
   - Cross-chain teleport events
   - Uses OpenZeppelin Ownable

2. **OmneeToken** (omMNEE)
   - ERC20 token
   - Metadata transfers
   - Mint/burn by Hub only
   - Uses OpenZeppelin ERC20, Ownable

3. **MNEEFaucet**
   - Test token distribution
   - Cooldown protection
   - Uses official MNEE token (0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF)

**Security:**
- Access control via modifiers
- Reentrancy protection (OpenZeppelin)
- Input validation
- Event emission for off-chain tracking

---

## Integration Points

### Frontend ↔ Backend
- REST API calls to Blue Team backend
- Agent key in headers
- Real-time stats polling

### Frontend ↔ Blockchain
- Ethers.js provider/signer
- Contract interactions
- Event listening
- Transaction signing

### Backend ↔ Blockchain
- None (backend is stateless)
- Frontend handles all on-chain operations

### Off-Chain Components
- Agent Listener (separate service)
- Monitors RedemptionRequested events
- Executes cross-chain operations
- Updates cross-chain ledger

---

## Security Model

### On-Chain
- `onlyAgent` modifier restricts access
- `onlyOwner` for admin functions
- Balance checks before operations
- Event emission for auditability

### Off-Chain (Backend)
- Speed trap detects rapid requests
- Agent key authentication
- IP-based tracking
- Infinite maze wastes bot resources

### Frontend
- Blue Team verification before sensitive ops
- Wallet connection required
- Authorization checks
- Input validation

---

## Performance Considerations

- Frontend polls stats every 2 seconds
- Backend uses in-memory storage (Redis recommended for production)
- Smart contracts optimized with OpenZeppelin
- Event-driven architecture for scalability

---

## Deployment Architecture

```
Production:
├── Frontend (Vite build) → Static hosting (Vercel/Netlify)
├── Backend (Node.js) → Cloud server (Railway/Render)
├── Smart Contracts → Ethereum Mainnet
└── Agent Listener → Separate service (monitors events)
```

---

## Testing

- Test bot script (`backend/test_bot.py`)
- Manual testing via frontend
- Contract testing (Hardhat)
- Integration testing (end-to-end flows)

---

This architecture enables secure, bot-protected cross-chain operations for AI agents while maintaining transparency and auditability through on-chain events and off-chain monitoring.
