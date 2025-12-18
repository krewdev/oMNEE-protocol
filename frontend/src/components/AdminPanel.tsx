import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Settings, UserPlus, Loader2, CheckCircle2, Crown, Users, UserMinus } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContracts } from "../hooks/useContracts";
import { useAuthorization } from "../hooks/useContracts";
import { useProtocolStats } from "../hooks/useContracts";
import { useEvents } from "../hooks/useEvents";

export function AdminPanel() {
  const { signer } = useWeb3();
  const { hubContract } = useContracts();
  const { isOwner, checkAuthorization } = useAuthorization();
  const { totalMneeLocked, totalOmMneeSupply, loading: statsLoading } = useProtocolStats();
  const { events } = useEvents(100);

  const [agentAddress, setAgentAddress] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [authorizedAgents, setAuthorizedAgents] = useState<string[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (isOwner && hubContract && events.length > 0) {
      loadAuthorizedAgents();
    }
  }, [isOwner, hubContract, events]);

  const loadAuthorizedAgents = async () => {
    if (!hubContract || !events) return;

    try {
      setLoadingAgents(true);
      const agentAuthEvents = events.filter(
        (e) => e.type === "AgentAuthorized"
      ) as any[];
      const agentRevokedEvents = events.filter(
        (e) => e.type === "AgentRevoked"
      ) as any[];

      // Get all unique agents from auth events
      const allAgents = new Set<string>();
      agentAuthEvents.forEach((e) => allAgents.add(e.agent.toLowerCase()));

      // Verify which agents are still authorized (check current state on-chain)
      const verifiedAgents: string[] = [];
      for (const agent of allAgents) {
        try {
          const isAuthorized = await hubContract.authorizedAgents(agent);
          if (isAuthorized) {
            verifiedAgents.push(agent);
          }
        } catch (err) {
          console.error(`Error checking agent ${agent}:`, err);
        }
      }

      setAuthorizedAgents(verifiedAgents);
    } catch (err) {
      console.error("Error loading authorized agents:", err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAuthorizeAgent = async () => {
    if (!hubContract || !signer || !agentAddress) return;

    if (!ethers.isAddress(agentAddress)) {
      setError("Invalid address format");
      return;
    }

    try {
      setAuthorizing(true);
      setError(null);
      const tx = await hubContract.authorizeAgent(agentAddress);
      setTxHash(tx.hash);
      await tx.wait();
      setAgentAddress("");
      setTxHash(null);
      await loadAuthorizedAgents();
      await checkAuthorization();
    } catch (err: any) {
      setError(err.message || "Failed to authorize agent");
      console.error("Authorization error:", err);
    } finally {
      setAuthorizing(false);
    }
  };

  const handleRevokeAgent = async (agent: string) => {
    if (!hubContract || !signer) return;

    try {
      setRevoking(agent);
      setError(null);
      const tx = await hubContract.revokeAgent(agent);
      setTxHash(tx.hash);
      await tx.wait();
      setTxHash(null);
      await loadAuthorizedAgents();
      await checkAuthorization();
    } catch (err: any) {
      setError(err.message || "Failed to revoke agent");
      console.error("Revocation error:", err);
    } finally {
      setRevoking(null);
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Access Restricted</h3>
            <p className="text-gray-300">
              This panel is only accessible to the Hub owner. Only the owner can authorize
              new agents.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        </div>
        <p className="text-gray-400">Manage authorized agents and view protocol statistics</p>
      </div>

      {/* Protocol Stats */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Protocol Statistics</h3>
        {statsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-1">Total MNEE Locked</p>
              <p className="text-2xl font-bold text-white">
                {parseFloat(totalMneeLocked).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-1">Total omMNEE Supply</p>
              <p className="text-2xl font-bold text-white">
                {parseFloat(totalOmMneeSupply).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-1">Collateral Ratio</p>
              <p className="text-2xl font-bold text-green-400">
                {parseFloat(totalOmMneeSupply) > 0
                  ? (parseFloat(totalMneeLocked) / parseFloat(totalOmMneeSupply)).toFixed(4)
                  : "1.0000"}
                :1
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Authorize Agent */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Authorize New Agent</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agent Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
              <button
                onClick={handleAuthorizeAgent}
                disabled={!agentAddress || !ethers.isAddress(agentAddress) || authorizing}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {authorizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Authorize
                  </>
                )}
              </button>
            </div>
            {agentAddress && !ethers.isAddress(agentAddress) && (
              <p className="text-xs text-red-400 mt-2">Invalid address format</p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

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
        </div>
      </div>

      {/* Authorized Agents List */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Authorized Agents</h3>
        </div>

        {loadingAgents ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800/50 rounded animate-pulse" />
            ))}
          </div>
        ) : authorizedAgents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No authorized agents yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {authorizedAgents.map((agent) => (
              <div
                key={agent}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white">{agent}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Authorized Agent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRevokeAgent(agent)}
                    disabled={revoking === agent}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs transition-colors flex items-center gap-1.5"
                  >
                    {revoking === agent ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-3 h-3" />
                        Revoke
                      </>
                    )}
                  </button>
                  <a
                    href={`https://etherscan.io/address/${agent}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                  >
                    View on Etherscan
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={loadAuthorizedAgents}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          Refresh List
        </button>
      </div>
    </div>
  );
}

