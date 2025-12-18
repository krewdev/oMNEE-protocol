import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  connectWithPrivateKey: (privateKey: string, rpcUrl?: string) => Promise<void>;
  disconnectWallet: () => void;
  chainId: number | null;
  connectionType: 'metamask' | 'privatekey' | null;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  isConnected: false,
  connectWallet: async () => {},
  connectWithPrivateKey: async () => {},
  disconnectWallet: () => {},
  chainId: null,
  connectionType: null,
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
  const [connectionType, setConnectionType] = useState<'metamask' | 'privatekey' | null>(null);

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

      // Create provider with ENS disabled to avoid resolution errors
      const browserProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider, undefined, {
        staticNetwork: true, // Disable ENS resolution
      });
      setProvider(browserProvider);

      // Get signer
      const browserSigner = await browserProvider.getSigner();
      setSigner(browserSigner);

      // Get address directly (no ENS resolution)
      const userAddress = await browserSigner.getAddress();
      
      // Validate address
      if (!ethers.isAddress(userAddress)) {
        throw new Error("Invalid address received from wallet");
      }
      
      setAddress(userAddress);

      // Get chain ID
      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));

      setIsConnected(true);
      setConnectionType('metamask');

      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      }
    } catch (error: any) {
      // Provide user-friendly error messages
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
        // User cancelled - don't show error
        return;
      }
      console.error("Error connecting wallet:", error);
      alert(`Failed to connect wallet: ${errorMessage}. Please make sure MetaMask is installed and unlocked.`);
    }
  };

  // Connect with private key (for generated wallets)
  const connectWithPrivateKey = async (privateKey: string, rpcUrl?: string) => {
    try {
      // Use provided RPC URL or default to Ethereum mainnet
      const rpcEndpoint = rpcUrl || import.meta.env.VITE_RPC_URL || "https://eth.llamarpc.com";
      
      // Create JSON-RPC provider with ENS disabled to avoid resolution errors
      const jsonRpcProvider = new ethers.JsonRpcProvider(rpcEndpoint, undefined, {
        staticNetwork: true, // Disable ENS resolution
      });
      setProvider(jsonRpcProvider as any); // Type assertion for compatibility

      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, jsonRpcProvider);
      setSigner(wallet as any); // Type assertion for compatibility

      // Get address directly from wallet (no ENS resolution)
      const walletAddress = wallet.address;
      setAddress(walletAddress);

      // Get chain ID
      const network = await jsonRpcProvider.getNetwork();
      setChainId(Number(network.chainId));

      setIsConnected(true);
      setConnectionType('privatekey');

      // Store connection info in sessionStorage (optional, for persistence)
      sessionStorage.setItem('wallet_connected', 'true');
      sessionStorage.setItem('wallet_address', walletAddress);
      sessionStorage.setItem('connection_type', 'privatekey');
      // Note: We don't store the private key for security
    } catch (error) {
      console.error("Error connecting with private key:", error);
      throw new Error("Failed to connect wallet with private key. Please check your private key.");
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
    setConnectionType(null);

    // Clear session storage
    sessionStorage.removeItem('wallet_connected');
    sessionStorage.removeItem('wallet_address');
    sessionStorage.removeItem('connection_type');

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
            try {
              const browserProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider, undefined, {
                staticNetwork: true, // Disable ENS resolution
              });
              setProvider(browserProvider);

              const browserSigner = await browserProvider.getSigner();
              setSigner(browserSigner);

              const userAddress = await browserSigner.getAddress();
              
              // Validate address
              if (ethers.isAddress(userAddress) && !userAddress.includes("...")) {
                setAddress(userAddress);
                const network = await browserProvider.getNetwork();
                setChainId(Number(network.chainId));
                setIsConnected(true);
                setConnectionType('metamask');

                // Set up listeners
                if (window.ethereum) {
                  window.ethereum.on("accountsChanged", handleAccountsChanged);
                  window.ethereum.on("chainChanged", handleChainChanged);
                }
              }
            } catch (providerError) {
              // Silently handle provider errors - user may not have MetaMask properly configured
              console.debug("Could not auto-connect to MetaMask:", providerError);
            }
          }
        } catch (error) {
          // Silently handle auto-connect errors - this is expected if MetaMask isn't available
          console.debug("Error auto-connecting wallet:", error);
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
        connectWithPrivateKey,
        disconnectWallet,
        chainId,
        connectionType,
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
