import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Droplet, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";
import { useBalances } from "../hooks/useContracts";
import { BlueTeamAuth } from "./BlueTeamAuth";

// MNEE Faucet contract ABI (minimal for faucet functionality)
const FAUCET_ABI = [
  "function faucet() external",
  "function canRequestFaucet(address user) external view returns (bool canRequest, uint256 timeUntilNextRequest)",
  "function MAX_FAUCET_AMOUNT() external view returns (uint256)",
  "function FAUCET_COOLDOWN() external view returns (uint256)",
  "function getFaucetBalance() external view returns (uint256)",
  "function fundFaucet(uint256 amount) external",
];

// MNEE Faucet contract address - should be set based on deployment
// For localhost, this will be set after deployment
const FAUCET_ADDRESS = import.meta.env.VITE_FAUCET_ADDRESS || "";

export function FaucetForm() {
  const { signer, address, provider } = useWeb3();
  const { refreshBalances } = useBalances();
  const [faucetContract, setFaucetContract] = useState<ethers.Contract | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [canRequest, setCanRequest] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<string>("0");
  const [cooldown, setCooldown] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blueTeamVerified, setBlueTeamVerified] = useState(false);

  useEffect(() => {
    if (!provider || !FAUCET_ADDRESS) {
      setLoading(false);
      setFaucetContract(null);
      return;
    }

    // Validate FAUCET_ADDRESS before creating contract
    if (!FAUCET_ADDRESS || 
        FAUCET_ADDRESS === "" || 
        FAUCET_ADDRESS.includes("...") ||
        !ethers.isAddress(FAUCET_ADDRESS)) {
      // Silently skip - don't log warnings for missing config
      setLoading(false);
      setFaucetContract(null);
      return;
    }

    try {
      const contract = signer 
        ? new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, signer)
        : new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
      setFaucetContract(contract);
    } catch (err) {
      console.error("Error creating contract:", err);
      setError("Failed to connect to faucet contract");
      setLoading(false);
      setFaucetContract(null);
    }
  }, [provider, signer, address]);

  useEffect(() => {
    if (faucetContract) {
      loadFaucetInfo();
    }
  }, [faucetContract]);

  useEffect(() => {
    if (faucetContract && address) {
      checkFaucetStatus();
      const interval = setInterval(checkFaucetStatus, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [faucetContract, address]);

  const loadFaucetInfo = async () => {
    if (!faucetContract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [max, cooldownSeconds] = await Promise.all([
        faucetContract.MAX_FAUCET_AMOUNT(),
        faucetContract.FAUCET_COOLDOWN(),
      ]);
      setMaxAmount(ethers.formatEther(max));
      setCooldown(Number(cooldownSeconds));
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading faucet info:", err);
      setError(`Failed to load faucet info: ${err.message || "Contract may not be deployed or network mismatch"}`);
      setLoading(false);
      // Set defaults to prevent UI from showing "Loading..." forever
      setMaxAmount("0");
      setCooldown(0);
    }
  };

  const checkFaucetStatus = async () => {
    if (!faucetContract || !address) {
      setCanRequest(false);
      setTimeUntilNext(0);
      return;
    }

    // Validate address before using - check for formatted addresses with "..."
    if (!address || address.includes("...") || !ethers.isAddress(address)) {
      setCanRequest(false);
      setTimeUntilNext(0);
      return;
    }

    // Ensure address is checksummed and valid
    let validAddress: string;
    try {
      validAddress = ethers.getAddress(address); // Normalizes and checksums
    } catch (err) {
      console.warn("Invalid address format:", address);
      setCanRequest(false);
      setTimeUntilNext(0);
      return;
    }

    try {
      const [canReq, timeUntil] = await faucetContract.canRequestFaucet(validAddress);
      setCanRequest(canReq);
      setTimeUntilNext(Number(timeUntil));
    } catch (err: any) {
      // Only log if it's not an ENS error (which we're trying to prevent)
      if (!err.message?.includes("ENS name") && !err.message?.includes("Invalid label")) {
        console.error("Error checking faucet status:", err);
      }
      // Don't show error for status checks, just set defaults
      setCanRequest(false);
      setTimeUntilNext(0);
    }
  };

  const handleRequestFaucet = async () => {
    if (!faucetContract || !signer || !address) return;

    if (!blueTeamVerified) {
      setError("Please complete the bot verification first");
      return;
    }

    try {
      setRequesting(true);
      setError(null);
      const tx = await faucetContract.faucet();
      setTxHash(tx.hash);
      await tx.wait();
      setTxHash(null);
      await refreshBalances();
      await checkFaucetStatus();
      // Reset verification after successful request
      setBlueTeamVerified(false);
    } catch (err: any) {
      setError(err.message || "Failed to request tokens from faucet");
      console.error("Faucet error:", err);
    } finally {
      setRequesting(false);
    }
  };

  const handleBlueTeamVerified = (verified: boolean) => {
    setBlueTeamVerified(verified);
    setError(null);
  };

  const handleBlueTeamError = (error: string) => {
    setError(error);
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return "0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!FAUCET_ADDRESS) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Faucet Not Configured</h3>
            <p className="text-gray-300">
              The MNEE Faucet contract address is not set. Please deploy the MNEEFaucet contract and set
              the VITE_FAUCET_ADDRESS environment variable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Wallet Not Connected</h3>
            <p className="text-gray-300">
              Please connect your wallet to request test tokens from the faucet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Test Token Faucet</h2>
        <p className="text-gray-400">
          Request test MNEE tokens for development and testing purposes
        </p>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
        {/* Loading State */}
        {loading && !error && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading faucet information...</span>
            </div>
          </div>
        )}

        {/* Faucet Info */}
        {!loading && (
          <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Amount per request:</span>
              <span className="text-sm font-semibold text-white">
                {maxAmount} MNEE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Cooldown period:</span>
              <span className="text-sm font-semibold text-white">
                {formatTime(cooldown)}
              </span>
            </div>
          </div>
        )}

        {/* Blue Team Authentication */}
        {!blueTeamVerified && (
          <BlueTeamAuth
            onVerified={handleBlueTeamVerified}
            onError={handleBlueTeamError}
          />
        )}

        {/* Status */}
        {canRequest ? (
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">
                {blueTeamVerified ? "You can request tokens now!" : "Complete verification to request tokens"}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">
                Cooldown active. Next request available in: {formatTime(timeUntilNext)}
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Transaction Hash */}
        {txHash && (
          <div className="bg-primary-900/20 border border-primary-700/50 rounded-lg p-4">
            <p className="text-primary-400 text-sm mb-2">Transaction submitted:</p>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-300 hover:text-primary-200 text-sm font-mono break-all"
            >
              {txHash}
            </a>
          </div>
        )}

        {/* Request Button */}
        <button
          onClick={handleRequestFaucet}
          disabled={!canRequest || !blueTeamVerified || requesting || loading}
          className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {requesting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Requesting tokens...
            </>
          ) : (
            <>
              <Droplet className="w-5 h-5" />
              Request {maxAmount} MNEE
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          This faucet distributes MNEE tokens (0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF) for testing purposes.
        </p>
      </div>
    </div>
  );
}



