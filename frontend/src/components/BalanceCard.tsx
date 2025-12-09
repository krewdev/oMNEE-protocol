import { Wallet, RefreshCw } from "lucide-react";
import { useBalances } from "../hooks/useContracts";

interface BalanceCardProps {
  title: string;
  symbol: string;
  balance: string;
  loading: boolean;
  onRefresh?: () => void;
}

export function BalanceCard({ title, symbol, balance, loading, onRefresh }: BalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary-900/50 to-primary-800/30 rounded-xl p-6 border border-primary-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-700/50 rounded-lg">
            <Wallet className="w-5 h-5 text-primary-300" />
          </div>
          <div>
            <h3 className="text-sm text-gray-400 font-medium">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{symbol}</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-primary-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-primary-300 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-32 bg-primary-800/50 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white">
            {parseFloat(balance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export function BalanceCards() {
  const { mneeBalance, omMneeBalance, loading, refreshBalances } = useBalances();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BalanceCard
        title="MNEE Balance"
        symbol="MNEE"
        balance={mneeBalance}
        loading={loading}
        onRefresh={refreshBalances}
      />
      <BalanceCard
        title="omMNEE Balance"
        symbol="omMNEE"
        balance={omMneeBalance}
        loading={loading}
        onRefresh={refreshBalances}
      />
    </div>
  );
}

