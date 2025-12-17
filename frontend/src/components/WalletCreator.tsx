import { useState } from "react";
import { ethers } from "ethers";
import { 
  Wallet, 
  Download, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Loader2,
  FileText
} from "lucide-react";

interface WalletData {
  address: string;
  privateKey: string;
  mnemonic?: string;
}

export function WalletCreator() {
  const [walletType, setWalletType] = useState<"random" | "mnemonic" | "privateKey">("random");
  const [customMnemonic, setCustomMnemonic] = useState("");
  const [customPrivateKey, setCustomPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [createdWallet, setCreatedWallet] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generateRandomWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  };

  const generateFromMnemonic = (mnemonic: string) => {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic,
      };
    } catch (err: any) {
      throw new Error("Invalid mnemonic phrase: " + err.message);
    }
  };

  const generateFromPrivateKey = (privateKey: string) => {
    try {
      // Remove 0x prefix if present
      const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
      const wallet = new ethers.Wallet("0x" + cleanKey);
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
    } catch (err: any) {
      throw new Error("Invalid private key: " + err.message);
    }
  };

  const handleCreateWallet = async () => {
    setError(null);
    setCreating(true);

    try {
      let walletData: WalletData;

      switch (walletType) {
        case "random":
          walletData = generateRandomWallet();
          break;
        case "mnemonic":
          if (!customMnemonic.trim()) {
            throw new Error("Please enter a mnemonic phrase");
          }
          walletData = generateFromMnemonic(customMnemonic.trim());
          break;
        case "privateKey":
          if (!customPrivateKey.trim()) {
            throw new Error("Please enter a private key");
          }
          walletData = generateFromPrivateKey(customPrivateKey.trim());
          break;
        default:
          throw new Error("Invalid wallet type");
      }

      setCreatedWallet(walletData);
    } catch (err: any) {
      setError(err.message || "Failed to create wallet");
    } finally {
      setCreating(false);
    }
  };

  const downloadPrivateKey = () => {
    if (!createdWallet) return;

    const content = `MNEE Protocol - Wallet Private Key

⚠️  WARNING: KEEP THIS PRIVATE KEY SECRET!
Anyone with access to this private key can control your wallet and steal your funds.

Address: ${createdWallet.address}
Private Key: ${createdWallet.privateKey}
${createdWallet.mnemonic ? `Mnemonic: ${createdWallet.mnemonic}` : ""}

Generated: ${new Date().toISOString()}

DO NOT SHARE THIS FILE WITH ANYONE!
DO NOT UPLOAD IT TO THE INTERNET!
STORE IT IN A SECURE LOCATION!`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-${createdWallet.address.slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = async () => {
    if (!createdWallet || !password) {
      setError("Please set a password to encrypt the JSON wallet");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const wallet = new ethers.Wallet(createdWallet.privateKey);
      const encryptedJson = await wallet.encrypt(password);
      
      const blob = new Blob([encryptedJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wallet-${createdWallet.address.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to encrypt wallet: " + err.message);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const resetForm = () => {
    setCreatedWallet(null);
    setCustomMnemonic("");
    setCustomPrivateKey("");
    setPassword("");
    setConfirmPassword("");
    setShowPrivateKey(false);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Create New Wallet</h2>
        <p className="text-gray-400">
          Generate a new wallet or import from mnemonic/private key. Download your private key securely.
        </p>
      </div>

      {!createdWallet ? (
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-6">
          {/* Wallet Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Wallet Creation Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setWalletType("random")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  walletType === "random"
                    ? "border-primary-500 bg-primary-900/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <Wallet className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                <p className="font-semibold text-white">Random</p>
                <p className="text-xs text-gray-400 mt-1">Generate new wallet</p>
              </button>
              <button
                onClick={() => setWalletType("mnemonic")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  walletType === "mnemonic"
                    ? "border-primary-500 bg-primary-900/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <Key className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                <p className="font-semibold text-white">Mnemonic</p>
                <p className="text-xs text-gray-400 mt-1">Import from phrase</p>
              </button>
              <button
                onClick={() => setWalletType("privateKey")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  walletType === "privateKey"
                    ? "border-primary-500 bg-primary-900/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <Key className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                <p className="font-semibold text-white">Private Key</p>
                <p className="text-xs text-gray-400 mt-1">Import from key</p>
              </button>
            </div>
          </div>

          {/* Custom Inputs */}
          {walletType === "mnemonic" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mnemonic Phrase (12 or 24 words)
              </label>
              <textarea
                value={customMnemonic}
                onChange={(e) => setCustomMnemonic(e.target.value)}
                placeholder="word1 word2 word3 ..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          )}

          {walletType === "privateKey" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Private Key
              </label>
              <div className="relative">
                <input
                  type={showPrivateKey ? "text" : "password"}
                  value={customPrivateKey}
                  onChange={(e) => setCustomPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPrivateKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreateWallet}
            disabled={creating}
            className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Wallet...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Create Wallet
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Wallet created successfully!</span>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Wallet Information</h3>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={createdWallet.address}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(createdWallet.address, "address")}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Copy address"
                >
                  {copied === "address" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Private Key */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Private Key</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    value={createdWallet.privateKey}
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
                  onClick={() => copyToClipboard(createdWallet.privateKey, "privateKey")}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Copy private key"
                >
                  {copied === "privateKey" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Mnemonic (if available) */}
            {createdWallet.mnemonic && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mnemonic Phrase</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <textarea
                      value={createdWallet.mnemonic}
                      readOnly
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdWallet.mnemonic!, "mnemonic")}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Copy mnemonic"
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

            {/* Security Warning */}
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-400">
                  <p className="font-semibold mb-1">⚠️ Security Warning</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                    <li>Never share your private key or mnemonic with anyone</li>
                    <li>Store them in a secure location</li>
                    <li>Do not upload them to the internet</li>
                    <li>Anyone with your private key can control your wallet</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Download Options</h4>
              
              {/* Download Private Key as Text */}
              <button
                onClick={downloadPrivateKey}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Private Key (TXT)
              </button>

              {/* Download Encrypted JSON */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Encryption password"
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={downloadJSON}
                  disabled={!password || password !== confirmPassword}
                  className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Download Encrypted JSON Wallet
                </button>
              </div>
            </div>

            {/* Create Another Button */}
            <button
              onClick={resetForm}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Create Another Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
