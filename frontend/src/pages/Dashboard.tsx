import { BalanceCards } from "../components/BalanceCard";
import { AuthorizationStatus } from "../components/AuthorizationStatus";
import { ProtocolStats } from "../components/ProtocolStats";
import { RecentActivity } from "../components/RecentActivity";
import { useWeb3 } from "../contexts/Web3Context";

export function Dashboard() {
  const { isConnected } = useWeb3();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to QUIPO Protocol</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your dashboard and interact with QUIPO protocol
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Overview of your balances, authorization status, and recent activity
        </p>
      </div>

      <BalanceCards />

      <AuthorizationStatus />

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Protocol Statistics</h2>
        <ProtocolStats />
      </div>

      <RecentActivity />
    </div>
  );
}

