import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailWalletRouter from './email-wallet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// --- CONFIGURATION ---
const FRIENDLY_AGENT_KEY = process.env.AGENT_KEY || "my_secret_agent_pass_123";
const SPEED_TRAP_THRESHOLD = 0.5; // seconds between requests (for bots)
const AGENT_KEY_THRESHOLD = 0.2; // seconds for authenticated agents
const MAX_MAZE_LEVELS = 50; // Hard cap on maze levels per IP
const MAX_REQUESTS_PER_SECOND = 10; // Max requests per second per IP for maze
const MAZE_RATE_LIMIT_WINDOW = 1; // 1 second window

// --- IN-MEMORY DATABASE (Replace with Redis for Production) ---
const activeTraps = new Map(); // { "ip": { level: number, lastSeen: timestamp } }
let totalTrappedCount = 0;
const requestLog = new Map(); // { "ip": timestamp }
const mazeVisits = new Map(); // { "ip": { count: number, firstVisit: timestamp, lastVisit: timestamp } }
const mazeRequestRate = new Map(); // { "ip": { requests: [timestamp, ...], lastCleanup: timestamp } }

// --- MIDDLEWARE ---
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:3006"],
  credentials: true
}));
app.use(express.json());

// Email wallet routes
app.use('/api/email-wallet', emailWalletRouter);

// --- HELPER FUNCTIONS ---
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

// --- THE MIDDLEWARE (The Bouncer) ---
app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const currentTime = Date.now() / 1000;
  
  // Skip checks for dashboard, maze, or key generation (these are public or already trapped)
  if (req.path.startsWith('/stats') || 
      req.path.startsWith('/maze') || 
      req.path === '/generate-key' ||
      req.path === '/verify-wallet') {
    return next();
  }
  
  // /me endpoint is protected - bots will get trapped if they hit it too fast

  // 1. VIP PASS CHECK - Legacy Agent Key
  const agentKey = req.headers['x-agent-auth'];
  if (agentKey === FRIENDLY_AGENT_KEY) {
    return next();
  }

  // 2. SPEED TRAP (for non-authenticated requests)
  const lastRequestTime = requestLog.get(clientIp) || 0;
  requestLog.set(clientIp, currentTime);
  const timeDiff = currentTime - lastRequestTime;
  
  // If they are hitting regular endpoints too fast (< 0.5s)
  if (timeDiff < SPEED_TRAP_THRESHOLD) {
    // REDIRECT TO TRAP (Level 1 of the maze)
    return res.redirect(307, '/maze/1');
  }

  next();
});

// --- ENDPOINT 1: THE DASHBOARD FEED (The Watchtower) ---
app.get('/stats/trapped', (req, res) => {
  const currentTime = Date.now() / 1000;
  const activeIps = Array.from(activeTraps.entries())
    .filter(([ip, data]) => currentTime - data.lastSeen < 30)
    .map(([ip, data]) => ({ ip, level: data.level }));
  
  res.json({
    trappedCount: totalTrappedCount,
    activeBots: activeIps
  });
});

// --- HELPER: Clean up old rate limit entries ---
function cleanMazeRateLimit(ip) {
  const now = Date.now() / 1000;
  const rateData = mazeRequestRate.get(ip);
  
  if (!rateData) return;
  
  // Remove requests older than the window
  rateData.requests = rateData.requests.filter(timestamp => now - timestamp < MAZE_RATE_LIMIT_WINDOW);
  
  // Clean up if no recent requests
  if (rateData.requests.length === 0 && now - rateData.lastCleanup > 60) {
    mazeRequestRate.delete(ip);
  } else {
    rateData.lastCleanup = now;
    mazeRequestRate.set(ip, rateData);
  }
}

// --- ENDPOINT 2: THE SPIDER TRAP (The Maze) ---
app.get('/maze/:level', async (req, res) => {
  const level = parseInt(req.params.level) || 1;
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now() / 1000;
  
  // === RATE LIMITING: Request Rate Check ===
  if (!mazeRequestRate.has(clientIp)) {
    mazeRequestRate.set(clientIp, { requests: [now], lastCleanup: now });
  } else {
    const rateData = mazeRequestRate.get(clientIp);
    cleanMazeRateLimit(clientIp);
    
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
    mazeRequestRate.set(clientIp, rateData);
  }
  
  // === RATE LIMITING: Maze Level Cap ===
  if (!mazeVisits.has(clientIp)) {
    mazeVisits.set(clientIp, { count: 1, firstVisit: now, lastVisit: now, maxLevel: level });
  } else {
    const visitData = mazeVisits.get(clientIp);
    visitData.count++;
    visitData.lastVisit = now;
    visitData.maxLevel = Math.max(visitData.maxLevel, level);
    
    // Check if exceeded max levels
    if (visitData.count > MAX_MAZE_LEVELS) {
      console.log(`🚫 Maze level cap exceeded for IP ${clientIp}: ${visitData.count} visits, max level ${visitData.maxLevel}`);
      
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
                Maximum level reached: ${visitData.maxLevel}<br>
                Total visits: ${visitData.count}
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
    
    mazeVisits.set(clientIp, visitData);
  }
  
  // Update Stats
  if (!activeTraps.has(clientIp)) {
    totalTrappedCount++;
  }
  
  activeTraps.set(clientIp, {
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

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`\n🛡️  Blue Team Bot Trap Server Running`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔑 Agent Key: ${FRIENDLY_AGENT_KEY}`);
  console.log(`⚡ Speed Trap: ${SPEED_TRAP_THRESHOLD}s threshold\n`);
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
