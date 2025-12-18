import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Mail,
  Key,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Copy,
  RefreshCw
} from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";

const API_URL = import.meta.env.VITE_BLUE_TEAM_API_URL || "http://localhost:8000";

interface WalletData {
  address: string;
  mnemonic?: string;
  sessionToken?: string;
}

export function EmailWallet() {
  const { connectWithPrivateKey, address: connectedAddress } = useWeb3();
  const [step, setStep] = useState<"email" | "verify" | "password" | "created" | "login" | "export">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [codeExpires, setCodeExpires] = useState<number>(0);
  const [exportedKey, setExportedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem("emailWalletSession");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.expiresAt > Date.now()) {
          setSessionToken(data.sessionToken);
          setWalletData({ address: data.address });
          setStep("created");
        } else {
          localStorage.removeItem("emailWalletSession");
        }
      } catch (e) {
        // Invalid session
      }
    }
  }, []);

  const handleRequestCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/email-wallet/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      setCodeSent(true);
      setCodeExpires(Date.now() + data.expiresIn * 1000);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/email-wallet/verify-and-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create wallet");
      }

      // Store session
      localStorage.setItem(
        "emailWalletSession",
        JSON.stringify({
          sessionToken: data.sessionToken,
          address: data.wallet.address,
          expiresAt: data.expiresAt,
        })
      );

      setSessionToken(data.sessionToken);
      setWalletData(data.wallet);
      setStep("created");
      
      // Automatically connect wallet if we have mnemonic (new wallet)
      if (data.wallet.mnemonic) {
        try {
          setConnecting(true);
          // Create wallet from mnemonic to get private key
          const wallet = ethers.Wallet.fromPhrase(data.wallet.mnemonic);
          await connectWithPrivateKey(wallet.privateKey);
        } catch (connectErr: any) {
          console.error("Failed to auto-connect wallet:", connectErr);
          // Don't show error - wallet was created successfully
        } finally {
          setConnecting(false);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/email-wallet/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      // Store session
      localStorage.setItem(
        "emailWalletSession",
        JSON.stringify({
          sessionToken: data.sessionToken,
          address: data.wallet.address,
          expiresAt: data.expiresAt,
        })
      );

      setSessionToken(data.sessionToken);
      setWalletData(data.wallet);
      setStep("created");
      
      // Automatically connect wallet by exporting private key
      try {
        setConnecting(true);
        const exportResponse = await fetch(`${API_URL}/api/email-wallet/export-key`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-Token": data.sessionToken,
          },
          body: JSON.stringify({ password }),
        });

        const exportData = await exportResponse.json();
        if (exportResponse.ok && exportData.success && exportData.privateKey) {
          await connectWithPrivateKey(exportData.privateKey);
        } else {
          console.warn("Could not auto-connect: Private key export failed or not available");
        }
      } catch (connectErr: any) {
        console.error("Failed to auto-connect wallet:", connectErr);
        // Don't show error - wallet login was successful, user can connect manually later
      } finally {
        setConnecting(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleExportKey = async () => {
    if (!password) {
      setError("Password required to export private key");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/email-wallet/export-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": sessionToken || "",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to export key");
      }

      setExportedKey(data.privateKey);
      setStep("export");
    } catch (err: any) {
      setError(err.message || "Failed to export private key");
    } finally {
      setLoading(false);
    }
  };

  const downloadPrivateKey = () => {
    if (!exportedKey || !walletData) return;

    const content = `OMNEE Protocol - Email Wallet Private Key

⚠️  WARNING: KEEP THIS PRIVATE KEY SECRET!
Anyone with access to this private key can control your wallet and steal your funds.

Email: ${email}
Address: ${walletData.address}
Private Key: ${exportedKey}
${walletData.mnemonic ? `Mnemonic: ${walletData.mnemonic}` : ""}

Exported: ${new Date().toISOString()}

DO NOT SHARE THIS FILE WITH ANYONE!
DO NOT UPLOAD IT TO THE INTERNET!
STORE IT IN A SECURE LOCATION!`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-wallet-${walletData.address.slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadEncryptedJSON = async () => {
    if (!exportedKey || !password) return;

    try {
      const wallet = new ethers.Wallet(exportedKey);
      const encryptedJson = await wallet.encrypt(password);

      const blob = new Blob([encryptedJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email-wallet-${walletData?.address.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to create encrypted JSON: " + err.message);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("emailWalletSession");
    setSessionToken(null);
    setWalletData(null);
    setExportedKey(null);
    setStep("email");
    setEmail("");
    setPassword("");
    setCode("");
  };

  const formatTimeRemaining = (expires: number) => {
    const remaining = Math.max(0, expires - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (step === "created" && walletData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Wallet</h2>
          <p className="text-gray-400">Your custodial wallet is ready</p>
        </div>

        {connecting && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <p className="text-blue-300">Connecting wallet to platform...</p>
            </div>
          </div>
        )}

        {connectedAddress === walletData.address && (
          <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-green-300">Wallet connected successfully!</p>
            </div>
          </div>
        )}

        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-center gap-2 text-green-400 mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Wallet Active</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={walletData.address}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(walletData.address, "address")}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {copied === "address" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {walletData.mnemonic && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mnemonic Phrase</label>
                <div className="flex items-center gap-2">
                  <textarea
                    value={walletData.mnemonic}
                    readOnly
                    rows={2}
                    className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm font-mono resize-none"
                  />
                  <button
                    onClick={() => copyToClipboard(walletData.mnemonic!, "mnemonic")}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied === "mnemonic" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-400">
                  <p className="font-semibold mb-1">⚠️ Save Your Recovery Information</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                    <li>Save your mnemonic phrase securely</li>
                    <li>Download your private key (requires password)</li>
                    <li>Store recovery information offline</li>
                    <li>Never share your private key or mnemonic</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("export")}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export Private Key
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "export") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Export Private Key</h2>
          <p className="text-gray-400">Enter your password to export your private key</p>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
          {!exportedKey ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your wallet password"
                    className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleExportKey}
                  disabled={!password || loading}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5" />
                      Export Private Key
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep("created")}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Private Key Exported</span>
                </div>
                <p className="text-sm text-green-300/80">
                  Your private key is displayed below. Download it immediately and store it securely.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Private Key</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPrivateKey ? "text" : "password"}
                      value={exportedKey}
                      readOnly
                      className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPrivateKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(exportedKey, "privateKey")}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied === "privateKey" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-400">
                    <p className="font-semibold mb-1">⚠️ Security Warning</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                      <li>Never share your private key with anyone</li>
                      <li>Store it in a secure, offline location</li>
                      <li>Do not upload it to the internet</li>
                      <li>Anyone with your private key can control your wallet</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={downloadPrivateKey}
                  className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Private Key (TXT)
                </button>
                <button
                  onClick={downloadEncryptedJSON}
                  className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Encrypted JSON Wallet
                </button>
                <button
                  onClick={() => {
                    setExportedKey(null);
                    setPassword("");
                    setStep("created");
                  }}
                  className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
          <p className="text-gray-400">
            Enter the 6-digit code sent to <span className="font-mono text-white">{email}</span>
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
          {codeSent && codeExpires > Date.now() && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm font-medium">Code sent! Check your email.</span>
                </div>
                <span className="text-xs text-blue-300 font-mono">
                  Expires in: {formatTimeRemaining(codeExpires)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
              }}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl font-mono tracking-widest"
            />
            <p className="text-xs text-gray-500 mt-2">Enter the 6-digit code from your email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Create Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">This password encrypts your private key</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-2">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleVerifyAndCreate}
              disabled={code.length !== 6 || !password || password !== confirmPassword || loading}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Create Wallet
                </>
              )}
            </button>
            <button
              onClick={() => {
                setStep("email");
                setCode("");
                setCodeSent(false);
              }}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Back
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={handleRequestCode}
              disabled={loading}
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Resend Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login or Email step
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Email Wallet</h2>
        <p className="text-gray-400">
          Create a custodial wallet backed by your email address
        </p>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-400">
              <p className="font-semibold mb-1">🔒 Secure Custodial Wallet</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                <li>Private key encrypted with your password</li>
                <li>Email verification required</li>
                <li>Download private key anytime</li>
                <li>Full control of your wallet</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {step === "login" && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your wallet password"
                className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          {step === "email" ? (
            <button
              onClick={handleRequestCode}
              disabled={!email || loading}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Verification Code
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleLogin}
              disabled={!email || !password || loading}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging In...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Login
                </>
              )}
            </button>
          )}
        </div>

        <div className="text-center">
          {step === "email" ? (
            <button
              onClick={() => setStep("login")}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Already have a wallet? Login instead
            </button>
          ) : (
            <button
              onClick={() => {
                setStep("email");
                setPassword("");
              }}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Create new wallet instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

