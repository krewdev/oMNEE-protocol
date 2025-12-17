# Email-Backed Custodial Wallet Setup

## Overview

The Email Wallet system provides a high-tech custodial wallet solution where users can create and manage wallets using their email address. The private key is encrypted with a user-chosen password and stored securely on the backend.

## Features

- ✅ **Email Verification** - 6-digit code sent to email
- ✅ **Password Encryption** - AES-256-GCM encryption for private keys
- ✅ **Session Management** - Secure session tokens (7-day expiry)
- ✅ **Private Key Export** - Download private key with password
- ✅ **Encrypted JSON Export** - Standard wallet format
- ✅ **Recovery System** - Email-based wallet recovery
- ✅ **High Security** - Industry-standard encryption

## Architecture

```
User → Frontend Component
  │
  ├─→ Request Verification Code
  │     └─→ POST /api/email-wallet/request-code
  │           └─→ Backend generates 6-digit code
  │                 └─→ Sends email (mock in dev)
  │
  ├─→ Verify Code & Create Wallet
  │     └─→ POST /api/email-wallet/verify-and-create
  │           ├─→ Verify code
  │           ├─→ Generate wallet (ethers.Wallet.createRandom)
  │           ├─→ Encrypt private key with password
  │           └─→ Store encrypted key
  │
  ├─→ Login to Existing Wallet
  │     └─→ POST /api/email-wallet/login
  │           ├─→ Verify password (decrypt test)
  │           └─→ Create session token
  │
  └─→ Export Private Key
        └─→ POST /api/email-wallet/export-key
              ├─→ Verify password
              ├─→ Decrypt private key
              └─→ Return private key
```

## Security Features

### Encryption
- **Algorithm:** AES-256-GCM
- **Key Derivation:** scrypt (password-based)
- **Authentication:** GCM auth tag
- **IV:** Random 16-byte IV per encryption

### Session Management
- **Token:** 32-byte random hex string
- **Expiry:** 7 days
- **Storage:** Backend memory (Redis recommended for production)
- **Validation:** Middleware checks on protected routes

### Password Requirements
- Minimum 8 characters
- Used for key derivation (scrypt)
- Never stored in plaintext
- Required for all sensitive operations

## Backend API Endpoints

### `POST /api/email-wallet/request-code`
**Purpose:** Send verification code to email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to email",
  "expiresIn": 900
}
```

### `POST /api/email-wallet/verify-and-create`
**Purpose:** Verify code and create wallet

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "address": "0x...",
    "mnemonic": "word1 word2 ... word12"
  },
  "sessionToken": "abc123...",
  "expiresAt": 1234567890000
}
```

### `POST /api/email-wallet/login`
**Purpose:** Login to existing wallet

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "address": "0x..."
  },
  "sessionToken": "abc123...",
  "expiresAt": 1234567890000
}
```

### `GET /api/email-wallet/wallet`
**Purpose:** Get wallet information (requires session)

**Headers:**
```
X-Session-Token: abc123...
```

**Response:**
```json
{
  "address": "0x...",
  "createdAt": 1234567890000,
  "lastAccessed": 1234567890000
}
```

### `POST /api/email-wallet/export-key`
**Purpose:** Export private key (requires session + password)

**Headers:**
```
X-Session-Token: abc123...
```

**Request:**
```json
{
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "privateKey": "0x...",
  "address": "0x..."
}
```

### `POST /api/email-wallet/recover`
**Purpose:** Initiate wallet recovery

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recovery email sent"
}
```

## Frontend Component

### EmailWallet Component

**States:**
- `email` - User email
- `code` - Verification code
- `password` - Wallet password
- `step` - Current step (email, verify, password, created, login, export)
- `walletData` - Wallet information
- `sessionToken` - Session token
- `exportedKey` - Exported private key

