import { TrendingUp, Lock, Coins } from "lucide-react";
import { useProtocolStats } from "../hooks/useContracts";

export function ProtocolStats() {
  const { totalMneeLocked, totalOmMneeSupply, loading } = useProtocolStats();

  const stats = [
    {
      label: "Total MNEE Locked",
      value: totalMneeLocked,
      icon: Lock,
      color: "text-blue-400",
    },
    {
      label: "Total omMNEE Supply",
      value: totalOmMneeSupply,
      icon: Coins,
      color: "text-green-400",
    },
    {
      label: "Collateral Ratio",
      value:
        parseFloat(totalOmMneeSupply) > 0
          ? (parseFloat(totalMneeLocked) / parseFloat(totalOmMneeSupply)).toFixed(4)
          : "1.0000",
      icon: TrendingUp,
      color: "text-purple-400",
      suffix: ":1",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 ${stat.color}`} />
              <h4 className="text-sm text-gray-400 font-medium">{stat.label}</h4>
            </div>
            {loading ? (
              <div className="h-6 w-24 bg-gray-800/50 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">
                {parseFloat(stat.value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
                {stat.suffix}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

