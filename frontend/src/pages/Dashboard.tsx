import { BalanceCard } from "../components/BalanceCard";
import { ProtocolStats } from "../components/ProtocolStats";
import { RecentActivity } from "../components/RecentActivity";
import { AuthorizationStatus } from "../components/AuthorizationStatus";
import { TrapMonitor } from "../components/TrapMonitor";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, TrendingUp, Activity } from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="relative pattern-glare">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-purple-600/10 rounded blur-xl" />
          <div className="relative glass-strong rounded p-8 border border-cyan-500/30 retro-border crt-screen">
            <h1 className="text-4xl font-bold font-mono retro-text mb-3">
              QUIPO UNIVERSAL
            </h1>
            <p className="text-cyan-300/90 text-lg font-mono tracking-wider uppercase retro-glow">
              Web3 Ledger Hub & Cross Chain Agentic Payment Solution
            </p>
          </div>
        </div>

        {/* Authorization Status */}
        <AuthorizationStatus />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BalanceCard />
          <ProtocolStats />
        </div>

        {/* Bot Trap Monitor */}
        <TrapMonitor />

        {/* Quick Actions */}
        <div className="glass-strong rounded p-6 border border-cyan-500/30 retro-border pattern-glare crt-screen">
          <h2 className="text-2xl font-bold font-mono text-cyan-400 mb-6 flex items-center gap-3 retro-text">
            <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full" />
            QUICK ACTIONS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/deposit"
              className="group relative glass rounded p-5 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 retro-border overflow-hidden crt-screen"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="p-2 bg-cyan-500/20 rounded border border-cyan-500/30">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-300/50 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold font-mono text-cyan-300 mb-1 group-hover:text-cyan-200 transition-colors retro-glow">DEPOSIT</h3>
              <p className="text-sm text-cyan-200/60 font-mono">Lock MNEE, get omMNEE</p>
            </Link>

            <Link
              to="/redeem"
              className="group relative glass rounded p-5 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 retro-border overflow-hidden crt-screen"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500/20 rounded border border-green-500/30">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-300/50 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold font-mono text-green-300 mb-1 group-hover:text-green-200 transition-colors retro-glow">REDEEM</h3>
              <p className="text-sm text-cyan-200/60 font-mono">Burn omMNEE, get MNEE</p>
            </Link>

            <Link
              to="/transfer"
              className="group relative glass rounded p-5 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 retro-border overflow-hidden crt-screen"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="p-2 bg-cyan-500/20 rounded border border-cyan-500/30">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-300/50 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold font-mono text-cyan-300 mb-1 group-hover:text-cyan-200 transition-colors retro-glow">TRANSFER</h3>
              <p className="text-sm text-cyan-200/60 font-mono">Send omMNEE with metadata</p>
            </Link>

            <Link
              to="/teleport"
              className="group relative glass rounded p-5 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 retro-border overflow-hidden crt-screen"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/20 rounded border border-purple-500/30">
                  <ArrowRight className="w-5 h-5 text-purple-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-300/50 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold font-mono text-purple-300 mb-1 group-hover:text-purple-200 transition-colors retro-glow">TELEPORT</h3>
              <p className="text-sm text-cyan-200/60 font-mono">Cross-chain transfer</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
  );
}
