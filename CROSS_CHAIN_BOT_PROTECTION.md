# Cross-Chain Bot Protection with Blue Team

This document explains how Blue Team authentication protects cross-chain OMNEE teleport operations from unauthorized bots.

## Overview

Cross-chain teleports are sensitive operations that move OMNEE tokens between blockchains. To prevent unauthorized bots from performing these operations, we use Blue Team bot detection to verify agents before allowing teleport transactions.

## Protection Flow

### 1. Frontend Verification

When a user attempts to teleport OMNEE to another chain:

1. **Blue Team Authentication Required**
   - User must complete Blue Team verification
   - Component generates an agent key
   - Makes authenticated request to Blue Team API
   - Verification must succeed before teleport button is enabled

2. **Transaction Validation**
   - User must be authorized agent (on-chain check)
   - Blue Team verification must be complete (off-chain check)
   - Both checks must pass before teleport transaction can execute

### 2. On-Chain Protection

The smart contract provides the first layer of protection:

```solidity
function teleportFunds(...) external onlyAgent {
    // Only authorized agents can call this
    // Enforced by onlyAgent modifier
}
```

### 3. Off-Chain Protection (Blue Team)

Blue Team provides additional bot detection:

- **Speed Trap Detection**: Prevents bots making rapid requests
- **Agent Key Authentication**: Validates legitimate agents
- **Behavioral Analysis**: Detects automated patterns

## Architecture

```
┌─────────────────┐
│   User Agent    │
└────────┬────────┘
         │
         │ 1. Attempts Teleport
         ▼
┌─────────────────────────┐
│   TeleportForm UI       │
│  - Blue Team Auth       │
│  - Transaction Form     │
└────────┬────────────────┘
         │
         │ 2. Blue Team Verification
         ▼
┌─────────────────────────┐
│   Blue Team API         │
│  - Agent Key Gen        │
│  - Bot Detection        │
│  - Verification         │
└────────┬────────────────┘
         │
         │ 3. Verification Success
         ▼
┌─────────────────────────┐
│   Smart Contract        │
│  - onlyAgent Check      │
│  - Teleport Execution   │
│  - Event Emission       │
└────────┬────────────────┘
         │
         │ 4. Cross-Chain Event
         ▼
┌─────────────────────────┐
│   Agent Listener        │
│  - Event Monitoring     │
│  - Cross-Chain Execute  │
└─────────────────────────┘
```

## Implementation Details

### Frontend Component

The `TeleportForm` component includes:

```tsx
// Blue Team verification state
const [blueTeamVerified, setBlueTeamVerified] = useState(false);

// Verification handler
const handleBlueTeamVerified = (verified: boolean) => {
  setBlueTeamVerified(verified);
  setError(null);
};

// Teleport validation
const handleTeleport = async () => {
  if (!blueTeamVerified) {
    setError("Please complete Blue Team bot verification before teleporting");
    return;
  }
  // ... rest of teleport logic
};
```

### Backend Integration (Optional)

You can add additional backend validation by:

1. **Creating a Teleport Validation Endpoint**

```python
# In your Blue Team backend
@app.post("/validate-teleport")
async def validate_teleport(request: Request):
    agent_key = request.headers.get("X-Agent-Auth")
    wallet_address = request.headers.get("X-Wallet-Address")
    
    # Validate agent key
    if not validate_agent_key(agent_key):
        raise HTTPException(403, "Invalid agent key")
    
    # Check wallet is authorized
    # ... your validation logic
    
    return {"valid": True}
```

2. **Calling Before Transaction**

```typescript
// In TeleportForm
const validateWithBackend = async () => {
  const response = await fetch(`${blueTeamApiUrl}/validate-teleport`, {
    method: "POST",
    headers: {
      "X-Agent-Auth": agentKey,
      "X-Wallet-Address": address,
    },
  });
  return response.ok;
};
```

## Security Considerations

### Multi-Layer Defense

1. **On-Chain**: `onlyAgent` modifier ensures only authorized addresses
2. **Off-Chain**: Blue Team verifies legitimate human/agent behavior
3. **Rate Limiting**: Speed traps prevent rapid automated requests
4. **Event Monitoring**: Agent Listener validates cross-chain operations

### Attack Vectors Mitigated

- ✅ **Unauthorized Bot Teleports**: Blocked by Blue Team verification
- ✅ **Automated Attacks**: Speed traps detect rapid requests
- ✅ **Replay Attacks**: On-chain replay protection via `processedCrossChainOps`
- ✅ **Sybil Attacks**: Agent key generation tied to legitimate wallets

### Best Practices

1. **Always Verify Before Transaction**
   - Don't allow teleport without Blue Team verification
   - Reset verification after each successful teleport
   - Show clear error messages if verification fails

2. **Monitor Cross-Chain Events**
   - Agent Listener should validate all teleport events
   - Log suspicious patterns
   - Alert on anomalies

3. **Rate Limiting**
   - Limit teleports per wallet/time period
   - Consider cooldowns for large amounts
   - Monitor for unusual patterns

## Configuration

### Environment Variables

```bash
# Blue Team API URL
VITE_BLUE_TEAM_API_URL=http://localhost:8000

# Optional: Custom verification requirements
VITE_REQUIRE_BLUE_TEAM_TELEPORT=true
```

### Backend Settings

In `backend/main.py`:

```python
# Speed trap threshold (seconds between requests)
SPEED_TRAP_THRESHOLD = 0.5

# Agent key authentication
USE_AGENT_KEY_AUTH = True
FRIENDLY_AGENT_KEY = "your-secret-key"

# Wallet token requirements (optional)
USE_SPL_TOKEN_AUTH = True
MIN_TOKEN_BALANCE = 1
```

## Testing

### Test Legitimate Agent

1. Connect authorized wallet
2. Complete Blue Team verification
3. Attempt teleport
4. Should succeed with both checks passing

### Test Unauthorized Bot

1. Connect unauthorized wallet
2. Try to bypass Blue Team verification
3. Teleport should be disabled
4. Transaction should fail if somehow sent

### Test Speed Trap

1. Make rapid teleport requests
2. Should get trapped in Blue Team maze
3. Must wait or use agent key to proceed

## Monitoring

### Key Metrics to Track

- Teleport success rate with/without Blue Team verification
- Bot detection events
- Cross-chain operation volumes
- Failed verification attempts

### Dashboard

Monitor Blue Team stats at `/stats/trapped`:
- Total bots trapped
- Active threats
- Verification success rates

## Future Enhancements

1. **Machine Learning Detection**
   - Train models on legitimate vs bot behavior
   - Adaptive thresholds based on patterns

2. **Reputation System**
   - Track agent reliability scores
   - Higher reputation = faster verification

3. **Multi-Chain Blue Team**
   - Extend protection to destination chains
   - Validate on both source and target

4. **Advanced Validation**
   - Check agent history before teleport
   - Validate destination chain addresses
   - Require additional signatures for large amounts

