import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Rocket, Loader2, Info, AlertCircle, ExternalLink } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { useBalances } from "../hooks/useContracts";
import { useAuthorization } from "../hooks/useContracts";
import { SUPPORTED_CHAINS, type SupportedChain } from "../utils/constants";
import { BlueTeamAuth } from "./BlueTeamAuth";

export function TeleportForm() {
  const { signer } = useWeb3();
  const { hubContract } = useContracts();
  const { omMneeBalance, refreshBalances } = useBalances();
  const { isAuthorized, isOwner } = useAuthorization();

  const [amount, setAmount] = useState("");
  const [targetChain, setTargetChain] = useState<SupportedChain | "">("");
  const [targetAddress, setTargetAddress] = useState("");
  const [relayerFee, setRelayerFee] = useState("");
  const [relayerFeePercent, setRelayerFeePercent] = useState(0.5); // Default 0.5% of amount
  const [teleporting, setTeleporting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blueTeamVerified, setBlueTeamVerified] = useState(false);

  const canInteract = isAuthorized || isOwner;

  const validateAddress = (chain: SupportedChain, addr: string): boolean => {
    // Basic validation - in production, use chain-specific validators
    if (chain === "Solana") {
      // Solana addresses are base58 encoded, typically 32-44 characters
      return addr.length >= 32 && addr.length <= 44;
    } else if (chain === "BSV") {
      // BSV addresses are similar to Bitcoin
      return addr.length >= 26 && addr.length <= 35;
    } else {
      // Ethereum-based chains use hex addresses
      return ethers.isAddress(addr);
    }
  };

  const handleTeleport = async () => {
    if (!hubContract || !signer || !amount || !targetChain || !targetAddress) return;

    if (!blueTeamVerified) {
      setError("Please complete Blue Team bot verification before teleporting");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    const amountNum = parseFloat(amount);
    const feeNum = parseFloat(relayerFee);
    const totalRequired = amountNum + feeNum;

    if (totalRequired > parseFloat(omMneeBalance)) {
      setError(`Insufficient omMNEE balance. Need ${totalRequired.toFixed(6)} (${amountNum.toFixed(6)} + ${feeNum.toFixed(6)} fee)`);
      return;
    }

    if (!validateAddress(targetChain as SupportedChain, targetAddress)) {
      setError(`Invalid address format for ${targetChain}`);
      return;
    }

    try {
      setTeleporting(true);
      setError(null);
      const amountWei = ethers.parseEther(amount);
      const feeWei = ethers.parseEther(relayerFee);
      const tx = await hubContract.teleportFunds(amountWei, targetChain, targetAddress, feeWei);
      setTxHash(tx.hash);
      await tx.wait();
      setAmount("");
      setTargetChain("");
      setTargetAddress("");
      setRelayerFee("");
      setTxHash(null);
      await refreshBalances();
      // Reset verification after successful teleport
      setBlueTeamVerified(false);
    } catch (err: any) {
      setError(err.message || "Failed to teleport");
      console.error("Teleport error:", err);
    } finally {
      setTeleporting(false);
    }
  };

  const handleMax = () => {
    if (omMneeBalance) {
      setAmount(omMneeBalance);
      // Calculate relayer fee for max amount
      const maxAmount = parseFloat(omMneeBalance);
      const calculatedFee = (maxAmount * relayerFeePercent) / 100;
      // Ensure we leave room for the fee
      const adjustedAmount = maxAmount - calculatedFee;
      setAmount(adjustedAmount.toString());
      setRelayerFee(calculatedFee.toString());
    }
  };

  // Calculate relayer fee when amount changes
  const calculateRelayerFee = (amountValue: string) => {
    if (!amountValue || parseFloat(amountValue) <= 0) {
      setRelayerFee("");
      return;
    }
    const amountNum = parseFloat(amountValue);
    const fee = (amountNum * relayerFeePercent) / 100;
    // Minimum fee of 0.001 omMNEE, maximum of 1% of amount
    const minFee = 0.001;
    const maxFee = amountNum * 0.01;
    const finalFee = Math.max(minFee, Math.min(fee, maxFee));
    setRelayerFee(finalFee.toFixed(6));
  };

  // Update relayer fee when amount changes
  useEffect(() => {
    calculateRelayerFee(amount);
  }, [amount, relayerFeePercent]);

  const handleBlueTeamVerified = (verified: boolean) => {
    setBlueTeamVerified(verified);
    setError(null);
  };

  const handleBlueTeamError = (error: string) => {
    setError(error);
  };

  if (!canInteract) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Not Authorized</h3>
            <p className="text-gray-300">
              You need to be authorized as an agent to teleport funds. Please contact
              the Hub owner to get authorized.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Cross-Chain Teleport</h2>
        <p className="text-gray-400">
          Burn omMNEE on Ethereum and teleport value to another blockchain
        </p>
      </div>

      <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-purple-400 mb-1">How Teleport Works</h3>
            <p className="text-sm text-gray-300">
              Teleporting burns your omMNEE tokens here and emits an event that triggers
              the Agent Listener to mint/transfer equivalent value on the destination chain.
              MNEE collateral remains locked in the Hub, backing the cross-chain value.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
        {/* Blue Team Authentication for Cross-Chain Bots */}
        {!blueTeamVerified && (
          <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-purple-400 mb-2">
                🔒 Bot Verification Required for Cross-Chain Operations
              </h4>
              <p className="text-xs text-gray-300">
                Cross-chain teleports require Blue Team verification to ensure only authorized agents
                can perform cross-chain operations. This prevents unauthorized bots from moving OMNEE
                across chains.
              </p>
            </div>
            <BlueTeamAuth
              onVerified={handleBlueTeamVerified}
              onError={handleBlueTeamError}
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (omMNEE) to Teleport
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleMax}
              className="px-4 py-3 bg-primary-700 hover:bg-primary-600 rounded-lg font-medium transition-colors"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Available: {parseFloat(omMneeBalance).toFixed(6)} omMNEE
          </p>
        </div>

        {/* Relayer Fee */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-blue-300">
              Relayer Fee (for target chain gas)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Fee %:</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1"
                value={relayerFeePercent}
                onChange={(e) => setRelayerFeePercent(parseFloat(e.target.value) || 0.5)}
                className="w-20 px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-white text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Relayer Fee:</span>
              <span className="text-sm font-semibold text-blue-300">
                {relayerFee || "0.000000"} omMNEE
              </span>
            </div>
            {amount && parseFloat(amount) > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Teleport Amount:</span>
                  <span className="text-sm font-semibold text-white">
                    {parseFloat(amount).toFixed(6)} omMNEE
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-700/30">
                  <span className="text-sm font-medium text-gray-300">Total Required:</span>
                  <span className="text-sm font-bold text-white">
                    {(parseFloat(amount || "0") + parseFloat(relayerFee || "0")).toFixed(6)} omMNEE
                  </span>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-blue-300/80 mt-3">
            💡 This fee covers gas costs on the target chain (e.g., Solana). The relayer (Agent Listener)
            uses this to pay for the cross-chain transaction execution.
          </p>
        </div>

        {/* Target Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Chain
          </label>
          <select
            value={targetChain}
            onChange={(e) => setTargetChain(e.target.value as SupportedChain | "")}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a chain...</option>
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
        </div>

        {/* Target Address Input */}
        {targetChain && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Address on {targetChain}
            </label>
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder={
                targetChain === "Solana"
                  ? "Enter Solana address (base58)"
                  : targetChain === "BSV"
                  ? "Enter BSV address"
                  : "Enter address (0x...)"
              }
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
            {targetAddress && !validateAddress(targetChain as SupportedChain, targetAddress) && (
              <p className="text-xs text-red-400 mt-2">
                Invalid address format for {targetChain}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Address format:{" "}
              {targetChain === "Solana"
                ? "32-44 base58 characters"
                : targetChain === "BSV"
                ? "26-35 characters"
                : "0x followed by 40 hex characters"}
            </p>
          </div>
        )}

        {/* Teleport Preview */}
        {amount && targetChain && targetAddress && parseFloat(amount) > 0 && (
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
            <h4 className="text-sm font-medium text-gray-300 mb-4">Teleport Preview</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                    <span className="text-lg">🔥</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Burn on Ethereum</p>
                    <p className="text-lg font-semibold text-white">
                      {parseFloat(amount).toFixed(6)} omMNEE
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Rocket className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Mint on {targetChain}</p>
                    <p className="text-lg font-semibold text-white">
                      {parseFloat(amount).toFixed(6)} (equivalent value)
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {targetAddress.slice(0, 10)}...{targetAddress.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center">
                    <span className="text-lg">⛽</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Relayer Fee</p>
                    <p className="text-lg font-semibold text-blue-300">
                      {parseFloat(relayerFee || "0").toFixed(6)} omMNEE
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Covers {targetChain} gas costs
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700/50">
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    ⚠️ Note: Cross-chain completion requires an Agent Listener to process
                    the event. The MNEE collateral remains locked in the Hub, backing
                    the value on {targetChain}.
                  </p>
                </div>
              </div>
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-primary-400 text-sm mb-2">Teleport transaction submitted:</p>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-300 hover:text-primary-200 text-sm font-mono break-all flex items-center gap-2"
                >
                  {txHash}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-primary-700/30">
              <p className="text-xs text-primary-300">
                The burn is complete. An Agent Listener will process the cross-chain
                mint/transfer on {targetChain}.
              </p>
            </div>
          </div>
        )}

        {/* Teleport Button */}
        <button
          onClick={handleTeleport}
          disabled={
            !blueTeamVerified ||
            !amount ||
            !targetChain ||
            !targetAddress ||
            !relayerFee ||
            parseFloat(amount) <= 0 ||
            parseFloat(relayerFee) <= 0 ||
            (parseFloat(amount) + parseFloat(relayerFee || "0")) > parseFloat(omMneeBalance) ||
            !validateAddress(targetChain as SupportedChain, targetAddress) ||
            teleporting
          }
          className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {teleporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Teleporting...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Teleport to {targetChain || "Chain"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

