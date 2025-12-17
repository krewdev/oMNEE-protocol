import { ethers } from "ethers";
import { HUB_ADDRESS, OM_TOKEN_ADDRESS, MNEE_ADDRESS } from "./constants";

// ERC20 ABI (minimal - just what we need)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// QuipoHub ABI
const HUB_ABI = [
  "function depositAndMint(uint256 amount, string calldata metadata)",
  "function redeem(uint256 amount)",
  "function teleportFunds(uint256 amount, string calldata targetChain, string calldata targetAddress, uint256 relayerFee)",
  "function authorizeAgent(address _agent)",
  "function authorizedAgents(address) view returns (bool)",
  "function owner() view returns (address)",
  "function omneeToken() view returns (address)",
  "function relayerAddress() view returns (address)",
  "function getRelayerFees(address relayer) view returns (uint256)",
  "function claimRelayerFees()",
  "function setRelayerAddress(address _relayer)",
  "event CollateralLocked(address indexed agent, uint256 amount, string purpose)",
  "event RedemptionRequested(address indexed agent, uint256 amount, string destination, uint256 relayerFee)",
  "event AgentAuthorized(address indexed agent)",
  "event RelayerFeeClaimed(address indexed relayer, uint256 amount)",
];

// OmneeToken ABI
const OM_TOKEN_ABI = [
  ...ERC20_ABI,
  "function transferWithMetadata(address to, uint256 value, string calldata metadata) returns (bool)",
  "event OmniTransfer(address indexed from, address indexed to, uint256 value, string metadata)",
];

export function getHubContract(
  providerOrSigner: ethers.Provider | ethers.Signer
): ethers.Contract {
  return new ethers.Contract(HUB_ADDRESS, HUB_ABI, providerOrSigner);
}

export function getOmTokenContract(
  providerOrSigner: ethers.Provider | ethers.Signer
): ethers.Contract {
  return new ethers.Contract(OM_TOKEN_ADDRESS, OM_TOKEN_ABI, providerOrSigner);
}

export function getMneeContract(
  providerOrSigner: ethers.Provider | ethers.Signer
): ethers.Contract {
  return new ethers.Contract(MNEE_ADDRESS, ERC20_ABI, providerOrSigner);
}

// Re-export constants for convenience
export { HUB_ADDRESS, OM_TOKEN_ADDRESS, MNEE_ADDRESS };