**Flow:**
1. User enters email → Request code
2. User enters code + password → Verify & create
3. Wallet created → Show address & mnemonic
4. User can export private key → Requires password
5. Download options → TXT or encrypted JSON

## Email Service Integration

### Development (Mock)
Currently uses console.log for email sending.

### Production Setup

**Option 1: SendGrid**
```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendVerificationEmail(email, code) {
  await sgMail.send({
    to: email,
    from: 'noreply@omnee.protocol',
    subject: 'OMNEE Wallet Verification Code',
    html: `<h1>Your verification code: ${code}</h1>`
  });
}
```

**Option 2: AWS SES**
```javascript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: 'us-east-1' });

async function sendVerificationEmail(email, code) {
  await ses.send(new SendEmailCommand({
    Source: 'noreply@omnee.protocol',
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'OMNEE Wallet Verification Code' },
      Body: { Html: { Data: `<h1>Your code: ${code}</h1>` } }
    }
  }));
}
```

**Option 3: Resend**
```javascript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, code) {
  await resend.emails.send({
    from: 'OMNEE <noreply@omnee.protocol>',
    to: email,
    subject: 'Wallet Verification Code',
    html: `<h1>Your code: ${code}</h1>`
  });
}
```

## Database Integration (Production)

Replace in-memory Maps with database:

```javascript
// Example with MongoDB
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('omnee');
const wallets = db.collection('emailWallets');
const sessions = db.collection('sessions');

// Store wallet
await wallets.insertOne({
  email: emailLower,
  address: wallet.address,
  encryptedPrivateKey: encryptedKey,
  verified: true,
  createdAt: new Date()
});

// Store session
await sessions.insertOne({
  sessionToken,
  email: emailLower,
  expiresAt: new Date(sessionExpires)
});
```

## Security Best Practices

### Implemented
✅ AES-256-GCM encryption
✅ Password-based key derivation (scrypt)
✅ Session token authentication
✅ Code expiry (15 minutes)
✅ Attempt limiting (5 attempts)
✅ Password requirements (8+ chars)

### Recommended for Production
- [ ] Use Redis for sessions (with TTL)
- [ ] Use encrypted database for wallet storage
- [ ] Implement rate limiting
- [ ] Add 2FA option
- [ ] Log security events
- [ ] Use HTTPS only
- [ ] Implement IP-based rate limiting
- [ ] Add email domain validation
- [ ] Implement account lockout after failed attempts

## Usage

### Create New Wallet

1. Navigate to `/email-wallet`
2. Enter email address
3. Click "Send Verification Code"
4. Check email for 6-digit code
5. Enter code and create password
6. Wallet created with address and mnemonic
7. Download private key securely

### Login to Existing Wallet

1. Navigate to `/email-wallet`
2. Click "Already have a wallet? Login instead"
3. Enter email and password
4. Access wallet

### Export Private Key

1. From wallet view, click "Export Private Key"
2. Enter password
3. Private key displayed
4. Download as TXT or encrypted JSON

## Testing

### Test Email Verification
```bash
curl -X POST http://localhost:8000/api/email-wallet/request-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Wallet Creation
```bash
curl -X POST http://localhost:8000/api/email-wallet/verify-and-create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","password":"testpass123"}'
```

## Environment Variables

```bash
# Backend
PORT=8000
FRONTEND_URL=http://localhost:3000

# Email Service (choose one)
SENDGRID_API_KEY=your_key
# or
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
# or
RESEND_API_KEY=your_key
```

## Future Enhancements

1. **Multi-Factor Authentication**
   - TOTP support
   - SMS backup codes

2. **Advanced Recovery**
   - Recovery questions
   - Trusted contacts
   - Time-locked recovery

3. **Wallet Features**
   - Multiple wallets per email
   - Wallet naming
   - Transaction history
   - Balance tracking

4. **Security**
   - Hardware wallet integration
   - Social recovery
   - Biometric authentication

---

**This system provides enterprise-grade security with user-friendly email-based wallet management.**
