import store from '../redis-store.js';

/**
 * Blue Team Authentication Middleware
 * 
 * Protects endpoints from bots by:
 * 1. Checking for valid agent key (X-Agent-Auth header)
 * 2. Speed trap detection (redirects bots to maze)
 * 3. Rate limiting
 */

// Configuration
const FRIENDLY_AGENT_KEY = process.env.AGENT_KEY || "my_secret_agent_pass_123";
const SPEED_TRAP_THRESHOLD = 0.5; // seconds between requests (for bots)
const AGENT_KEY_THRESHOLD = 0.2; // seconds for authenticated agents

/**
 * Main Blue Team authentication middleware
 * 
 * @param {Object} options - Middleware options
 * @param {Array<string>} options.skipPaths - Paths to skip authentication (default: ['/stats', '/maze', '/generate-key', '/verify-wallet'])
 * @param {boolean} options.requireAuth - Require authentication (default: false, just detects bots)
 * @returns {Function} Express middleware function
 */
export function blueTeamAuth(options = {}) {
  const {
    skipPaths = ['/stats', '/maze', '/generate-key', '/verify-wallet'],
    requireAuth = false
  } = options;

  return async (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const currentTime = Date.now() / 1000;

    // Skip checks for specified paths
    const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
    if (shouldSkip) {
      return next();
    }

    // 1. VIP PASS CHECK - Agent Key Authentication
    const agentKey = req.headers['x-agent-auth'];
    const walletAddress = req.headers['x-wallet-address'];
    
    if (agentKey === FRIENDLY_AGENT_KEY) {
      // Authenticated agent - bypass speed trap
      // Still log the request for analytics
      await store.setRequestLog(clientIp, currentTime);
      
      // Attach auth info to request for downstream use
      req.blueTeamAuth = {
        authenticated: true,
        agentKey: agentKey,
        walletAddress: walletAddress,
        ip: clientIp
      };
      
      return next();
    }

    // 2. SPEED TRAP (for non-authenticated requests)
    const lastRequestTime = await store.getRequestLog(clientIp) || 0;
    await store.setRequestLog(clientIp, currentTime);
    const timeDiff = currentTime - lastRequestTime;

    // If they are hitting endpoints too fast (< threshold)
    if (timeDiff < SPEED_TRAP_THRESHOLD) {
      // REDIRECT TO TRAP (Level 1 of the maze)
      console.log(`🚨 Speed trap triggered for IP ${clientIp}: ${timeDiff.toFixed(3)}s between requests`);
      return res.redirect(307, '/maze/1');
    }

    // If authentication is required but not provided
    if (requireAuth && !agentKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid agent key in X-Agent-Auth header'
      });
    }

    // Attach auth info (unauthenticated)
    req.blueTeamAuth = {
      authenticated: false,
      ip: clientIp,
      timeSinceLastRequest: timeDiff
    };

    next();
  };
}

/**
 * Require Blue Team authentication middleware
 * Returns 401 if not authenticated
 */
export function requireBlueTeamAuth() {
  return blueTeamAuth({ requireAuth: true });
}

/**
 * Optional Blue Team authentication middleware
 * Detects bots but doesn't require auth
 */
export function optionalBlueTeamAuth() {
  return blueTeamAuth({ requireAuth: false });
}

/**
 * Verify agent key helper
 * @param {string} agentKey - Agent key to verify
 * @returns {boolean} True if valid
 */
export function verifyAgentKey(agentKey) {
  return agentKey === FRIENDLY_AGENT_KEY;
}

/**
 * Get Blue Team auth info from request
 * @param {Object} req - Express request object
 * @returns {Object|null} Auth info or null
 */
export function getAuthInfo(req) {
  return req.blueTeamAuth || null;
}

// Export configuration for reference
export const config = {
  FRIENDLY_AGENT_KEY,
  SPEED_TRAP_THRESHOLD,
  AGENT_KEY_THRESHOLD
};

