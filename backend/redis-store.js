import Redis from 'ioredis';

/**
 * Redis-backed storage for bot trap data
 * Falls back to in-memory storage if Redis is unavailable
 */
class RedisStore {
  constructor() {
    this.redis = null;
    this.fallback = new Map(); // In-memory fallback
    this.useRedis = false;
    this.connected = false;
    
    // Initialize Redis connection
    this.initRedis();
  }

  async initRedis() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    
    if (!redisUrl && !process.env.REDIS_HOST) {
      console.log('⚠️  Redis not configured, using in-memory storage');
      console.log('   Set REDIS_URL or REDIS_HOST to enable Redis persistence');
      return;
    }

    try {
      // Create Redis client
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true
        });
      } else {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true
        });
      }

      // Event handlers
      this.redis.on('connect', () => {
        console.log('🔄 Connecting to Redis...');
      });

      this.redis.on('ready', () => {
        this.connected = true;
        this.useRedis = true;
        console.log('✅ Redis connected and ready');
      });

      this.redis.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
        this.connected = false;
        this.useRedis = false;
      });

      this.redis.on('close', () => {
        console.log('⚠️  Redis connection closed, falling back to in-memory storage');
        this.connected = false;
        this.useRedis = false;
      });

      this.redis.on('reconnecting', () => {
        console.log('🔄 Reconnecting to Redis...');
      });

      // Attempt connection
      await this.redis.connect().catch(() => {
        console.log('⚠️  Redis connection failed, using in-memory storage');
        this.useRedis = false;
      });

    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error.message);
      this.useRedis = false;
    }
  }

  // Generic get/set with fallback
  async get(key) {
    if (this.useRedis && this.connected) {
      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error(`Redis get error for ${key}:`, error.message);
        return this.fallback.get(key) || null;
      }
    }
    return this.fallback.get(key) || null;
  }

  async set(key, value, ttl = null) {
    if (this.useRedis && this.connected) {
      try {
        const serialized = JSON.stringify(value);
        if (ttl) {
          await this.redis.setex(key, ttl, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
        return true;
      } catch (error) {
        console.error(`Redis set error for ${key}:`, error.message);
        this.fallback.set(key, value);
        return false;
      }
    }
    this.fallback.set(key, value);
    return true;
  }

  async del(key) {
    if (this.useRedis && this.connected) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error(`Redis del error for ${key}:`, error.message);
      }
    }
    this.fallback.delete(key);
  }

  async exists(key) {
    if (this.useRedis && this.connected) {
      try {
        const result = await this.redis.exists(key);
        return result === 1;
      } catch (error) {
        console.error(`Redis exists error for ${key}:`, error.message);
        return this.fallback.has(key);
      }
    }
    return this.fallback.has(key);
  }

  async incr(key) {
    if (this.useRedis && this.connected) {
      try {
        return await this.redis.incr(key);
      } catch (error) {
        console.error(`Redis incr error for ${key}:`, error.message);
        const current = this.fallback.get(key) || 0;
        const newValue = current + 1;
        this.fallback.set(key, newValue);
        return newValue;
      }
    }
    const current = this.fallback.get(key) || 0;
    const newValue = current + 1;
    this.fallback.set(key, newValue);
    return newValue;
  }

  async keys(pattern) {
    if (this.useRedis && this.connected) {
      try {
        return await this.redis.keys(pattern);
      } catch (error) {
        console.error(`Redis keys error for ${pattern}:`, error.message);
        return Array.from(this.fallback.keys()).filter(k => k.match(pattern));
      }
    }
    return Array.from(this.fallback.keys()).filter(k => k.match(pattern));
  }

  async getAll(pattern) {
    const keys = await this.keys(pattern);
    const results = {};
    for (const key of keys) {
      results[key] = await this.get(key);
    }
    return results;
  }

  // Specialized methods for bot trap data
  async getActiveTrap(ip) {
    return await this.get(`trap:${ip}`);
  }

  async setActiveTrap(ip, data) {
    return await this.set(`trap:${ip}`, data, 300); // 5 minute TTL
  }

  async deleteActiveTrap(ip) {
    return await this.del(`trap:${ip}`);
  }

  async getAllActiveTraps() {
    const keys = await this.keys('trap:*');
    const traps = {};
    for (const key of keys) {
      const ip = key.replace('trap:', '');
      traps[ip] = await this.get(key);
    }
    return traps;
  }

  async getRequestLog(ip) {
    const value = await this.get(`request:${ip}`);
    return value ? parseFloat(value) : 0;
  }

  async setRequestLog(ip, timestamp) {
    return await this.set(`request:${ip}`, timestamp.toString(), 60); // 1 minute TTL
  }

  async getMazeVisits(ip) {
    return await this.get(`maze:visits:${ip}`);
  }

  async setMazeVisits(ip, data) {
    return await this.set(`maze:visits:${ip}`, data, 3600); // 1 hour TTL
  }

  async deleteMazeVisits(ip) {
    return await this.del(`maze:visits:${ip}`);
  }

  async getAllMazeVisits() {
    const keys = await this.keys('maze:visits:*');
    const visits = {};
    for (const key of keys) {
      const ip = key.replace('maze:visits:', '');
      visits[ip] = await this.get(key);
    }
    return visits;
  }

  async getMazeRequestRate(ip) {
    return await this.get(`maze:rate:${ip}`);
  }

  async setMazeRequestRate(ip, data) {
    return await this.set(`maze:rate:${ip}`, data, 60); // 1 minute TTL
  }

  async deleteMazeRequestRate(ip) {
    return await this.del(`maze:rate:${ip}`);
  }

  async getTotalTrappedCount() {
    const count = await this.get('stats:totalTrapped');
    return count || 0;
  }

  async incrementTotalTrappedCount() {
    return await this.incr('stats:totalTrapped');
  }

  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export default new RedisStore();
