// Contract addresses - Update these after deployment
export const MNEE_ADDRESS = "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF" as const;

// These should be set after contract deployment
export const HUB_ADDRESS = import.meta.env.VITE_HUB_ADDRESS || "";
export const OM_TOKEN_ADDRESS = import.meta.env.VITE_OM_TOKEN_ADDRESS || "";

// Supported chains for teleport
export const SUPPORTED_CHAINS = [
  "Solana",
  "BSV",
  "Ethereum L2",
  "Polygon",
  "Arbitrum",
] as const;

export type SupportedChain = typeof SUPPORTED_CHAINS[number];

