import { useWeb3 } from "../contexts/Web3Context";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnect() {
  const { address, isConnected, connectWallet, disconnectWallet } = useWeb3();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass px-4 py-2 border border-cyan-500/40 rounded retro-border">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm font-mono text-cyan-300 font-semibold retro-glow">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="retro-button px-4 py-2 flex items-center gap-2 font-mono text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>DISCONNECT</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="retro-button px-5 py-2.5 flex items-center gap-2 font-mono"
    >
      <Wallet className="w-4 h-4" />
      <span>CONNECT</span>
    </button>
  );
}
