import { Wallet, Coins } from "lucide-react";
import { useBalances } from "../hooks/useContracts";
import { useWeb3 } from "../contexts/Web3Context";

export function BalanceCard() {
  const { mneeBalance, omMneeBalance, loading } = useBalances();
  const { isConnected } = useWeb3();

  if (!isConnected) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Your Balances</h3>
        </div>
        <p className="text-gray-400 text-sm">Connect your wallet to view balances</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Your Balances</h3>
        </div>
        <div className="space-y-4">
          <div className="h-16 bg-gray-800/50 rounded animate-pulse" />
          <div className="h-16 bg-gray-800/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/30 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Wallet className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Your Balances</h3>
      </div>
      <div className="space-y-4">
        {/* MNEE Balance */}
        <div className="relative glass rounded-xl p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-200/70 font-medium">MNEE</span>
            </div>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
            {parseFloat(mneeBalance).toFixed(4)}
          </p>
        </div>

        {/* omMNEE Balance */}
        <div className="relative glass rounded-xl p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-200/70 font-medium">omMNEE</span>
            </div>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-100 bg-clip-text text-transparent">
            {parseFloat(omMneeBalance).toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}
