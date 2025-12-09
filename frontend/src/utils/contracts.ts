import { ethers } from "ethers";
import { HUB_ADDRESS, OM_TOKEN_ADDRESS, MNEE_ADDRESS } from "./constants";

// Re-export constants for convenience
export { HUB_ADDRESS, OM_TOKEN_ADDRESS, MNEE_ADDRESS };

// Minimal ABI for QuipoHub
export const HUB_ABI = [
  "function omneeToken() view returns (address)",
  "function officialMneeToken() view returns (address)",
  "function authorizedAgents(address) view returns (bool)",
  "function owner() view returns (address)",
  "function depositAndMint(uint256 amount, string calldata metadata)",
  "function redeem(uint256 amount)",
  "function teleportFunds(uint256 amount, string calldata targetChain, string calldata targetAddress)",
  "function authorizeAgent(address _agent)",
  "event CollateralLocked(address indexed agent, uint256 amount, string purpose)",
  "event RedemptionRequested(address indexed agent, uint256 amount, string destination)",
  "event AgentAuthorized(address indexed agent)",
] as const;

// Minimal ABI for OmneeToken
export const OM_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transferWithMetadata(address to, uint256 value, string calldata metadata) returns (bool)",
  "event OmniTransfer(address indexed from, address indexed to, uint256 value, string metadata)",
] as const;

// Standard ERC20 ABI
export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

export function getHubContract(signerOrProvider: ethers.Provider | ethers.Signer) {
  if (!HUB_ADDRESS) {
    throw new Error("HUB_ADDRESS not configured. Please set VITE_HUB_ADDRESS in .env");
  }
  return new ethers.Contract(HUB_ADDRESS, HUB_ABI, signerOrProvider);
}

export function getOmTokenContract(signerOrProvider: ethers.Provider | ethers.Signer) {
  if (!OM_TOKEN_ADDRESS) {
    throw new Error("OM_TOKEN_ADDRESS not configured. Please set VITE_OM_TOKEN_ADDRESS in .env");
  }
  return new ethers.Contract(OM_TOKEN_ADDRESS, OM_TOKEN_ABI, signerOrProvider);
}

export function getMneeContract(signerOrProvider: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(MNEE_ADDRESS, ERC20_ABI, signerOrProvider);
}

