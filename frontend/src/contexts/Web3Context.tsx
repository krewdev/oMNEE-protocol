import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: number | null;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  chainId: null,
});

export function useWeb3() {
  return useContext(Web3Context);
}

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if MetaMask is installed
  const checkMetaMask = () => {
    if (typeof window !== "undefined" && window.ethereum) {
      return true;
    }
    return false;
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!checkMetaMask() || !window.ethereum) {
      alert("Please install MetaMask to connect your wallet");
      return;
    }

    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Create provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      setProvider(browserProvider);

      // Get signer
      const browserSigner = await browserProvider.getSigner();
      setSigner(browserSigner);

      // Get address
      const userAddress = await browserSigner.getAddress();
      setAddress(userAddress);

      // Get chain ID
      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));

      setIsConnected(true);

      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (provider) {
      const browserSigner = await provider.getSigner();
      setSigner(browserSigner);
      const userAddress = await browserSigner.getAddress();
      setAddress(userAddress);
    }
  };

  // Handle chain changes
  const handleChainChanged = async () => {
    if (provider) {
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
      // Reload page to reset state
      window.location.reload();
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setIsConnected(false);

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    }
  };

  // Auto-connect if already connected
  useEffect(() => {
    const autoConnect = async () => {
      if (checkMetaMask() && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });

          if (accounts.length > 0) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
            setProvider(browserProvider);

            const browserSigner = await browserProvider.getSigner();
            setSigner(browserSigner);

            const userAddress = await browserSigner.getAddress();
            setAddress(userAddress);

            const network = await browserProvider.getNetwork();
            setChainId(Number(network.chainId));

            setIsConnected(true);

            // Set up listeners
            if (window.ethereum) {
              window.ethereum.on("accountsChanged", handleAccountsChanged);
              window.ethereum.on("chainChanged", handleChainChanged);
            }
          }
        } catch (error) {
          console.error("Error auto-connecting wallet:", error);
        }
      }
    };

    autoConnect();

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address,
        isConnected,
        connectWallet,
        disconnectWallet,
        chainId,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (
        event: string,
        handler: (...args: any[]) => void
      ) => void;
    };
  }
}
