import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailWalletRouter from './email-wallet.js';
import store from './redis-store.js';
import { blueTeamAuth } from './middleware/blue-team-auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// --- CONFIGURATION ---
const MAX_MAZE_LEVELS = 50; // Hard cap on maze levels per IP
const MAX_REQUESTS_PER_SECOND = 10; // Max requests per second per IP for maze
const MAZE_RATE_LIMIT_WINDOW = 1; // 1 second window

// --- PERSISTENT STORAGE (Redis with in-memory fallback) ---
// All data is now stored in Redis for persistence across server restarts
// Falls back to in-memory storage if Redis is unavailable

// --- MIDDLEWARE ---
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:3006"],
  credentials: true
}));
app.use(express.json());

// Email wallet routes
app.use('/api/email-wallet', emailWalletRouter);

// --- HELPER FUNCTIONS ---
// Note: generateAgentKey moved to middleware, but keeping here for /generate-key endpoint
function generateAgentKey(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateMouseTrapData(level) {
  const trapTypes = [
    "Snap Trap", "Humane Catch Trap", "Electronic Trap", "Glue Trap",
    "Bucket Trap", "Multi-Catch Trap", "Live Catch Trap", "Professional Grade Trap"
  ];
  const brands = [
    "TrapMaster Pro", "CatchFast", "QuickSnap", "MouserX", "RodentGuard",
    "PestAway", "MightyCatch", "SmartTrap", "EcoTrap", "PowerSnap"
  ];
  const features = [
    "Non-toxic bait chamber", "Reusable design", "Easy disposal mechanism",
    "Humane release option", "Weather-resistant construction", "Tamper-proof design",
    "Large catch capacity", "Sensitive trigger mechanism", "Durable steel construction",
    "Quick reset feature", "Safe for pets and children", "Commercial grade materials"
  ];
  const descriptions = [
    "Professional-grade mouse trap with enhanced sensitivity trigger mechanism. Features non-toxic bait chamber and weather-resistant design.",
    "Humane catch-and-release trap with easy disposal mechanism. Safe for use around pets and children.",
    "Commercial grade snap trap with tamper-proof design. Large catch capacity with quick reset feature.",
    "Electronic trap with smart detection system. Features durable steel construction and reusable design.",
    "Multi-catch trap system with large capacity. Includes professional bait chamber and weather-resistant materials."
  ];
  const reviews = [
    "Works great! Caught 3 mice in the first week.",
    "Very effective, highly recommend for commercial use.",
    "Easy to set up and dispose. Much better than traditional traps.",
    "Humane option that actually works. No more dealing with dead mice.",
    "Professional grade quality. Worth the investment for large infestations."
  ];

  const trapType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
  const brand = brands[Math.floor(Math.random() * brands.length)];
  const modelNumber = `MT-${Math.floor(Math.random() * 9000) + 1000}-${level}`;
  const price = (Math.random() * 44 + 5.99).toFixed(2);
  const stock = Math.floor(Math.random() * 491) + 10;
  const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
  const reviewsCount = Math.floor(Math.random() * 2451) + 50;
  const selectedFeatures = features.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 3);
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  const review = reviews[Math.floor(Math.random() * reviews.length)];

  return {
    type: trapType,
    brand,
    model: modelNumber,
    price,
    stock,
    rating,
    reviews_count: reviewsCount,
    features: selectedFeatures,
    description,
    review
  };
}

