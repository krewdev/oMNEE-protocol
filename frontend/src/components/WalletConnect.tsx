import { useWeb3 } from "../contexts/Web3Context";
import { Wallet, LogOut, AlertCircle } from "lucide-react";

export function WalletConnect() {
  const { address, isConnected, isConnecting, connect, disconnect, error, chainId } = useWeb3();

  const formatAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-900/50 rounded-lg border border-primary-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono">{formatAddress(address)}</span>
          {chainId && (
            <span className="text-xs text-gray-400">
              Chain: {chainId}
            </span>
          )}
        </div>
        <button
          onClick={disconnect}
          className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/70 rounded-lg border border-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        <Wallet className="w-5 h-5" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

