# QUIPO Protocol Frontend

A modern React frontend for interacting with the QUIPO Protocol - the Universal Settlement Layer for AI Agents.

## Features

- 🔐 **Wallet Connection**: Connect with MetaMask or compatible wallets
- 💰 **Balance Tracking**: View MNEE and omMNEE balances
- 📊 **Dashboard**: Overview of protocol stats and recent activity
- 🔒 **Deposit & Mint**: Lock MNEE and mint omMNEE with metadata
- 📤 **Transfer with Metadata**: Send omMNEE with rich contextual metadata
- 💸 **Redeem**: Burn omMNEE and receive MNEE back
- 🚀 **Cross-Chain Teleport**: Transfer value across blockchains
- 👑 **Admin Panel**: Hub owner can authorize agents
- 📜 **Transaction History**: View all protocol events with metadata

## Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Contract Addresses**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_HUB_ADDRESS=0x...
   VITE_OM_TOKEN_ADDRESS=0x...
   ```
   
   Or update the constants in `src/utils/constants.ts` directly.

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Environment Variables

- `VITE_HUB_ADDRESS`: The deployed QuipoHub contract address
- `VITE_OM_TOKEN_ADDRESS`: The deployed OmneeToken (omMNEE) contract address

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Check Authorization**: Your authorization status is displayed on the dashboard
3. **Deposit**: If authorized, deposit MNEE to mint omMNEE
4. **Transfer**: Send omMNEE with metadata for RWA tracking
5. **Redeem**: Convert omMNEE back to MNEE
6. **Teleport**: Cross-chain transfers (requires Agent Listener backend)
7. **Admin**: If you're the Hub owner, authorize new agents

## Tech Stack

- **React 18** with TypeScript
- **Vite** for building
- **Tailwind CSS** for styling
- **ethers.js v6** for blockchain interactions
- **React Router** for routing
- **Lucide React** for icons
- **date-fns** for date formatting

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Web3)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── utils/            # Utility functions and constants
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

## Notes

- The frontend requires the contracts to be deployed and addresses configured
- Make sure you're connected to the correct network (e.g., Ethereum mainnet, Sepolia testnet)
- Only authorized agents can perform deposits, transfers, redeems, and teleports
- The Hub owner has special admin privileges