function generateMazeHTML(level, trapData) {
  const nextLevel = level + 1;
  const links = [];
  for (let i = 0; i < 5; i++) {
    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const linkTrap = generateMouseTrapData(nextLevel);
    const linkText = `${linkTrap.brand} ${linkTrap.type} ($${linkTrap.price})`;
    links.push(`<li style="margin: 8px 0;"><a href="/maze/${nextLevel}?q=${randomId}" style="color: #3182ce; text-decoration: none;">${linkText}</a> - <span style="color: #718096; font-size: 0.9em;">Similar Product</span></li>`);
  }

  return `
    <html>
      <head>
        <title>${trapData.brand} ${trapData.type} - Pest Control Equipment</title>
        <meta name="description" content="${trapData.description}">
      </head>
      <body style="margin: 0; padding: 20px; background: #f7fafc; font-family: Arial, sans-serif;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <nav style="background: #2d3748; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <a href="/" style="color: white; text-decoration: none; margin-right: 20px; font-weight: bold;">Home</a>
            <a href="/products" style="color: #cbd5e0; text-decoration: none; margin-right: 20px;">Products</a>
            <a href="/category/rodent-control" style="color: #cbd5e0; text-decoration: none; margin-right: 20px;">Rodent Control</a>
            <span style="float: right; color: #cbd5e0;">Page ${level} of Inventory Database</span>
          </nav>
          
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #333; border-bottom: 2px solid #4a5568; padding-bottom: 10px;">
              ${trapData.brand} ${trapData.type} - Model ${trapData.model}
            </h2>
            
            <div style="margin: 20px 0;">
              <div style="display: inline-block; background: #48bb78; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 15px;">
                $${trapData.price} | ⭐ ${trapData.rating} (${trapData.reviews_count} reviews) | Stock: ${trapData.stock} units
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #2d3748; margin-top: 0;">Product Description</h3>
              <p style="color: #4a5568; line-height: 1.6;">${trapData.description}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #2d3748; margin-top: 0;">Key Features</h3>
              <ul style="color: #4a5568; line-height: 1.8;">
                ${trapData.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
            
            <div style="background: #e6fffa; padding: 15px; border-left: 4px solid #38b2ac; margin: 15px 0; border-radius: 5px;">
              <h3 style="color: #2d3748; margin-top: 0;">Customer Review</h3>
              <p style="color: #2d3748; font-style: italic; margin: 0;">"${trapData.review}"</p>
              <p style="color: #718096; font-size: 0.9em; margin-top: 5px;">- Verified Purchase, ${Math.floor(Math.random() * 30) + 1} days ago</p>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #ddd;">
            <h3 style="color: #2d3748; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Related Products</h3>
            <ul style="list-style: none; padding: 0; color: #4a5568;">
              ${links.join('')}
            </ul>
          </div>
        </div>
      </body>
    </html>
  `;
}

// --- BLUE TEAM AUTHENTICATION MIDDLEWARE ---
// Apply Blue Team auth to all routes (with skip paths for public endpoints)
app.use(blueTeamAuth({
  skipPaths: ['/stats', '/maze', '/generate-key', '/verify-wallet', '/api/email-wallet']
}));

// --- ENDPOINT 1: THE DASHBOARD FEED (The Watchtower) ---
app.get('/stats/trapped', async (req, res) => {
  const currentTime = Date.now() / 1000;
  const allTraps = await store.getAllActiveTraps();
  
  const activeIps = Object.entries(allTraps)
    .filter(([ip, data]) => data && currentTime - data.lastSeen < 30)
    .map(async ([ip, data]) => {
      const visitData = await store.getMazeVisits(ip);
      return {
        ip,
        level: data.level,
        visits: visitData ? visitData.count : 0,
        maxLevel: visitData ? visitData.maxLevel : data.level,
        rateLimited: visitData && visitData.count > MAX_MAZE_LEVELS
      };
    });
  
  const resolvedActiveIps = await Promise.all(activeIps);
  
  // Get rate limit stats
  const allVisits = await store.getAllMazeVisits();
  const rateLimitedIps = Object.entries(allVisits)
    .filter(([ip, data]) => data && data.count > MAX_MAZE_LEVELS)
    .map(([ip, data]) => ({ ip, visits: data.count, maxLevel: data.maxLevel }));
  
  const totalTrappedCount = await store.getTotalTrappedCount();
  
  res.json({
    trappedCount: totalTrappedCount,
    activeBots: resolvedActiveIps,
    rateLimited: rateLimitedIps.length,
    rateLimitedBots: rateLimitedIps,
    limits: {
      maxMazeLevels: MAX_MAZE_LEVELS,
      maxRequestsPerSecond: MAX_REQUESTS_PER_SECOND
    },
    storage: store.useRedis ? 'redis' : 'memory'
  });
});

