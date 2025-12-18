// Contract addresses - can be overridden via environment variables
export const HUB_ADDRESS =
  import.meta.env.VITE_HUB_ADDRESS || "0x0000000000000000000000000000000000000000";
export const OM_TOKEN_ADDRESS =
  import.meta.env.VITE_OM_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MNEE_ADDRESS =
  import.meta.env.VITE_MNEE_ADDRESS || "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF";

// Supported chains for teleport
export type SupportedChain = "Ethereum" | "Polygon" | "Solana" | "BSV" | "Hedera";
export const SUPPORTED_CHAINS: SupportedChain[] = [
  "Ethereum",
  "Polygon",
  "Solana",
  "BSV",
  "Hedera",
];
