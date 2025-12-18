import express from 'express';
import crypto from 'crypto';
import { ethers } from 'ethers';

const router = express.Router();

// In-memory storage (use database in production)
const emailWallets = new Map(); // { email: { wallet, verified, createdAt } }
const verificationCodes = new Map(); // { email: { code, expiresAt } }
const sessions = new Map(); // { sessionId: { email, expiresAt } }

// Configuration
const CODE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const CODE_LENGTH = 6;

// Generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email (mock - replace with actual email service)
async function sendVerificationEmail(email, code) {
  // In production, use SendGrid, AWS SES, etc.
  console.log(`📧 Verification email to ${email}: Code is ${code}`);
  // Mock email sending
  return true;
}

// Send wallet recovery email (mock)
async function sendWalletRecoveryEmail(email, recoveryLink) {
  console.log(`📧 Recovery email to ${email}: ${recoveryLink}`);
  return true;
}

// POST /api/email-wallet/request-code
router.post('/request-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + CODE_EXPIRY;

    verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt,
      attempts: 0
    });

    // Send email
    await sendVerificationEmail(email, code);

    res.json({
      success: true,
      message: 'Verification code sent to email',
      expiresIn: CODE_EXPIRY / 1000 // seconds
    });
  } catch (error) {
    console.error('Error requesting code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// POST /api/email-wallet/verify-and-create
router.post('/verify-and-create', async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ error: 'Email, code, and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const emailLower = email.toLowerCase();
    const stored = verificationCodes.get(emailLower);

    if (!stored) {
      return res.status(400).json({ error: 'No verification code found. Request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(emailLower);
      return res.status(400).json({ error: 'Verification code expired. Request a new one.' });
    }

    if (stored.attempts >= 5) {
      verificationCodes.delete(emailLower);
      return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
    }

    if (stored.code !== code) {
      stored.attempts++;
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code verified - create wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Encrypt private key with password
    const encryptedKey = encryptPrivateKey(wallet.privateKey, password);
    
    // Store wallet (in production, use encrypted database)
    emailWallets.set(emailLower, {
      address: wallet.address,
      encryptedPrivateKey: encryptedKey,
      verified: true,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });

    // Create session
    const sessionToken = generateSessionToken();
    const sessionExpires = Date.now() + SESSION_EXPIRY;
    sessions.set(sessionToken, {
      email: emailLower,
      expiresAt: sessionExpires
    });

    // Clean up verification code
    verificationCodes.delete(emailLower);

    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        mnemonic: wallet.mnemonic?.phrase // Only return on creation
      },
      sessionToken,
      expiresAt: sessionExpires
    });
  } catch (error) {
    console.error('Error verifying and creating wallet:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// POST /api/email-wallet/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const emailLower = email.toLowerCase();
    const walletData = emailWallets.get(emailLower);

    if (!walletData) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Verify password by attempting decryption
    try {
      decryptPrivateKey(walletData.encryptedPrivateKey, password);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const sessionExpires = Date.now() + SESSION_EXPIRY;
    sessions.set(sessionToken, {
      email: emailLower,
      expiresAt: sessionExpires
    });

    // Update last accessed
    walletData.lastAccessed = Date.now();

    res.json({
      success: true,
      wallet: {
        address: walletData.address
      },
      sessionToken,
      expiresAt: sessionExpires
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/email-wallet/wallet (requires session)
router.get('/wallet', authenticateSession, async (req, res) => {
  try {
    const email = req.session.email;
    const walletData = emailWallets.get(email);

    if (!walletData) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      address: walletData.address,
      createdAt: walletData.createdAt,
      lastAccessed: walletData.lastAccessed
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// POST /api/email-wallet/export-key
router.post('/export-key', authenticateSession, async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.session.email;
    const walletData = emailWallets.get(email);

    if (!walletData) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Decrypt private key
    let privateKey;
    try {
      privateKey = decryptPrivateKey(walletData.encryptedPrivateKey, password);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Recreate wallet to get mnemonic if available
    const wallet = new ethers.Wallet(privateKey);

    res.json({
      success: true,
      privateKey,
      address: wallet.address,
      // Note: Mnemonic only available on initial creation
      // For existing wallets, only private key is available
    });
  } catch (error) {
    console.error('Error exporting key:', error);
    res.status(500).json({ error: 'Failed to export key' });
  }
});

// POST /api/email-wallet/recover
router.post('/recover', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const emailLower = email.toLowerCase();
    const walletData = emailWallets.get(emailLower);

    if (!walletData) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Generate recovery token
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const recoveryExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store recovery token (in production, use database)
    walletData.recoveryToken = recoveryToken;
    walletData.recoveryExpires = recoveryExpires;

    // Send recovery email
    const recoveryLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recover-wallet?token=${recoveryToken}`;
    await sendWalletRecoveryEmail(email, recoveryLink);

    res.json({
      success: true,
      message: 'Recovery email sent'
    });
  } catch (error) {
    console.error('Error initiating recovery:', error);
    res.status(500).json({ error: 'Failed to initiate recovery' });
  }
});

// Middleware: Authenticate session
function authenticateSession(req, res, next) {
  const sessionToken = req.headers['x-session-token'] || req.body.sessionToken;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Session token required' });
  }

  const session = sessions.get(sessionToken);

  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionToken);
    return res.status(401).json({ error: 'Session expired' });
  }

  req.session = session;
  next();
}

// Encryption/Decryption functions
function encryptPrivateKey(privateKey, password) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptPrivateKey(encryptedData, password) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export default router;

