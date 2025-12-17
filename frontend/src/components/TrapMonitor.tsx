import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Activity } from "lucide-react";

interface BotStats {
  trappedCount: number;
  activeBots: Array<{ ip: string; level: number }>;
}

export function TrapMonitor() {
  const [stats, setStats] = useState<BotStats>({ trappedCount: 0, activeBots: [] });
  const [loading, setLoading] = useState(true);
  const [counterAnimating, setCounterAnimating] = useState(false);
  const previousCount = useRef(0);
  const previousBots = useRef<Array<{ ip: string; level: number }>>([]);

  const blueTeamApiUrl = import.meta.env.VITE_BLUE_TEAM_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${blueTeamApiUrl}/stats/trapped`);
        const data = await response.json();

        // Check if count increased for animation
        if (data.trappedCount > previousCount.current) {
          setCounterAnimating(true);
          setTimeout(() => setCounterAnimating(false), 600);
        }

        // Check if new bots appeared (for potential future notifications)
        const newBots = data.activeBots.filter(
          (bot: { ip: string; level: number }) =>
            !previousBots.current.some((prev) => prev.ip === bot.ip)
        );
        if (newBots.length > 0) {
          console.log(`New bots trapped: ${newBots.length}`);
        }

        previousCount.current = data.trappedCount;
        previousBots.current = data.activeBots;

        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching trap stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [blueTeamApiUrl]);

  return (
    <div className="bg-gray-900/50 border border-red-700/50 rounded-xl p-6 relative overflow-hidden">
      {/* Animated background elements with pulse */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -ml-10 -mt-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl -mr-10 -mb-10 animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Particle effects for active threats */}
      {stats.activeBots.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(Math.min(stats.activeBots.length, 5))].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-red-500 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Bot Trap Monitor</h3>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400 font-mono">LIVE</span>
          </div>
        </div>

        {/* Total Trapped Count with animation */}
        <div className="group">
          <label className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
            Total Trapped
          </label>
          <div
            className={`text-4xl font-bold text-red-400 font-mono mt-2 transition-all duration-300 ${
              counterAnimating ? "scale-125" : ""
            }`}
          >
            {loading ? "..." : stats.trappedCount}
          </div>
          {stats.activeBots.length > 0 && (
            <div className="text-xs text-gray-500 mt-1 font-mono">
              {stats.activeBots.length} active in maze
            </div>
          )}
        </div>

        {/* Active Bots List */}
        <div className="group">
          <label className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
            Active Threats
          </label>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-gray-400 text-sm">Loading...</div>
            ) : stats.activeBots.length === 0 ? (
              <div className="text-gray-500 text-sm italic">No active threats detected</div>
            ) : (
              stats.activeBots.map((bot, index) => (
                <div
                  key={`${bot.ip}-${bot.level}-${index}`}
                  className="bg-gray-800/50 border border-red-900/50 rounded p-3 flex justify-between items-center relative overflow-hidden transition-all duration-300 hover:border-red-700/50 hover:bg-gray-800/70"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-900/0 via-red-900/10 to-red-900/0 animate-pulse" />

                  <div className="flex items-center gap-3 relative z-10">
                    {/* Pulsing indicator */}
                    <div className="relative">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse block" />
                      <span className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-200 font-mono">{bot.ip}</span>
                      <span className="text-xs text-gray-500 font-mono">Trapped</span>
                    </div>
                  </div>

                  {/* Maze level badge with animation */}
                  <div className="relative z-10">
                    <div className="px-3 py-1 bg-red-900/30 border border-red-700/50 rounded-full">
                      <span className="text-xs text-red-400 font-mono font-bold">
                        Level {bot.level}
                      </span>
                    </div>
                    {/* Depth indicator bars */}
                    <div className="flex gap-0.5 mt-1 justify-end">
                      {[...Array(Math.min(bot.level, 5))].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-red-500 rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maze visualization */}
        {stats.activeBots.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <label className="text-xs text-gray-400 uppercase font-semibold tracking-wider block mb-2">
              Maze Depth
            </label>
            <div className="flex items-center gap-2">
              {[...Array(10)].map((_, i) => {
                const botsAtLevel = stats.activeBots.filter(
                  (bot) => bot.level === i + 1
                ).length;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full h-8 rounded border transition-all duration-300 ${
                        botsAtLevel > 0
                          ? "bg-red-900/50 border-red-700/50 animate-pulse"
                          : "bg-gray-800/30 border-gray-700/30"
                      }`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {botsAtLevel > 0 && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-red-400 font-bold">{botsAtLevel}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 mt-1 font-mono">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Footer */}
        <div className="pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-3 h-3" />
            <span>Monitoring bot activity</span>
          </div>
          <span className="text-gray-500 font-mono">
            {stats.activeBots.length > 0 ? "THREATS DETECTED" : "ALL CLEAR"}
          </span>
        </div>
      </div>
    </div>
  );
}