// --- HELPER: Clean up old rate limit entries ---
async function cleanMazeRateLimit(ip) {
  const now = Date.now() / 1000;
  const rateData = await store.getMazeRequestRate(ip);
  
  if (!rateData) return;
  
  // Remove requests older than the window
  rateData.requests = rateData.requests.filter(timestamp => now - timestamp < MAZE_RATE_LIMIT_WINDOW);
  
  // Clean up if no recent requests
  if (rateData.requests.length === 0 && now - rateData.lastCleanup > 60) {
    await store.deleteMazeRequestRate(ip);
  } else {
    rateData.lastCleanup = now;
    await store.setMazeRequestRate(ip, rateData);
  }
}

// --- ENDPOINT 2: THE SPIDER TRAP (The Maze) ---
app.get('/maze/:level', async (req, res) => {
  const level = parseInt(req.params.level) || 1;
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now() / 1000;
  
  // === RATE LIMITING: Request Rate Check ===
  const existingRateData = await store.getMazeRequestRate(clientIp);
  if (!existingRateData) {
    await store.setMazeRequestRate(clientIp, { requests: [now], lastCleanup: now });
  } else {
    await cleanMazeRateLimit(clientIp);
    const rateData = await store.getMazeRequestRate(clientIp);
    
    // Check current request rate
    const recentRequests = rateData.requests.filter(timestamp => now - timestamp < MAZE_RATE_LIMIT_WINDOW);
    if (recentRequests.length >= MAX_REQUESTS_PER_SECOND) {
      // Too many requests - drop connection immediately
      console.log(`🚫 Rate limit exceeded for IP ${clientIp}: ${recentRequests.length} requests in ${MAZE_RATE_LIMIT_WINDOW}s`);
      res.status(429).send(`
        <html>
          <head><title>Rate Limit Exceeded</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>429 - Too Many Requests</h1>
            <p>You are making requests too quickly. Please slow down.</p>
            <p style="color: #666; font-size: 0.9em;">Connection dropped to protect server resources.</p>
          </body>
        </html>
      `);
      return;
    }
    
    // Add current request
    rateData.requests.push(now);
    await store.setMazeRequestRate(clientIp, rateData);
  }
  
  // === RATE LIMITING: Maze Level Cap ===
  const existingVisitData = await store.getMazeVisits(clientIp);
  if (!existingVisitData) {
    await store.setMazeVisits(clientIp, { count: 1, firstVisit: now, lastVisit: now, maxLevel: level });
  } else {
    existingVisitData.count++;
    existingVisitData.lastVisit = now;
    existingVisitData.maxLevel = Math.max(existingVisitData.maxLevel, level);
    
    // Check if exceeded max levels
    if (existingVisitData.count > MAX_MAZE_LEVELS) {
      console.log(`🚫 Maze level cap exceeded for IP ${clientIp}: ${existingVisitData.count} visits, max level ${existingVisitData.maxLevel}`);
      
      // Drop connection - return error page
      res.status(429).send(`
        <html>
          <head><title>Maze Limit Reached</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f7fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #e53e3e;">⚠️ Maze Limit Reached</h1>
              <p style="color: #4a5568; font-size: 1.1em; margin: 20px 0;">
                You have reached the maximum depth of ${MAX_MAZE_LEVELS} levels in the maze.
              </p>
              <p style="color: #718096; font-size: 0.9em;">
                Maximum level reached: ${existingVisitData.maxLevel}<br>
                Total visits: ${existingVisitData.count}
              </p>
              <div style="margin-top: 30px; padding: 20px; background: #fed7d7; border-left: 4px solid #e53e3e; border-radius: 4px;">
                <p style="color: #742a2a; margin: 0;">
                  <strong>Connection dropped</strong> to protect server resources from excessive requests.
                </p>
              </div>
            </div>
          </body>
        </html>
      `);
      return;
    }
    
    await store.setMazeVisits(clientIp, existingVisitData);
  }
  
  // Update Stats
  const existingTrap = await store.getActiveTrap(clientIp);
  if (!existingTrap) {
    await store.incrementTotalTrappedCount();
  }
  
  await store.setActiveTrap(clientIp, {
    level: level,
    lastSeen: now
  });

  // 1. The Tarpit Delay (Waste their time)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. Generate Realistic Mouse Trap Data
  const trapData = generateMouseTrapData(level);
  
  // 3. Generate Infinite Links (make them look like related products)
  const html = generateMazeHTML(level, trapData);
  
  res.send(html);
});

