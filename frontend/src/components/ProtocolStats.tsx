import { Lock, TrendingUp } from "lucide-react";
import { useProtocolStats } from "../hooks/useContracts";

export function ProtocolStats() {
  const { totalMneeLocked, totalOmMneeSupply, loading } = useProtocolStats();

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Protocol Stats</h3>
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
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Protocol Stats</h3>
      </div>
      <div className="space-y-4">
        {/* Total MNEE Locked */}
        <div className="relative glass rounded-xl p-4 border border-green-500/30 hover:border-green-400/50 transition-all group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-200/70 font-medium">Total MNEE Locked</span>
            </div>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-100 bg-clip-text text-transparent">
            {parseFloat(totalMneeLocked).toFixed(2)}
          </p>
          <p className="text-xs text-blue-200/50 mt-1">Collateral backing omMNEE</p>
        </div>

        {/* Total omMNEE Supply */}
        <div className="relative glass rounded-xl p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-200/70 font-medium">Total omMNEE Supply</span>
            </div>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-100 bg-clip-text text-transparent">
            {parseFloat(totalOmMneeSupply).toFixed(2)}
          </p>
          <p className="text-xs text-blue-200/50 mt-1">Circulating omMNEE tokens</p>
        </div>
      </div>
    </div>
  );
}
