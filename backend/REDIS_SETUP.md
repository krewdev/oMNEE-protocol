# Redis Persistence Setup

## Overview

The bot trap backend now uses Redis for persistent storage, ensuring that security state (trapped bots, rate limits, etc.) persists across server restarts. The system gracefully falls back to in-memory storage if Redis is unavailable.

## Why Redis?

**Before (In-Memory Maps):**
- ❌ Data lost on server restart
- ❌ Cannot share state across multiple server instances
- ❌ No persistence for security state
- ❌ Bot trap data resets on deployment

**After (Redis):**
- ✅ Data persists across restarts
- ✅ Shared state across multiple servers
- ✅ Persistent security state
- ✅ Bot trap history maintained

## Installation

### 1. Install Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### 2. Install Node.js Dependencies

```bash
cd backend
npm install
```

This installs `ioredis` (Redis client for Node.js).

## Configuration

### Environment Variables

Set one of these to enable Redis:

**Option 1: Redis URL (recommended)**
```bash
REDIS_URL=redis://localhost:6379
```

**Option 2: Individual settings**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
REDIS_DB=0                    # Optional, defaults to 0
```

### Examples

**Local Development:**
```bash
export REDIS_URL=redis://localhost:6379
npm start
```

**Production (with password):**
```bash
export REDIS_URL=redis://:password@redis.example.com:6379
npm start
```

**Cloud Redis (Redis Cloud, AWS ElastiCache, etc.):**
```bash
export REDIS_URL=rediss://:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
npm start
```

## How It Works

### Automatic Fallback

The system automatically detects Redis availability:

1. **Redis Available:** Uses Redis for all storage operations
2. **Redis Unavailable:** Falls back to in-memory Maps
3. **Redis Reconnects:** Automatically switches back to Redis

### Storage Structure

**Redis Keys:**
```
trap:{ip}              # Active trap data (5 min TTL)
request:{ip}           # Request log timestamp (1 min TTL)
maze:visits:{ip}       # Maze visit tracking (1 hour TTL)
maze:rate:{ip}         # Rate limit data (1 min TTL)
stats:totalTrapped     # Total trapped count (persistent)
```

**TTL (Time To Live):**
- Active traps: 5 minutes
- Request logs: 1 minute
- Maze visits: 1 hour
- Rate limit data: 1 minute
- Stats: Persistent (no TTL)

### Data Persistence

**Persisted:**
- Total trapped count
- Active traps (until TTL expires)
- Maze visit history (until TTL expires)

**Not Persisted (by design):**
- Request rate data (short-lived, resets quickly)
- Request logs (short-lived, resets quickly)

## Verification

### Check Redis Connection

When the server starts, you'll see:

**Redis Connected:**
```
✅ Redis connected and ready
💾 Storage: Redis (persistent)
```

**Redis Unavailable (Fallback):**
```
⚠️  Redis not configured, using in-memory storage
💾 Storage: In-memory (fallback)
```

### Test Persistence

1. **Start server with Redis:**
   ```bash
   REDIS_URL=redis://localhost:6379 npm start
   ```

2. **Trigger a bot trap** (make a fast request):
   ```bash
   curl http://localhost:8000/me
   sleep 0.1
   curl http://localhost:8000/me  # Should redirect to maze
   ```

3. **Check stats:**
   ```bash
   curl http://localhost:8000/stats/trapped
   # Note the trappedCount
   ```

4. **Restart server:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   REDIS_URL=redis://localhost:6379 npm start
   ```

5. **Check stats again:**
   ```bash
   curl http://localhost:8000/stats/trapped
   # trappedCount should be the same (persisted!)
   ```

## Monitoring

### Redis CLI

Connect to Redis CLI:
```bash
redis-cli
```

**View all trap data:**
```redis
KEYS trap:*
GET trap:192.168.1.1
```

**View maze visits:**
```redis
KEYS maze:visits:*
GET maze:visits:192.168.1.1
```

**View total trapped count:**
```redis
GET stats:totalTrapped
```

**Clear all data (for testing):**
```redis
FLUSHDB
```

### Redis Monitoring

**Check Redis info:**
```bash
redis-cli INFO
```

**Monitor commands:**
```bash
redis-cli MONITOR
```

## Production Considerations

### High Availability

**Redis Sentinel:**
```bash
REDIS_URL=redis-sentinel://sentinel1:26379,sentinel2:26379,mymaster
```

**Redis Cluster:**
```bash
REDIS_URL=redis-cluster://node1:6379,node2:6379,node3:6379
```

### Performance

**Connection Pooling:**
The `ioredis` client automatically handles connection pooling. For high-traffic scenarios, consider:

```javascript
// In redis-store.js, you can configure:
new Redis({
  // ... existing config
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000
});
```

### Security

**Password Protection:**
```bash
REDIS_URL=redis://:strong_password@localhost:6379
```

**TLS/SSL:**
```bash
REDIS_URL=rediss://:password@redis.example.com:6380
```

**Network Isolation:**
- Run Redis on private network
- Use firewall rules
- Disable Redis commands (FLUSHDB, etc.) in production

## Troubleshooting

### Redis Connection Failed

**Symptoms:**
```
⚠️  Redis connection failed, using in-memory storage
```

**Solutions:**
1. Check Redis is running: `redis-cli ping` (should return `PONG`)
2. Verify connection string: `REDIS_URL=redis://localhost:6379`
3. Check firewall/network access
4. Verify Redis port (default: 6379)

### Data Not Persisting

**Check:**
1. Redis is actually connected (check server logs)
2. TTL hasn't expired (check key expiration)
3. Using correct Redis database (check `REDIS_DB`)

### Performance Issues

**Symptoms:**
- Slow response times
- High Redis CPU usage

**Solutions:**
1. Use Redis connection pooling
2. Increase Redis memory limit
3. Use Redis persistence (RDB/AOF)
4. Consider Redis Cluster for scaling

## Migration from In-Memory

If you're upgrading from in-memory storage:

1. **No data migration needed** - Redis starts fresh
2. **Existing data** in memory will be lost (expected)
3. **New data** will persist going forward

## Development vs Production

### Development
- Local Redis instance
- Simple connection string
- No password required

### Production
- Managed Redis service (Redis Cloud, AWS ElastiCache, etc.)
- Secure connection (TLS/SSL)
- Password authentication
- High availability setup
- Monitoring and alerts

## Cost Considerations

**Free Tier Options:**
- Redis Cloud: 30MB free
- AWS ElastiCache: Pay-as-you-go
- Self-hosted: Free (server costs)

**Typical Usage:**
- ~1KB per trapped IP
- ~100 bytes per request log
- Minimal storage for most use cases

---

**Redis persistence ensures your bot trap security state survives server restarts and enables horizontal scaling.**

