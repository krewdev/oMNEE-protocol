import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { useBalances } from "../hooks/useContracts";
import { useAuthorization } from "../hooks/useContracts";
import { HUB_ADDRESS } from "../utils/constants";

export function DepositForm() {
  const { signer, address } = useWeb3();
  const { mneeContract, hubContract } = useContracts();
  const { mneeBalance, refreshBalances } = useBalances();
  const { isAuthorized, isOwner } = useAuthorization();

  const [amount, setAmount] = useState("");
  const [metadata, setMetadata] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [approving, setApproving] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canInteract = isAuthorized || isOwner;

  useEffect(() => {
    if (amount && mneeContract && address && HUB_ADDRESS) {
      checkApprovalStatus();
    }
  }, [amount, mneeContract, address]);

  const checkApprovalStatus = async () => {
    if (!mneeContract || !address || !amount || !HUB_ADDRESS) return;

    try {
      setCheckingApproval(true);
      const amountWei = ethers.parseEther(amount);
      const allowance = await mneeContract.allowance(address, HUB_ADDRESS);
      setIsApproved(allowance >= amountWei);
    } catch (err) {
      console.error("Error checking approval:", err);
    } finally {
      setCheckingApproval(false);
    }
  };

  const handleApprove = async () => {
    if (!mneeContract || !signer || !amount || !HUB_ADDRESS) return;

    try {
      setApproving(true);
      setError(null);
      const amountWei = ethers.parseEther(amount);
      const tx = await mneeContract.approve(HUB_ADDRESS, amountWei);
      await tx.wait();
      setIsApproved(true);
      await checkApprovalStatus();
    } catch (err: any) {
      setError(err.message || "Failed to approve MNEE");
      console.error("Approval error:", err);
    } finally {
      setApproving(false);
    }
  };

  const handleDeposit = async () => {
    if (!hubContract || !signer || !amount) return;

    try {
      setDepositing(true);
      setError(null);
      const amountWei = ethers.parseEther(amount);
      const tx = await hubContract.depositAndMint(amountWei, metadata || "Deposit");
      setTxHash(tx.hash);
      await tx.wait();
      setAmount("");
      setMetadata("");
      setTxHash(null);
      await refreshBalances();
      await checkApprovalStatus();
    } catch (err: any) {
      setError(err.message || "Failed to deposit");
      console.error("Deposit error:", err);
    } finally {
      setDepositing(false);
    }
  };

  const handleMax = () => {
    if (mneeBalance) {
      setAmount(mneeBalance);
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
              You need to be authorized as an agent to deposit and mint omMNEE. Please contact
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
        <h2 className="text-2xl font-bold text-white mb-2">Deposit & Mint</h2>
        <p className="text-gray-400">
          Lock your MNEE tokens and mint omMNEE at a 1:1 ratio
        </p>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (MNEE)
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
            Available: {parseFloat(mneeBalance).toFixed(6)} MNEE
          </p>
        </div>

        {/* Metadata Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Purpose/Metadata <span className="text-gray-500">(Optional but recommended)</span>
          </label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder="e.g., RWA Collateral for Real Estate Property #456"
            rows={3}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Add context about this deposit (invoice IDs, RWA references, etc.)
          </p>
        </div>

        {/* Approval Status */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-gray-800/30 rounded-lg p-4">
            {checkingApproval ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Checking approval status...</span>
              </div>
            ) : isApproved ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">MNEE approved for deposit</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-yellow-400">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Approval required</span>
                </div>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {approving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve MNEE"
                  )}
                </button>
              </div>
            )}
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

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) <= 0 || !isApproved || depositing}
          className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {depositing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Depositing...
            </>
          ) : (
            "Deposit & Mint omMNEE"
          )}
        </button>
      </div>
    </div>
  );
}

