# QUIPO Protocol

QUIPO: The Omnichain Settlement Layer for Agentic Economies.

## Overview

The QUIPO Protocol is a Universal Settlement Token system designed for AI Agents. It creates a programmable layer on top of the MNEE token, enabling Rich Transfers with metadata for RWA (Real World Asset) tokenization and cross-chain operations.

## Architecture

The protocol consists of two main smart contracts:

### 1. OmneeToken.sol (omMNEE)

The Universal Settlement Token - a programmable "wrapper" token that represents locked MNEE on a 1:1 basis.

**Key Features:**
- ERC20-compliant token with extended functionality
- Metadata-enabled transfers for Agentic tracking
- Only mintable/burnable by the OmneeHub contract
- Enables RWA data attachment (Invoice IDs, Task hashes, etc.)

**Special Functions:**
- `transferWithMetadata()` - Transfer tokens with attached metadata for tracking

### 2. QuipoHub.sol

The "Central Bank" vault contract that manages MNEE collateral and controls omMNEE minting/burning.

**Key Features:**
- Manages the official MNEE token collateral (0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF)
- Authorizes AI Agent "Vectors" for operations
- Enforces 1:1 backing of omMNEE to MNEE
- Supports cross-chain "teleport" operations

**Core Functions:**
- `depositAndMint()` - Lock MNEE and mint omMNEE
- `redeem()` - Burn omMNEE and retrieve MNEE
- `teleportFunds()` - Cross-chain transfer mechanism
- `authorizeAgent()` - Whitelist AI Agents (owner only)

## Installation

```bash
npm install
```

## Compilation

The contracts use Solidity 0.8.20 and OpenZeppelin contracts v5.x.

```bash
npx hardhat compile
```

Note: If you encounter network issues with the Hardhat compiler downloader, you can verify the contracts compile correctly using the local solc compiler:

```bash
npm install --save-dev solc@0.8.20
```

## Deployment

Deploy the QUIPO Hub (which automatically deploys the omMNEE token):

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

The deployment script will output:
- QuipoHub contract address
- omMNEE Token contract address

## Usage Flow

### For Users/Agents:

1. **Get Authorized** - The Hub owner must authorize your address as an Agent Vector
   
2. **Deposit & Mint**
   ```solidity
   // Approve MNEE spending first
   mneeToken.approve(hubAddress, amount);
   
   // Deposit MNEE and mint omMNEE
   hub.depositAndMint(amount, "Purpose: RWA Collateral");
   ```

3. **Transfer with Metadata**
   ```solidity
   omMNEE.transferWithMetadata(recipient, amount, "Invoice #992");
   ```

4. **Redeem**
   ```solidity
   hub.redeem(amount); // Burns omMNEE, returns MNEE
   ```

5. **Cross-Chain Teleport**
   ```solidity
   hub.teleportFunds(amount, "Solana", "target-address");
   ```

## Smart Contract Addresses

- **MNEE Token**: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- **QuipoHub**: (Deploy and add address here)
- **omMNEE Token**: (Automatically deployed by Hub)

## Events

The contracts emit events for off-chain Agent Listeners to track:

- `CollateralLocked(agent, amount, purpose)` - When MNEE is deposited
- `RedemptionRequested(agent, amount, destination)` - When omMNEE is redeemed
- `OmniTransfer(from, to, value, metadata)` - When metadata transfers occur
- `AgentAuthorized(agent)` - When new agents are whitelisted

## Development

### Project Structure
```
├── contracts/
│   ├── OmneeToken.sol      # The omMNEE ERC20 token
│   └── QuipoHub.sol        # The vault/hub contract
├── scripts/
│   └── deploy.js           # Deployment script
├── hardhat.config.ts       # Hardhat configuration
└── package.json            # Dependencies
```

### Testing

While compilation has been verified, you can add tests in the `test/` directory following Hardhat's testing conventions.

## Security Considerations

- Only authorized agents can perform deposits, redemptions, and teleports
- The Hub maintains ownership of the omMNEE token contract
- MNEE collateral is held in the Hub contract, maintaining 1:1 backing
- Cross-chain operations emit events but require an off-chain Agent Listener to execute

## License

MIT License - See LICENSE file for details.
