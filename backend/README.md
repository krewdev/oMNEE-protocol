# Blue Team Bot Trap Backend

This is the bot detection backend server for the OMNEE Protocol. It implements the "maze trap" system that catches bots by redirecting them to an infinite maze of fake product pages.

**Features:**
- ✅ Redis persistence (survives server restarts)
- ✅ Automatic fallback to in-memory storage
- ✅ Rate limiting (prevents DOS attacks)
- ✅ Infinite maze trap for bots
- ✅ Real-time statistics
- ✅ Reusable Blue Team auth middleware

## Features

- **Speed Trap**: Detects bots making rapid requests (< 0.5s apart)
- **Infinite Maze**: Traps bots in endless fake product pages
- **Agent Key Authentication**: Allows legitimate agents to bypass traps
- **Real-time Stats**: Track trapped bots via `/stats/trapped` endpoint
- **CORS Enabled**: Works with React frontend

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Redis (Optional but Recommended)

**With Redis (persistent storage):**
```bash
export REDIS_URL=redis://localhost:6379
npm start
```

**Without Redis (in-memory fallback):**
```bash
npm start
```

The server automatically falls back to in-memory storage if Redis is unavailable.

See [REDIS_SETUP.md](./REDIS_SETUP.md) for detailed Redis configuration.

### 3. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:8000`

## Configuration

### Environment Variables

Create a `.env` file (optional):

```bash
PORT=8000
AGENT_KEY=your_secret_agent_key_here
```

### Default Settings

- **Port**: 8000
- **Agent Key**: `my_secret_agent_pass_123`
- **Speed Trap Threshold**: 0.5 seconds
- **Agent Key Threshold**: 0.2 seconds (faster for authenticated)

## API Endpoints

### `GET /stats/trapped`

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

### `GET /maze/:level`

The bot trap - infinite maze of fake product pages. Bots get redirected here when detected.

**Parameters:**
- `level` - Maze level (1, 2, 3, ...)

**Behavior:**
- Adds 2 second delay (wastes bot time)
- Generates fake mouse trap product data
- Creates infinite links to next level
- Tracks bot IP and level

### `GET /me`

Returns personal/API information.

**Response:**
```json
{
  "name": "OMNEE Protocol",
  "jobTitle": "Universal Settlement Layer",
  ...
}
```

### `POST /generate-key`

Generates a new agent key for authentication.

**Response:**
```json
{
  "key": "abc123xyz..."
}
```

### `GET /verify-wallet/:address`

Verifies wallet address (placeholder - extend for token balance checks).

**Parameters:**
- `address` - Wallet address to verify

## Blue Team Auth Middleware

The server uses a reusable Blue Team authentication middleware (`middleware/blue-team-auth.js`) for consistent bot detection.

**Features:**
- Agent key authentication via `X-Agent-Auth` header
- Speed trap detection (redirects bots to maze)
- Request logging to Redis
- Configurable skip paths
- Optional or required authentication modes

**Usage Example:**
```javascript
import { blueTeamAuth, requireBlueTeamAuth } from './middleware/blue-team-auth.js';

// Apply globally with skip paths
app.use(blueTeamAuth({
  skipPaths: ['/stats', '/maze', '/generate-key']
}));

// Require auth on specific route
app.get('/admin', requireBlueTeamAuth(), (req, res) => {
  // Only accessible with valid agent key
});
```

See [middleware/README.md](./middleware/README.md) for complete documentation.

## How It Works

### Speed Trap Detection

1. **Request comes in** → Middleware checks timing
2. **Too fast?** (< 0.5s since last request) → Redirect to `/maze/1`
3. **Legitimate?** (>= 0.5s) → Allow request through

### Agent Key Bypass

Requests with `X-Agent-Auth` header matching the agent key:
- Can make requests faster (0.2s threshold)
- Bypass speed trap
- Access protected endpoints

### The Maze

When a bot is trapped:
1. Redirected to `/maze/1`
2. Shown fake product page (mouse traps)
3. 2 second delay wastes their time
4. Infinite links to next level
5. Bot keeps crawling deeper into maze
6. Stats tracked in real-time

## Integration with Frontend

The frontend automatically:
1. Generates agent key via `/generate-key`
2. Includes key in `X-Agent-Auth` header
3. Waits 600ms between requests (avoids speed trap)
4. Calls `/me` to verify connection

## Testing

### Test with Python Bot Script

```bash
# Run the test bot (will trigger speed trap)
python3 test_bot.py
```

See [BOT_USAGE.md](./BOT_USAGE.md) for detailed test scenarios.

### Test Bot Detection (Manual)

```bash
# Make rapid requests (will trigger trap)
for i in {1..10}; do
  curl http://localhost:8000/me
  sleep 0.1
done
```

### Test with Agent Key

```bash
# Authenticated request (bypasses trap)
curl -H "X-Agent-Auth: my_secret_agent_pass_123" http://localhost:8000/me
```

### View Stats

```bash
curl http://localhost:8000/stats/trapped
```

## Production Considerations

1. **Use Redis** instead of in-memory maps for:
   - `activeTraps`
   - `requestLog`
   - Better scalability

2. **Rate Limiting**:
   - Add per-IP rate limits
   - Use Redis for distributed rate limiting

3. **Monitoring**:
   - Log all trapped bots
   - Track patterns
   - Alert on anomalies

4. **Security**:
   - Change default agent key
   - Use environment variables
   - Add IP whitelisting if needed

## Troubleshooting

### CORS Errors

Add your frontend URL to the CORS origins in `server.js`:
```javascript
origin: ["http://localhost:3000", "http://your-frontend-url"]
```

### Port Already in Use

Change the port:
```bash
PORT=8001 npm start
```

### Bots Not Being Trapped

- Check speed trap threshold (default 0.5s)
- Verify middleware is running
- Check request timing in logs

