# Blue Team Authentication Setup

This guide explains how to configure Blue Team bot detection for the faucet page.

## Overview

Blue Team is a bot detection system that:
- Traps bots in an infinite maze by redirecting suspicious requests
- Uses speed traps to detect automated/rapid requests
- Supports authentication via agent keys or wallet token balances
- Provides a monitoring dashboard for tracked bots

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 3. Configure (Optional)

Edit `backend/main.py` to customize:
- `FRIENDLY_AGENT_KEY`: Legacy agent key for authentication
- `USE_SPL_TOKEN_AUTH`: Enable SPL token authentication
- `MIN_TOKEN_BALANCE`: Minimum token balance required
- CORS origins in the middleware

## Frontend Configuration

### 1. Environment Variables

Add to your frontend `.env` file:

```bash
# Blue Team API URL (defaults to http://localhost:8000)
VITE_BLUE_TEAM_API_URL=http://localhost:8000
```

### 2. Integration

The Blue Team authentication is automatically integrated into the faucet page. The component:

1. **Generates an agent key** when verification starts
2. **Makes authenticated requests** to the Blue Team API with proper delays
3. **Verifies the connection** by testing the `/me` endpoint
4. **Prevents bot detection** by ensuring requests aren't too fast

## How It Works

### Authentication Flow

1. User connects wallet
2. Component generates an agent key via `/generate-key` endpoint
3. Component waits 600ms (to avoid speed trap)
4. Component makes authenticated request to `/me` with agent key header
5. If successful, user is verified as human
6. Verification token is stored and user can access protected features

### Speed Trap Protection

The Blue Team middleware checks request timing:
- **< 0.5s between requests**: Bot detected → Redirected to maze
- **>= 0.5s between requests**: Legitimate user → Allowed
- **Agent key present**: Faster access allowed (0.2s threshold)

### Agent Key Authentication

The component automatically:
- Generates a new agent key when needed
- Includes it in the `X-Agent-Auth` header
- Allows faster request rates for authenticated users

## API Endpoints

### `/generate-key` (POST)
Generates a new agent key for authentication.

**Response:**
```json
{
  "key": "abc123xyz..."
}
```

### `/me` (GET)
Public endpoint that returns user data. Protected by speed trap.

**Headers:**
- `X-Agent-Auth`: Agent key (optional, bypasses speed trap)
- `X-Wallet-Address`: Wallet address (optional, for token balance checks)

### `/stats/trapped` (GET)
Returns bot detection statistics.

**Response:**
```json
{
  "trappedCount": 42,
  "activeBots": [
    {"ip": "192.168.1.5", "level": 3}
  ]
}
```

### `/verify-wallet/{address}` (GET)
Verifies wallet has required tokens (currently supports Solana).

## Customization

### Support Ethereum Wallets

The backend currently checks Solana wallet balances. To support Ethereum:

1. Add Ethereum wallet validation to `backend/spl_auth.py` or create a new module
2. Update the `/verify-wallet` endpoint to support Ethereum addresses
3. Modify `BlueTeamAuth.tsx` to use Ethereum-specific verification

### Custom API URL

Set `VITE_BLUE_TEAM_API_URL` in your `.env` to point to your deployed backend.

### Adjust Verification Delays

Edit the delay in `BlueTeamAuth.tsx`:
```typescript
await new Promise((resolve) => setTimeout(resolve, 600)); // Change delay here
```

## Testing

### Test Bot Detection

1. Start the backend: `uvicorn main:app --reload`
2. Use the test bot script: `python3 backend/test_bot.py`
3. Watch bots get trapped in the dashboard

### Test Legitimate User

1. Connect wallet in frontend
2. Navigate to faucet page
3. Component should automatically verify
4. You should be able to request tokens

## Troubleshooting

### "Verification failed: Bot detected"
- Make sure delays are sufficient (>= 600ms)
- Check that agent key is being sent in headers
- Verify backend is running and accessible

### "Failed to generate agent key"
- Check that backend is running
- Verify API URL is correct
- Check CORS settings in backend

### "Wallet not connected"
- Ensure wallet is connected before verification
- Check Web3Context is properly initialized

## Security Notes

- Agent keys provide authenticated access - treat them securely
- The speed trap threshold (0.5s) can be adjusted based on your needs
- Consider rate limiting on your backend for additional protection
- Monitor the `/stats/trapped` endpoint to track bot activity

