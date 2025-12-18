# Blue Team Auth Middleware

Reusable middleware for Blue Team bot detection and authentication.

## Overview

The Blue Team auth middleware provides:
- ✅ Agent key authentication
- ✅ Speed trap detection
- ✅ Automatic bot redirection to maze
- ✅ Request logging and analytics
- ✅ Configurable skip paths

## Usage

### Basic Usage (Optional Auth)

Apply to all routes with automatic bot detection:

```javascript
import { blueTeamAuth } from './middleware/blue-team-auth.js';

// Apply to all routes
app.use(blueTeamAuth({
  skipPaths: ['/stats', '/maze', '/public']
}));
```

### Require Authentication

Force authentication on specific routes:

```javascript
import { requireBlueTeamAuth } from './middleware/blue-team-auth.js';

// This endpoint requires valid agent key
app.get('/protected', requireBlueTeamAuth(), (req, res) => {
  res.json({ message: 'Authenticated access' });
});
```

### Optional Authentication

Detect bots but don't require auth:

```javascript
import { optionalBlueTeamAuth } from './middleware/blue-team-auth.js';

// Detects bots but allows unauthenticated access
app.get('/public-api', optionalBlueTeamAuth(), (req, res) => {
  res.json({ message: 'Public endpoint' });
});
```

## Request Object

After middleware runs, `req.blueTeamAuth` contains:

**Authenticated:**
```javascript
{
  authenticated: true,
  agentKey: "key_value",
  walletAddress: "0x...",
  ip: "192.168.1.1"
}
```

**Unauthenticated:**
```javascript
{
  authenticated: false,
  ip: "192.168.1.1",
  timeSinceLastRequest: 1.234
}
```

## Configuration

### Environment Variables

```bash
AGENT_KEY=your_secret_key_here
```

### Options

```javascript
blueTeamAuth({
  skipPaths: ['/stats', '/maze'],  // Paths to skip
  requireAuth: false                // Require authentication
})
```

## Examples

### Example 1: Protect Specific Route

```javascript
import express from 'express';
import { requireBlueTeamAuth } from './middleware/blue-team-auth.js';

const app = express();

// Public endpoint
app.get('/public', (req, res) => {
  res.json({ message: 'Public access' });
});

// Protected endpoint
app.get('/admin', requireBlueTeamAuth(), (req, res) => {
  const auth = req.blueTeamAuth;
  res.json({
    message: 'Admin access',
    authenticated: auth.authenticated,
    wallet: auth.walletAddress
  });
});
```

### Example 2: Global Middleware with Exceptions

```javascript
import { blueTeamAuth } from './middleware/blue-team-auth.js';

// Apply to all routes except public ones
app.use(blueTeamAuth({
  skipPaths: [
    '/stats',
    '/maze',
    '/public',
    '/health'
  ]
}));

// All other routes are protected
app.get('/api/data', (req, res) => {
  // This route is protected by Blue Team auth
  res.json({ data: 'protected' });
});
```

### Example 3: Check Authentication Status

```javascript
import { getAuthInfo } from './middleware/blue-team-auth.js';

app.get('/status', (req, res) => {
  const auth = getAuthInfo(req);
  
  if (auth && auth.authenticated) {
    res.json({ status: 'authenticated', wallet: auth.walletAddress });
  } else {
    res.json({ status: 'unauthenticated' });
  }
});
```

## How It Works

### 1. Agent Key Check

If `X-Agent-Auth` header matches `AGENT_KEY`:
- ✅ Bypass speed trap
- ✅ Mark as authenticated
- ✅ Continue to next middleware

### 2. Speed Trap

If no valid agent key:
- ⏱️ Check time since last request
- 🚨 If < 0.5s: Redirect to `/maze/1`
- ✅ If >= 0.5s: Continue normally

### 3. Request Logging

All requests are logged to Redis:
- IP address
- Timestamp
- Authentication status

## Integration with Frontend

The frontend `BlueTeamAuth` component automatically:
1. Generates agent key via `/generate-key`
2. Includes key in `X-Agent-Auth` header
3. Includes wallet address in `X-Wallet-Address` header

```javascript
// Frontend automatically does:
headers: {
  'X-Agent-Auth': agentKey,
  'X-Wallet-Address': walletAddress
}
```

## Testing

### Test with Agent Key

```bash
# Get agent key
curl -X POST http://localhost:8000/generate-key

# Use agent key
curl -H "X-Agent-Auth: your_key_here" \
     -H "X-Wallet-Address: 0x..." \
     http://localhost:8000/me
```

### Test Speed Trap

```bash
# Fast requests (will trigger trap)
curl http://localhost:8000/me
sleep 0.1
curl http://localhost:8000/me  # Redirected to /maze/1
```

### Test Protected Route

```bash
# Without auth (401 error)
curl http://localhost:8000/protected

# With auth (success)
curl -H "X-Agent-Auth: your_key" \
     http://localhost:8000/protected
```

## Advanced Usage

### Custom Skip Logic

```javascript
app.use((req, res, next) => {
  // Custom logic to skip auth
  if (req.path.startsWith('/internal')) {
    return next();
  }
  // Apply Blue Team auth
  blueTeamAuth()(req, res, next);
});
```

### Multiple Middleware

```javascript
app.use(blueTeamAuth());
app.use(express.json());
app.use(cors());

// All routes now have Blue Team auth + JSON + CORS
```

## Security Notes

1. **Agent Key:** Keep `AGENT_KEY` secret in production
2. **HTTPS:** Use HTTPS in production to protect headers
3. **Rate Limiting:** Combine with rate limiting middleware
4. **IP Whitelisting:** Consider IP whitelisting for admin routes

## Troubleshooting

### Middleware Not Working

- Check middleware is applied before routes
- Verify skip paths are correct
- Check Redis connection (for request logging)

### Authentication Failing

- Verify `AGENT_KEY` matches in env and header
- Check header name: `X-Agent-Auth` (case-sensitive)
- Ensure middleware runs before route handler

### Speed Trap Not Triggering

- Check Redis is connected (for request logging)
- Verify threshold: 0.5 seconds
- Check skip paths aren't matching

---

**The Blue Team auth middleware provides consistent bot detection across all routes.**

