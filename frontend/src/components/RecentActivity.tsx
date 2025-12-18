import { Activity, ArrowRight, Clock } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { ProtocolEvent } from "../hooks/useEvents";
import { formatDistanceToNow } from "date-fns";

function formatEvent(event: ProtocolEvent) {
  switch (event.type) {
    case "CollateralLocked":
      return {
        icon: "🔒",
        title: "Deposit",
        description: `${parseFloat(event.amount).toFixed(4)} MNEE locked`,
        metadata: event.purpose,
        color: "text-blue-400",
      };
    case "RedemptionRequested":
      const isTeleport = event.destination.startsWith("Teleport to");
      return {
        icon: isTeleport ? "🚀" : "💸",
        title: isTeleport ? "Teleport" : "Redeem",
        description: `${parseFloat(event.amount).toFixed(4)} omMNEE`,
        metadata: event.destination,
        color: isTeleport ? "text-purple-400" : "text-green-400",
      };
    case "OmniTransfer":
      return {
        icon: "📤",
        title: "Transfer",
        description: `${parseFloat(event.value).toFixed(4)} omMNEE`,
        metadata: event.metadata || "No metadata",
        color: "text-yellow-400",
      };
    case "AgentAuthorized":
      return {
        icon: "✅",
        title: "Agent Authorized",
        description: "New agent added",
        metadata: event.agent,
        color: "text-green-400",
      };
    default:
      return {
        icon: "📋",
        title: "Event",
        description: "",
        metadata: "",
        color: "text-gray-400",
      };
  }
}

export function RecentActivity() {
  const { events, loading } = useEvents(10);

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 border border-blue-500/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No activity yet</p>
        ) : (
          events.map((event, index) => {
            const formatted = formatEvent(event);
            const timeAgo = event.timestamp
              ? formatDistanceToNow(new Date(event.timestamp * 1000), { addSuffix: true })
              : "Unknown";

            return (
              <div
                key={`${event.transactionHash}-${index}`}
                className="flex items-start gap-4 p-4 glass rounded-xl border border-blue-500/20 hover:border-blue-400/30 hover:glow-blue transition-all duration-300 group"
              >
                <span className="text-2xl">{formatted.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${formatted.color}`}>{formatted.title}</p>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{formatted.description}</p>
                  {formatted.metadata && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {formatted.metadata}
                    </p>
                  )}
                </div>
                <a
                  href={`https://etherscan.io/tx/${event.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}





