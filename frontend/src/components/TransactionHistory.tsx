import { useState } from "react";
import { History, Filter, ExternalLink, Calendar, FileText } from "lucide-react";
import { useEvents, type ProtocolEvent } from "../hooks/useEvents";
import { formatDistanceToNow, format } from "date-fns";

const EVENT_TYPES = ["All", "CollateralLocked", "RedemptionRequested", "OmniTransfer", "AgentAuthorized"] as const;

function getEventIcon(event: ProtocolEvent) {
  switch (event.type) {
    case "CollateralLocked":
      return "🔒";
    case "RedemptionRequested":
      return event.destination.startsWith("Teleport to") ? "🚀" : "💸";
    case "OmniTransfer":
      return "📤";
    case "AgentAuthorized":
      return "✅";
    default:
      return "📋";
  }
}

function getEventColor(event: ProtocolEvent) {
  switch (event.type) {
    case "CollateralLocked":
      return "text-blue-400 border-blue-700/50 bg-blue-900/20";
    case "RedemptionRequested":
      return event.destination.startsWith("Teleport to")
        ? "text-purple-400 border-purple-700/50 bg-purple-900/20"
        : "text-green-400 border-green-700/50 bg-green-900/20";
    case "OmniTransfer":
      return "text-yellow-400 border-yellow-700/50 bg-yellow-900/20";
    case "AgentAuthorized":
      return "text-green-400 border-green-700/50 bg-green-900/20";
    default:
      return "text-gray-400 border-gray-700/50 bg-gray-900/20";
  }
}

function formatEvent(event: ProtocolEvent) {
  switch (event.type) {
    case "CollateralLocked":
      return {
        title: "Deposit",
        subtitle: `${parseFloat(event.amount).toFixed(4)} MNEE locked`,
        metadata: event.purpose,
      };
    case "RedemptionRequested":
      const isTeleport = event.destination.startsWith("Teleport to");
      return {
        title: isTeleport ? "Cross-Chain Teleport" : "Redeem",
        subtitle: `${parseFloat(event.amount).toFixed(4)} omMNEE`,
        metadata: event.destination,
      };
    case "OmniTransfer":
      return {
        title: "Transfer",
        subtitle: `${parseFloat(event.value).toFixed(4)} omMNEE`,
        metadata: event.metadata || "No metadata",
      };
    case "AgentAuthorized":
      return {
        title: "Agent Authorized",
        subtitle: "New agent added to whitelist",
        metadata: event.agent,
      };
    default:
      return {
        title: "Event",
        subtitle: "",
        metadata: "",
      };
  }
}

export function TransactionHistory() {
  const { events, loading, refresh } = useEvents(100);
  const [filter, setFilter] = useState<typeof EVENT_TYPES[number]>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter((event) => {
    if (filter !== "All" && event.type !== filter) return false;
    if (!searchTerm) return true;

    const formatted = formatEvent(event);
    const searchLower = searchTerm.toLowerCase();
    return (
      formatted.title.toLowerCase().includes(searchLower) ||
      formatted.metadata.toLowerCase().includes(searchLower) ||
      event.transactionHash.toLowerCase().includes(searchLower) ||
      (event.type === "OmniTransfer" && event.to.toLowerCase().includes(searchLower)) ||
      (event.type === "OmniTransfer" && event.from.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <History className="w-6 h-6 text-primary-400" />
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        </div>
        <p className="text-gray-400">
          View all protocol events with metadata and transaction details
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by metadata, address, or tx hash..."
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof EVENT_TYPES[number])}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Events ({filteredEvents.length})
          </h3>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm || filter !== "All"
                ? "No events match your filters"
                : "No events found"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredEvents.map((event, index) => {
              const formatted = formatEvent(event);
              const eventColor = getEventColor(event);
              const timeAgo = event.timestamp
                ? formatDistanceToNow(new Date(event.timestamp * 1000), { addSuffix: true })
                : "Unknown";
              const fullDate = event.timestamp
                ? format(new Date(event.timestamp * 1000), "PPp")
                : "";

              return (
                <div
                  key={`${event.transactionHash}-${index}`}
                  className={`border rounded-xl p-5 ${eventColor} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getEventIcon(event)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {formatted.title}
                          </h4>
                          <p className="text-sm text-gray-300">{formatted.subtitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>{timeAgo}</span>
                          </div>
                          {fullDate && (
                            <p className="text-xs text-gray-500">{fullDate}</p>
                          )}
                        </div>
                      </div>

                      {/* Metadata Display */}
                      {formatted.metadata && (
                        <div className="mt-3 pt-3 border-t border-gray-700/30">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400 mb-1">Metadata:</p>
                              <p className="text-sm font-mono break-words text-gray-200">
                                {formatted.metadata}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Addresses for OmniTransfer */}
                      {event.type === "OmniTransfer" && (
                        <div className="mt-3 pt-3 border-t border-gray-700/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">From:</p>
                            <p className="text-xs font-mono text-gray-300 break-all">
                              {event.from}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">To:</p>
                            <p className="text-xs font-mono text-gray-300 break-all">
                              {event.to}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Transaction Link */}
                      <div className="mt-4 pt-3 border-t border-gray-700/30">
                        <a
                          href={`https://etherscan.io/tx/${event.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary-300 hover:text-primary-200 transition-colors"
                        >
                          <span className="font-mono text-xs break-all">
                            {event.transactionHash.slice(0, 20)}...
                            {event.transactionHash.slice(-8)}
                          </span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

