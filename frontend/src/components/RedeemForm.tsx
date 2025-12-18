import { useState } from "react";
import { ethers } from "ethers";
import { ArrowUpCircle, Loader2, Info, AlertTriangle } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { useBalances } from "../hooks/useContracts";
import { useAuthorization } from "../hooks/useContracts";

export function RedeemForm() {
  const { signer } = useWeb3();
  const { hubContract } = useContracts();
  const { omMneeBalance, mneeBalance, refreshBalances } = useBalances();
  const { isAuthorized, isOwner } = useAuthorization();

  const [amount, setAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canInteract = isAuthorized || isOwner;

  const handleRedeem = async () => {
    if (!hubContract || !signer || !amount) return;

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (parseFloat(amount) > parseFloat(omMneeBalance)) {
      setError("Insufficient omMNEE balance");
      return;
    }

    try {
      setRedeeming(true);
      setError(null);
      const amountWei = ethers.parseEther(amount);
      const tx = await hubContract.redeem(amountWei);
      setTxHash(tx.hash);
      await tx.wait();
      setAmount("");
      setTxHash(null);
      await refreshBalances();
    } catch (err: any) {
      setError(err.message || "Failed to redeem");
      console.error("Redeem error:", err);
    } finally {
      setRedeeming(false);
    }
  };

  const handleMax = () => {
    if (omMneeBalance) {
      setAmount(omMneeBalance);
    }
  };

  if (!canInteract) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Not Authorized</h3>
            <p className="text-gray-300">
              You need to be authorized as an agent to redeem omMNEE. Please contact
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
        <h2 className="text-2xl font-bold text-white mb-2">Redeem omMNEE</h2>
        <p className="text-gray-400">
          Burn your omMNEE tokens and receive MNEE back at a 1:1 ratio
        </p>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-400 mb-1">Important</h3>
            <p className="text-sm text-gray-300">
              Redeeming will burn your omMNEE tokens permanently. Make sure you want to
              convert back to MNEE before proceeding.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (omMNEE) to Redeem
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

        {/* Conversion Preview */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
            <h4 className="text-sm font-medium text-gray-300 mb-4">Conversion Preview</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                    <span className="text-lg">🔥</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Burn</p>
                    <p className="text-lg font-semibold text-white">
                      {parseFloat(amount).toFixed(6)} omMNEE
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowUpCircle className="w-6 h-6 text-primary-400" />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center">
                    <span className="text-lg">💰</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Receive</p>
                    <p className="text-lg font-semibold text-white">
                      {parseFloat(amount).toFixed(6)} MNEE
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Conversion Rate:</span>
                  <span className="text-green-400 font-medium">1:1</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">New MNEE Balance:</span>
                  <span className="text-white font-medium">
                    {(parseFloat(mneeBalance) + parseFloat(amount)).toFixed(6)} MNEE
                  </span>
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

        {/* Redeem Button */}
        <button
          onClick={handleRedeem}
          disabled={
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > parseFloat(omMneeBalance) ||
            redeeming
          }
          className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {redeeming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redeeming...
            </>
          ) : (
            <>
              <ArrowUpCircle className="w-5 h-5" />
              Redeem omMNEE → MNEE
            </>
          )}
        </button>
      </div>
    </div>
  );
}