// --- ENDPOINT 3: THE PERSONAL API (The Vault) ---
// Protected endpoint - requires Blue Team auth or will trigger speed trap
app.get('/me', (req, res) => {
  try {
    const mePath = path.join(__dirname, 'me.json');
    if (fs.existsSync(mePath)) {
      const data = JSON.parse(fs.readFileSync(mePath, 'utf8'));
      res.json(data);
    } else {
      res.json({
        name: "OMNEE Protocol",
        jobTitle: "Universal Settlement Layer",
        location: "Ethereum Mainnet",
        availability: {
          status: "Online",
          nextOpenSlot: "Always available"
        },
        knowsAbout: [
          "Cross-chain operations",
          "Bot detection",
          "Agent authorization",
          "MNEE token management"
        ],
        contact: {
          email: "info@omnee.protocol",
          github: "https://github.com/krewdev/oMNEE-protocol"
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to read me.json" });
  }
});

// --- ENDPOINT 4: GENERATE AGENT KEY ---
// Public endpoint - no auth required
app.post('/generate-key', (req, res) => {
  const newKey = generateAgentKey();
  res.json({ key: newKey });
});

// --- ENDPOINT 5: VERIFY WALLET (Placeholder) ---
app.get('/verify-wallet/:address', (req, res) => {
  const address = req.params.address;
  // Basic validation - in production, check token balances
  res.json({
    wallet: address,
    has_access: true,
    balance: 0,
    token_type: "Ethereum",
    min_required: 0
  });
});

// --- CLEANUP TASK: Periodic cleanup of old entries ---
setInterval(async () => {
  const now = Date.now() / 1000;
  const CLEANUP_AGE = 3600; // 1 hour
  
  try {
    // Clean up old maze visits (older than 1 hour)
    const allVisits = await store.getAllMazeVisits();
    for (const [ip, data] of Object.entries(allVisits)) {
      if (data && now - data.lastVisit > CLEANUP_AGE) {
        await store.deleteMazeVisits(ip);
      }
    }
    
    // Clean up old rate limit data
    const allTraps = await store.getAllActiveTraps();
    for (const ip of Object.keys(allTraps)) {
      await cleanMazeRateLimit(ip);
    }
    
    // Clean up old active traps (older than 5 minutes)
    for (const [ip, data] of Object.entries(allTraps)) {
      if (data && now - data.lastSeen > 300) {
        await store.deleteActiveTrap(ip);
      }
    }
  } catch (error) {
    console.error('Cleanup task error:', error.message);
  }
}, 60000); // Run every minute

// --- GRACEFUL SHUTDOWN ---
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis connection...');
  await store.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis connection...');
  await store.close();
  process.exit(0);
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`\n🛡️  Blue Team Bot Trap Server Running`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔑 Agent Key: ${process.env.AGENT_KEY || "my_secret_agent_pass_123"}`);
  console.log(`⚡ Speed Trap: 0.5s threshold`);
  console.log(`🚫 Maze Limits: ${MAX_MAZE_LEVELS} levels max, ${MAX_REQUESTS_PER_SECOND} req/s per IP`);
  console.log(`💾 Storage: ${store.useRedis ? 'Redis (persistent)' : 'In-memory (fallback)'}\n`);
  console.log(`✅ Endpoints:`);
  console.log(`   GET  /stats/trapped - Bot statistics`);
  console.log(`   GET  /maze/:level - Bot trap (infinite maze)`);
  console.log(`   GET  /me - Personal API`);
  console.log(`   POST /generate-key - Generate agent key`);
  console.log(`   GET  /verify-wallet/:address - Verify wallet`);
  console.log(`\n📧 Email Wallet Endpoints:`);
  console.log(`   POST /api/email-wallet/request-code - Send verification code`);
  console.log(`   POST /api/email-wallet/verify-and-create - Create wallet`);
  console.log(`   POST /api/email-wallet/login - Login to wallet`);
  console.log(`   GET  /api/email-wallet/wallet - Get wallet info`);
  console.log(`   POST /api/email-wallet/export-key - Export private key`);
  console.log(`   POST /api/email-wallet/recover - Initiate recovery\n`);
});
