import { useState } from "react";
import { ethers } from "ethers";
import { Send, Loader2, Info, FileText, CheckCircle2 } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { useBalances } from "../hooks/useContracts";
import { useAuthorization } from "../hooks/useContracts";

const METADATA_EXAMPLES = [
  "Invoice #12345",
  "RWA Property ID: property-abc-123",
  "Task Hash: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "Payment for services rendered",
  "Real Estate Token ID: RE-2024-001",
];

export function TransferForm() {
  const { signer, address } = useWeb3();
  const { omTokenContract } = useContracts();
  const { omMneeBalance, refreshBalances } = useBalances();
  const { isAuthorized, isOwner } = useAuthorization();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [metadata, setMetadata] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canInteract = isAuthorized || isOwner;

  const isValidAddress = (addr: string) => {
    try {
      return ethers.isAddress(addr);
    } catch {
      return false;
    }
  };

  const handleTransfer = async () => {
    if (!omTokenContract || !signer || !recipient || !amount) return;

    if (!isValidAddress(recipient)) {
      setError("Invalid recipient address");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (parseFloat(amount) > parseFloat(omMneeBalance)) {
      setError("Insufficient omMNEE balance");
      return;
    }

    try {
      setTransferring(true);
      setError(null);
      const amountWei = ethers.parseEther(amount);
      const tx = await omTokenContract.transferWithMetadata(
        recipient,
        amountWei,
        metadata || "Transfer"
      );
      setTxHash(tx.hash);
      await tx.wait();
      setRecipient("");
      setAmount("");
      setMetadata("");
      setTxHash(null);
      await refreshBalances();
    } catch (err: any) {
      setError(err.message || "Failed to transfer");
      console.error("Transfer error:", err);
    } finally {
      setTransferring(false);
    }
  };

  const handleMax = () => {
    if (omMneeBalance) {
      setAmount(omMneeBalance);
    }
  };

  const insertExample = (example: string) => {
    setMetadata(example);
  };

  if (!canInteract) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Not Authorized</h3>
            <p className="text-gray-300">
              You need to be authorized as an agent to transfer omMNEE. Please contact
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
        <h2 className="text-2xl font-bold text-white mb-2">Transfer with Metadata</h2>
        <p className="text-gray-400">
          Send omMNEE tokens with rich metadata for tracking and RWA tokenization
        </p>
      </div>

      <div className="bg-gradient-to-br from-primary-900/30 to-primary-800/20 rounded-xl p-6 border-2 border-primary-700/50">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-primary-300">
            Programmable Money - Metadata Transfer
          </h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          This is a key feature of QUIPO Protocol. Attach contextual information to every
          transfer for RWA tracking, invoice references, and agentic transaction logging.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {METADATA_EXAMPLES.map((example, index) => (
            <button
              key={index}
              onClick={() => insertExample(example)}
              className="text-left px-3 py-2 bg-primary-800/30 hover:bg-primary-700/50 rounded-lg text-xs text-gray-300 hover:text-white transition-colors border border-primary-700/30"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
        {/* Recipient Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
          />
          {recipient && !isValidAddress(recipient) && (
            <p className="text-xs text-red-400 mt-2">Invalid address format</p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (omMNEE)
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

        {/* Metadata Input - Highlighted */}
        <div className="bg-primary-900/20 border-2 border-primary-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary-400" />
            <label className="block text-sm font-medium text-primary-300">
              Metadata <span className="text-primary-400">(Key Feature)</span>
            </label>
          </div>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder="Add metadata: Invoice #, RWA ID, Task Hash, etc."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 bg-gray-800/70 border border-primary-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              Character count: {metadata.length}/500
            </p>
            {metadata && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Metadata attached</span>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {amount && recipient && isValidAddress(recipient) && (
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Transfer Preview</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">From:</span>
                <span className="text-white font-mono text-xs">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To:</span>
                <span className="text-white font-mono text-xs">
                  {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold">{amount} omMNEE</span>
              </div>
              {metadata && (
                <div className="pt-2 border-t border-gray-700/50">
                  <div className="text-gray-400 text-xs mb-1">Metadata:</div>
                  <div className="text-primary-300 text-xs font-mono break-words">
                    {metadata}
                  </div>
                </div>
              )}
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

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={
            !recipient ||
            !amount ||
            !isValidAddress(recipient) ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > parseFloat(omMneeBalance) ||
            transferring
          }
          className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {transferring ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Transferring...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Transfer with Metadata
            </>
          )}
        </button>
      </div>
    </div>
  );
}

