import { useEffect, useState, useRef } from "react";
import { Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";

interface BlueTeamAuthProps {
  onVerified?: (verified: boolean) => void;
  onError?: (error: string) => void;
  apiUrl?: string;
}

export function BlueTeamAuth({ onVerified, onError, apiUrl }: BlueTeamAuthProps) {
  const { address } = useWeb3();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentKey, setAgentKey] = useState<string | null>(null);
  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Blue Team API URL from environment or prop
  const blueTeamApiUrl = apiUrl || import.meta.env.VITE_BLUE_TEAM_API_URL || "http://localhost:8000";

  // Generate or retrieve agent key
  const generateAgentKey = async () => {
    try {
      const response = await fetch(`${blueTeamApiUrl}/generate-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate agent key");
      }

      const data = await response.json();
      return data.key;
    } catch (err: any) {
      console.error("Error generating agent key:", err);
      throw err;
    }
  };


  // Test connection to Blue Team API (legitimate request)
  const testConnection = async () => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add agent key if available
      if (agentKey) {
        headers["X-Agent-Auth"] = agentKey;
      }

      // Add wallet address header if available
      if (address) {
        headers["X-Wallet-Address"] = address;
      }

      const response = await fetch(`${blueTeamApiUrl}/me`, {
        method: "GET",
        headers,
      });

      // If we get redirected to /maze, we're being trapped (too fast or bot-like)
      if (response.redirected && response.url.includes("/maze")) {
        return { verified: false, reason: "bot_detected" };
      }

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const data = await response.json();
      return { verified: true, data };
    } catch (err: any) {
      console.error("Connection test error:", err);
      throw err;
    }
  };

  const performVerification = async () => {
    if (!address) {
      const errMsg = "Wallet not connected";
      setError(errMsg);
      if (onError) onError(errMsg);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Generate agent key if we don't have one
      if (!agentKey) {
        const key = await generateAgentKey();
        setAgentKey(key);
      }

      // Step 2: Test connection with agent key (legitimate request)
      // Make sure to wait between requests to avoid speed trap
      await new Promise((resolve) => setTimeout(resolve, 600)); // Wait 600ms to avoid speed trap

      const result = await testConnection();

      if (result.verified) {
        setIsVerified(true);
        if (onVerified) onVerified(true);
      } else {
        throw new Error("Verification failed: Bot detected");
      }
    } catch (err: any) {
      const errMsg = err.message || "Blue Team verification failed";
      setError(errMsg);
      setIsVerified(false);
      if (onError) onError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-verify when wallet is connected
  useEffect(() => {
    if (address && !isVerified && !isLoading) {
      // Small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        performVerification();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [address]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }
    };
  }, []);

  const resetVerification = () => {
    setIsVerified(false);
    setAgentKey(null);
    setError(null);
  };

  if (!address) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-400">
            <p className="font-semibold mb-1">Wallet Not Connected</p>
            <p className="text-yellow-300/80">
              Please connect your wallet to complete Blue Team verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Blue Team Verified - You're human!</span>
          <button
            onClick={resetVerification}
            className="ml-auto text-xs text-green-300 hover:text-green-200 underline"
          >
            Verify Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-400 mb-1">
            Blue Team Bot Protection
          </h4>
          <p className="text-xs text-blue-300/80 mb-3">
            Verifying you're human and not a bot. This may take a moment...
          </p>
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded p-2 mb-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          <button
            onClick={performVerification}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Verify I'm Human
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
