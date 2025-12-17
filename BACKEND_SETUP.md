# Backend Setup - Blue Team Bot Trap

The bot trap backend is now included in this project! Here's how to set it up.

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:8000`

### 3. Configure Frontend

Make sure your frontend `.env` has:

```bash
VITE_BLUE_TEAM_API_URL=http://localhost:8000
```

## What the Bot Trap Does

### Speed Trap Detection

The backend middleware checks request timing:
- **< 0.5 seconds** between requests → **BOT DETECTED** → Redirected to maze
- **>= 0.5 seconds** between requests → **LEGITIMATE** → Request allowed

### The Infinite Maze

When a bot is detected:
1. Gets redirected to `/maze/1`
2. Sees a fake "mouse trap" product page
3. 2 second delay wastes their time
4. Infinite links to deeper levels
5. Bot keeps crawling deeper (level 2, 3, 4...)
6. Stats tracked in real-time

### Agent Key Authentication

Legitimate agents can:
- Generate agent keys via `/generate-key`
- Include key in `X-Agent-Auth` header
- Make faster requests (0.2s threshold)
- Bypass speed trap

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats/trapped` | GET | Get bot detection statistics |
| `/maze/:level` | GET | Bot trap - infinite maze |
| `/me` | GET | Personal API info |
| `/generate-key` | POST | Generate agent key |
| `/verify-wallet/:address` | GET | Verify wallet (placeholder) |

## Testing the Bot Trap

### Test 1: Trigger Speed Trap

```bash
# Make rapid requests (will get trapped)
for i in {1..5}; do
  curl http://localhost:8000/me
  sleep 0.1
done
# Should redirect to /maze/1
```

### Test 2: Legitimate User

```bash
# Slow requests (legitimate)
curl http://localhost:8000/me
sleep 1
curl http://localhost:8000/me
# Should work fine
```

### Test 3: With Agent Key

```bash
# Get agent key
KEY=$(curl -s -X POST http://localhost:8000/generate-key | jq -r '.key')

# Use agent key (bypasses trap)
curl -H "X-Agent-Auth: $KEY" http://localhost:8000/me
```

### Test 4: View Stats

```bash
curl http://localhost:8000/stats/trapped
```

## Integration Flow

1. **Frontend loads** → User connects wallet
2. **Blue Team component** → Generates agent key via `/generate-key`
3. **Waits 600ms** → Avoids speed trap
4. **Makes request** → Calls `/me` with agent key header
5. **Verification success** → User can access protected features

## Configuration

### Environment Variables

Create `backend/.env`:

```bash
PORT=8000
AGENT_KEY=your_custom_agent_key_here
```

### Customize Speed Trap

Edit `backend/server.js`:

```javascript
const SPEED_TRAP_THRESHOLD = 0.5; // Change threshold (seconds)
const AGENT_KEY_THRESHOLD = 0.2;  // Faster for authenticated
```

## Monitoring

### View Trapped Bots

```bash
curl http://localhost:8000/stats/trapped
```

Response:
```json
{
  "trappedCount": 42,
  "activeBots": [
    {"ip": "192.168.1.5", "level": 3},
    {"ip": "10.0.0.1", "level": 7}
  ]
}
```

### Frontend Dashboard

The frontend can display these stats in real-time by polling `/stats/trapped`.

## Production Deployment

### 1. Use Process Manager

```bash
npm install -g pm2
pm2 start backend/server.js --name blue-team
```

### 2. Use Redis (Recommended)

Replace in-memory maps with Redis:
- `activeTraps` → Redis hash
- `requestLog` → Redis with TTL

### 3. Environment Variables

Set in production:
```bash
PORT=8000
AGENT_KEY=strong_random_key_here
NODE_ENV=production
```

### 4. Reverse Proxy

Use nginx or similar:
```nginx
location /api/ {
    proxy_pass http://localhost:8000/;
}
```

## Troubleshooting

### Port Already in Use

```bash
PORT=8001 npm start
```

### CORS Errors

Add your frontend URL to CORS in `server.js`:
```javascript
origin: ["http://localhost:3000", "https://your-domain.com"]
```

### Bots Not Being Trapped

- Check speed trap threshold
- Verify middleware is running
- Check request timing

### Frontend Can't Connect

- Verify backend is running
- Check `VITE_BLUE_TEAM_API_URL` in frontend `.env`
- Check CORS settings

## Next Steps

1. ✅ Start backend: `cd backend && npm install && npm start`
2. ✅ Update frontend `.env` with API URL
3. ✅ Test bot trap with rapid requests
4. ✅ Verify frontend integration works
5. ✅ Monitor `/stats/trapped` for bot activity

The bot trap is now fully integrated and ready to catch unauthorized bots! 🕷️🪤
